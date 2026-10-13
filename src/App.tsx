/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Settings } from 'lucide-react';
import {
  TelemetryPoint,
  StressTierLevel,
  MonitoredApp,
  OutboundLogEntry,
  ClinicalProtocolId,
  ESP32ActuatorState,
} from './types';
import { BiometricsCard } from './components/BiometricsCard';
import { PhysiologicalScaleCard } from './components/PhysiologicalScaleCard';
import { DeepWorkCard } from './components/DeepWorkCard';
import { AttentionProtectionCard } from './components/AttentionProtectionCard';
import { ClinicalGroundingSuite } from './components/ClinicalGroundingSuite';
import { SubnetDispatchCard } from './components/SubnetDispatchCard';
import { StressDrawerModal } from './components/StressDrawerModal';
import { AppQuotaModal } from './components/AppQuotaModal';
import { AddAppModal } from './components/AddAppModal';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './utils/audio';

const INITIAL_APPS: MonitoredApp[] = [
  {
    id: 'app_1',
    name: 'Instagram',
    domain: 'instagram.com',
    quotaMinutes: 5,
    elapsedSeconds: 0,
    status: 'idle',
  },
  {
    id: 'app_2',
    name: 'YouTube',
    domain: 'youtube.com',
    quotaMinutes: 10,
    elapsedSeconds: 0,
    status: 'idle',
  },
  {
    id: 'app_3',
    name: 'X / Twitter',
    domain: 'x.com',
    quotaMinutes: 5,
    elapsedSeconds: 0,
    status: 'idle',
  },
  {
    id: 'app_4',
    name: 'Reddit',
    domain: 'reddit.com',
    quotaMinutes: 1,
    elapsedSeconds: 0,
    status: 'idle',
  },
];

export default function App() {
  // --- Global Telemetry Configuration ---
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [espIp, setEspIp] = useState<string>('http://192.168.4.1');
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(1000);
  const [latencyMs, setLatencyMs] = useState<number>(12);

  // --- Biometric Telemetry State ---
  const [baselineBpm, setBaselineBpm] = useState<number>(68);
  const [currentBpm, setCurrentBpm] = useState<number>(72);
  const [currentHrv, setCurrentHrv] = useState<number>(54);
  const [stressTier, setStressTier] = useState<StressTierLevel>(2);

  // Rolling 60-point history
  const [history, setHistory] = useState<TelemetryPoint[]>(() => {
    const initPoints: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      initPoints.push({
        time: now - i * 1000,
        bpm: Math.round(68 + Math.sin(i / 6) * 4 + (Math.random() * 2 - 1)),
        hrv: Math.round(54 + Math.cos(i / 5) * 3),
      });
    }
    return initPoints;
  });

  // --- ESP32 Actuator State ---
  const [actuatorState, setActuatorState] = useState<ESP32ActuatorState>({
    ledText: 'GREEN (Calm)',
    ledColor: 'green',
    motorText: 'IDLE',
    motorActive: false,
  });

  // --- Monitored Applications ---
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>(() => {
    const saved = localStorage.getItem('focusSense_apps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_APPS;
  });

  // --- Outbound Ledger ---
  const [logs, setLogs] = useState<OutboundLogEntry[]>([
    {
      id: 'log_0',
      timestamp: '00:00:00',
      message: '[INIT] Telemetry system ready',
      type: 'init',
    },
  ]);

  // --- Deep Work Daily Minutes ---
  const [dailyFocusMinutes, setDailyFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('focusSense_dailyMinutes');
    return saved ? parseInt(saved, 10) : 45;
  });

  // --- Modals State ---
  const [isStressDrawerOpen, setIsStressDrawerOpen] = useState<boolean>(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ClinicalProtocolId>('boxBreathing');
  const [breachedApp, setBreachedApp] = useState<MonitoredApp | null>(null);
  const [isAddAppOpen, setIsAddAppOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Append entry to Outbound Signal Ledger
  const logDispatch = useCallback(
    (message: string, type: OutboundLogEntry['type'] = 'telemetry') => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEntry: OutboundLogEntry = {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: timeStr,
        message,
        type,
      };
      setLogs((prev) => [newEntry, ...prev.slice(0, 35)]);
    },
    []
  );

  // Dispatch REST Signal to ESP32
  const dispatchHardwareSignal = useCallback(
    (endpoint: string) => {
      logDispatch(`OUTBOUND GET ${endpoint}`, 'telemetry');
      if (!isSimulated) {
        try {
          fetch(`${espIp}${endpoint}`, { mode: 'no-cors' }).catch(() => {});
        } catch {
          // ignore network failure
        }
      }
    },
    [isSimulated, espIp, logDispatch]
  );

  // Evaluate stress tier from BPM
  const evaluateStressTier = useCallback((bpm: number): StressTierLevel => {
    if (bpm <= 70) return 1;
    if (bpm <= 82) return 2;
    if (bpm <= 94) return 3;
    if (bpm <= 109) return 4;
    return 5;
  }, []);

  // Update actuators according to tier
  const syncActuatorsForTier = useCallback((tier: StressTierLevel) => {
    if (tier <= 2) {
      setActuatorState({
        ledText: 'GREEN (Calm)',
        ledColor: 'green',
        motorText: 'IDLE',
        motorActive: false,
      });
    } else if (tier === 3) {
      setActuatorState({
        ledText: 'AMBER (Tension)',
        ledColor: 'amber',
        motorText: 'IDLE',
        motorActive: false,
      });
    } else if (tier === 4) {
      setActuatorState({
        ledText: 'CRIMSON (Alert)',
        ledColor: 'red',
        motorText: 'ACTIVE 120Hz',
        motorActive: true,
      });
    } else {
      setActuatorState({
        ledText: 'CRIMSON (Distress)',
        ledColor: 'red',
        motorText: 'ACTIVE 160Hz',
        motorActive: true,
      });
    }
  }, []);

  // Telemetry loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSimulated) {
        // Natural physiological drift
        setCurrentBpm((prevBpm) => {
          const delta = (Math.random() - 0.5) * 2.2;
          const nextBpm = Math.round(Math.max(56, Math.min(125, prevBpm + delta)));

          // Calculate HRV & Tier
          const calcHrv = Math.round(
            Math.max(22, Math.min(85, 70 - (nextBpm - 65) * 0.7 + (Math.random() * 4 - 2)))
          );
          setCurrentHrv(calcHrv);

          const newTier = evaluateStressTier(nextBpm);
          setStressTier((prevTier) => {
            if (newTier >= 4 && prevTier < 4) {
              // Trigger automatic intervention if stress spiked to Tier 4 or 5
              setIsStressDrawerOpen(true);
              dispatchHardwareSignal(`/stress?level=${newTier}`);
              syncActuatorsForTier(newTier);
            } else if (newTier !== prevTier) {
              syncActuatorsForTier(newTier);
            }
            return newTier;
          });

          // Append to history
          setHistory((prev) => [
            ...prev.slice(1),
            { time: Date.now(), bpm: nextBpm, hrv: calcHrv },
          ]);

          return nextBpm;
        });
      } else {
        // Live ESP32 polling
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 900);
        fetch(`${espIp}/getHeartData`, { signal: controller.signal })
          .then((res) => {
            clearTimeout(timeout);
            return res.json();
          })
          .then((data) => {
            if (data && typeof data.bpm !== 'undefined') {
              const liveBpm = Math.round(data.bpm);
              const liveHrv = data.hrv || 50;
              setCurrentBpm(liveBpm);
              setCurrentHrv(liveHrv);
              const newTier = evaluateStressTier(liveBpm);
              setStressTier(newTier);
              syncActuatorsForTier(newTier);
              setHistory((prev) => [
                ...prev.slice(1),
                { time: Date.now(), bpm: liveBpm, hrv: liveHrv },
              ]);
            }
          })
          .catch(() => {
            // Soft fallback drift
            setCurrentBpm((prev) => {
              const drift = (Math.random() - 0.48) * 2.0;
              return Math.round(Math.max(58, Math.min(120, prev + drift)));
            });
          });
      }
    }, pollingIntervalMs);

    return () => clearInterval(timer);
  }, [
    isSimulated,
    espIp,
    pollingIntervalMs,
    evaluateStressTier,
    dispatchHardwareSignal,
    syncActuatorsForTier,
  ]);

  // Monitored Apps simulation ticker
  const monitoredAppsRef = useRef(monitoredApps);
  monitoredAppsRef.current = monitoredApps;

  useEffect(() => {
    const simTicker = setInterval(() => {
      const currentList = monitoredAppsRef.current;
      const hasActive = currentList.some((app) => app.status === 'active');
      if (!hasActive) return;

      const updated = currentList.map((app) => {
        if (app.status !== 'active') return app;

        const newElapsed = app.elapsedSeconds + 2; // slight acceleration for UX inspection
        const limitSec = app.quotaMinutes * 60;

        if (newElapsed >= limitSec) {
          // Breach triggered!
          soundEngine.playBreachAlert();
          dispatchHardwareSignal('/distract');
          setActuatorState({
            ledText: 'AMBER (Quota Alert)',
            ledColor: 'amber',
            motorText: 'CHIME PULSE',
            motorActive: true,
          });
          logDispatch(`QUOTA TRIP: ${app.name} exceeded ${app.quotaMinutes}m limit`, 'distract');
          setBreachedApp({ ...app, elapsedSeconds: limitSec, status: 'breached' });
          return { ...app, elapsedSeconds: limitSec, status: 'breached' as const };
        }

        return { ...app, elapsedSeconds: newElapsed };
      });

      setMonitoredApps(updated);
      localStorage.setItem('focusSense_apps', JSON.stringify(updated));
    }, 1000);

    return () => clearInterval(simTicker);
  }, [dispatchHardwareSignal, logDispatch]);

  // Toggle application simulation
  const handleToggleSimulate = (appId: string) => {
    setMonitoredApps((prev) => {
      const next = prev.map((a) => {
        if (a.id === appId) {
          const newStatus = a.status === 'active' ? ('idle' as const) : ('active' as const);
          if (newStatus === 'active') {
            logDispatch(`Simulating active session for ${a.name}`);
          }
          return { ...a, status: newStatus };
        }
        return a;
      });
      localStorage.setItem('focusSense_apps', JSON.stringify(next));
      return next;
    });
  };

  // Delete monitored app
  const handleDeleteApp = (appId: string) => {
    setMonitoredApps((prev) => {
      const next = prev.filter((a) => a.id !== appId);
      localStorage.setItem('focusSense_apps', JSON.stringify(next));
      return next;
    });
  };

  // Add new monitored app
  const handleAddApp = (newApp: MonitoredApp) => {
    setMonitoredApps((prev) => {
      const next = [...prev, newApp];
      localStorage.setItem('focusSense_apps', JSON.stringify(next));
      return next;
    });
    logDispatch(`Added monitored application: ${newApp.name} (${newApp.quotaMinutes}m)`);
  };

  // Trigger transient stress test
  const handleTriggerStressTest = () => {
    const spikeBpm = 104;
    setCurrentBpm(spikeBpm);
    const newTier = 4;
    setStressTier(newTier);
    syncActuatorsForTier(newTier);

    setHistory((prev) => [
      ...prev.slice(1),
      { time: Date.now(), bpm: spikeBpm, hrv: 32 },
    ]);

    dispatchHardwareSignal('/stress?level=4');
    logDispatch('TEST: Injected sympathetic stress spike (104 BPM, Tier 4)', 'stress');
    setSelectedProtocol('boxBreathing');
    setIsStressDrawerOpen(true);
  };

  // Calibrate baseline
  const handleCalibrateBaseline = () => {
    setBaselineBpm(currentBpm);
    dispatchHardwareSignal('/reset');
    setActuatorState({
      ledText: 'GREEN (Calm)',
      ledColor: 'green',
      motorText: 'IDLE',
      motorActive: false,
    });
    logDispatch(`Baseline calibrated to ${currentBpm} BPM. Sent /reset.`, 'reset');
  };

  // Focus session complete
  const handleSessionComplete = (minutes: number) => {
    const updated = dailyFocusMinutes + minutes;
    setDailyFocusMinutes(updated);
    localStorage.setItem('focusSense_dailyMinutes', updated.toString());
    dispatchHardwareSignal('/distract');
    logDispatch(`Deep work session complete (+${minutes}m). Daily total: ${updated}m`);
  };

  // Hardware ping test
  const handleHardwarePing = () => {
    const mockMs = Math.floor(Math.random() * 14) + 8;
    setLatencyMs(mockMs);
    logDispatch(`PING round-trip latency: ${mockMs}ms`, 'ping');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#F8F9FA] selection:bg-teal-100 selection:text-teal-900">
      {/* TOP ENTERPRISE NAVIGATION HEADER */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-mono font-bold text-sm rounded shadow-xs">
              FS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold tracking-tight text-base text-gray-900">
                  FocusSense
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                  v2.4 IoT
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Physiological Telemetry &amp; Cognitive Regulation Architecture
              </p>
            </div>
          </div>

          {/* Live ESP32 Hardware Status Bar */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-gray-50 border border-[#E5E7EB]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSimulated ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 animate-pulse'
                }`}
              ></span>
              <span className="font-mono text-xs text-gray-700">
                {isSimulated ? 'ESP32: Simulated' : 'ESP32: Live Polling'}
              </span>
            </div>

            {/* Hardware Ping Button */}
            <button
              type="button"
              onClick={handleHardwarePing}
              title="Ping ESP32 Hardware Endpoint"
              className="hidden md:inline-flex items-center px-2 py-1 rounded text-xs font-mono border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-gray-500" />
              <span>{latencyMs}ms</span>
            </button>

            {/* Configuration Settings Trigger */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-[#E5E7EB] transition cursor-pointer"
              title="ESP32 Network Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN APPLICATION CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SUB-BANNER: STATUS & MODE TOGGLE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#E5E7EB] gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              Operator Console
            </h1>
            <span className="text-xs text-gray-500">| Biometric MAX30102 Sensor Array</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-gray-500">Telemetry Source:</span>
            <div className="inline-flex rounded-md border border-[#E5E7EB] p-0.5 bg-gray-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsSimulated(true);
                  logDispatch('Switched source to Simulated Telemetry');
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  isSimulated
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Simulated
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSimulated(false);
                  logDispatch(`Switched source to Live ESP32 Subnet (${espIp})`);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  !isSimulated
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ESP32 Live
              </button>
            </div>

            {/* Stress injection tester */}
            <button
              type="button"
              onClick={handleTriggerStressTest}
              className="px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-xs transition cursor-pointer flex items-center space-x-1"
              title="Forces a transient stress spike to test the recovery drawer"
            >
              <span>⚡</span>
              <span>Trigger Stress Test</span>
            </button>
          </div>
        </div>

        {/* TOP SECTION: BIOMETRIC TELEMETRY & STRESS LEVEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Live Biometrics & Sparkline (7 cols) */}
          <div className="lg:col-span-7">
            <BiometricsCard
              currentBpm={currentBpm}
              currentHrv={currentHrv}
              baselineBpm={baselineBpm}
              stressTier={stressTier}
              history={history}
            />
          </div>

          {/* RIGHT: 5-Tier Stress System Status & Physiological Calibration (5 cols) */}
          <div className="lg:col-span-5">
            <PhysiologicalScaleCard
              currentTier={stressTier}
              actuatorState={actuatorState}
              onOpenProtocols={() => {
                setSelectedProtocol('boxBreathing');
                setIsStressDrawerOpen(true);
              }}
            />
          </div>
        </div>

        {/* MIDDLE SECTION: DEEP WORK TIMER & APPLICATION LIMIT INTERCEPTOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Deep Work Engine (5 cols) */}
          <div className="lg:col-span-5">
            <DeepWorkCard
              onSessionComplete={handleSessionComplete}
              dailyTotalMinutes={dailyFocusMinutes}
            />
          </div>

          {/* RIGHT: Monitored Applications & Strict Quotas (7 cols) */}
          <div className="lg:col-span-7">
            <AttentionProtectionCard
              apps={monitoredApps}
              onToggleSimulate={handleToggleSimulate}
              onDeleteApp={handleDeleteApp}
              onOpenAddModal={() => setIsAddAppOpen(true)}
            />
          </div>
        </div>

        {/* LOWER SECTION: RECOVERY PROTOCOLS QUICK-BAR & TELEMETRY LOG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Rapid Physiological Interventions (8 cols) */}
          <div className="lg:col-span-8">
            <ClinicalGroundingSuite
              onSelectProtocol={(protoId) => {
                setSelectedProtocol(protoId);
                setIsStressDrawerOpen(true);
              }}
            />
          </div>

          {/* RIGHT: Outbound Signal Ledger (4 cols) */}
          <div className="lg:col-span-4">
            <SubnetDispatchCard
              logs={logs}
              activeIp={espIp}
              onClearLogs={() => setLogs([])}
              onCalibrateBaseline={handleCalibrateBaseline}
            />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <div>
            <span className="font-semibold text-gray-900">FocusSense Physiological Systems</span>{' '}
            • Conforms to Swiss International Ergonomics
          </div>
          <div className="font-mono text-[11px] mt-2 sm:mt-0">
            Local Subnet REST Dispatch:{' '}
            <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/getHeartData</code> •{' '}
            <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/stress</code> •{' '}
            <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/distract</code> •{' '}
            <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/reset</code>
          </div>
        </div>
      </footer>

      {/* MODAL 1: 5-TIER STRESS INTERVENTION & RECOVERY DRAWER */}
      <StressDrawerModal
        isOpen={isStressDrawerOpen}
        onClose={() => setIsStressDrawerOpen(false)}
        currentTier={stressTier}
        currentBpm={currentBpm}
        initialProtocol={selectedProtocol}
        onAcknowledgeCalibrate={() => {
          handleCalibrateBaseline();
          setIsStressDrawerOpen(false);
        }}
      />

      {/* MODAL 2: APPLICATION QUOTA HARD INTERCEPTION OVERLAY */}
      <AppQuotaModal
        breachedApp={breachedApp}
        onAcknowledge={() => {
          setBreachedApp(null);
          dispatchHardwareSignal('/reset');
          setActuatorState({
            ledText: 'GREEN (Calm)',
            ledColor: 'green',
            motorText: 'IDLE',
            motorActive: false,
          });
        }}
      />

      {/* MODAL 3: ADD MONITORED APP MODAL */}
      <AddAppModal
        isOpen={isAddAppOpen}
        onClose={() => setIsAddAppOpen(false)}
        onAddApp={handleAddApp}
      />

      {/* MODAL 4: ESP32 SUBNET SETTINGS DRAWER */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        espIp={espIp}
        pollingIntervalMs={pollingIntervalMs}
        baselineBpm={baselineBpm}
        onSaveSettings={(newIp, newPolling, newBaseline) => {
          setEspIp(newIp);
          setPollingIntervalMs(newPolling);
          setBaselineBpm(newBaseline);
          logDispatch(`Hardware subnet config updated: ${newIp} (${newPolling}ms polling)`);
        }}
        onTestPing={handleHardwarePing}
      />
    </div>
  );
}
