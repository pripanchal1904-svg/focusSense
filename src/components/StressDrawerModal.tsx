import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ClinicalProtocolId, StressTierLevel } from '../types';
import { soundEngine } from '../utils/audio';

interface StressDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: StressTierLevel;
  currentBpm: number;
  initialProtocol: ClinicalProtocolId;
  onAcknowledgeCalibrate: () => void;
}

export const StressDrawerModal: React.FC<StressDrawerModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  currentBpm,
  initialProtocol,
  onAcknowledgeCalibrate,
}) => {
  const [activeTab, setActiveTab] = useState<ClinicalProtocolId>(initialProtocol);

  // Sync activeTab when initialProtocol changes upon opening
  useEffect(() => {
    setActiveTab(initialProtocol);
  }, [initialProtocol]);

  // --- 1. Box Breathing State ---
  const [breathPhaseIndex, setBreathPhaseIndex] = useState<number>(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(4);
  const [isAudioGuideEnabled, setIsAudioGuideEnabled] = useState<boolean>(true);

  const breathPhases = [
    { label: 'INHALE', sub: 'Draw air slowly through nose (4s)', scale: 1.25, type: 'inhale' as const },
    { label: 'HOLD', sub: 'Retain lungs full & relaxed (4s)', scale: 1.25, type: 'hold' as const },
    { label: 'EXHALE', sub: 'Slow controlled release (4s)', scale: 0.75, type: 'exhale' as const },
    { label: 'HOLD', sub: 'Empty pause before next cycle (4s)', scale: 0.75, type: 'hold' as const },
  ];

  useEffect(() => {
    if (!isOpen || activeTab !== 'boxBreathing') return;

    const timer = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev <= 1) {
          setBreathPhaseIndex((p) => {
            const nextIdx = (p + 1) % 4;
            if (isAudioGuideEnabled) {
              soundEngine.playBreathCue(breathPhases[nextIdx].type);
            }
            return nextIdx;
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, activeTab, isAudioGuideEnabled]);

  // --- 2. 5-4-3-2-1 Sensory Checklist State ---
  const [sensoryChecked, setSensoryChecked] = useState<{ [key: string]: boolean }>({});
  const toggleSensory = (key: string) => {
    setSensoryChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- 3. 20-20-20 Ocular Reset Countdown ---
  const [ocularSec, setOcularSec] = useState<number>(20);
  const [ocularActive, setOcularActive] = useState<boolean>(false);

  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isOpen && activeTab === 'ocularReset' && ocularActive && ocularSec > 0) {
      t = setInterval(() => {
        setOcularSec((s) => s - 1);
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isOpen, activeTab, ocularActive, ocularSec]);

  if (!isOpen) return null;

  const currentBreath = breathPhases[breathPhaseIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] max-w-2xl w-full p-6 shadow-xl relative animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded badge-tier-${currentTier}`}
              >
                Tier {currentTier} Stress Intervention
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Current: <span className="font-semibold text-gray-900">{currentBpm} BPM</span>
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mt-1">
              Autonomic Regulation &amp; Recovery Protocol
            </h3>
            <p className="text-xs text-gray-500">
              Sympathetic nervous system overload detected. Engage with clinical down-regulation
              below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5E7EB] mt-4 overflow-x-auto text-xs font-medium text-gray-500 space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('boxBreathing')}
            className={`pb-2 border-b-2 cursor-pointer transition ${
              activeTab === 'boxBreathing'
                ? 'border-[#0F766E] text-[#0F766E] font-semibold'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            1. Box Breathing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sensoryGrounding')}
            className={`pb-2 border-b-2 cursor-pointer transition ${
              activeTab === 'sensoryGrounding'
                ? 'border-[#0F766E] text-[#0F766E] font-semibold'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            2. 5-4-3-2-1 Sensory
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ocularReset');
              setOcularActive(true);
            }}
            className={`pb-2 border-b-2 cursor-pointer transition ${
              activeTab === 'ocularReset'
                ? 'border-[#0F766E] text-[#0F766E] font-semibold'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            3. 20-20-20 Ocular
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vagusNerve')}
            className={`pb-2 border-b-2 cursor-pointer transition ${
              activeTab === 'vagusNerve'
                ? 'border-[#0F766E] text-[#0F766E] font-semibold'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            4. Vagus Sigh
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('postureHydration')}
            className={`pb-2 border-b-2 cursor-pointer transition ${
              activeTab === 'postureHydration'
                ? 'border-[#0F766E] text-[#0F766E] font-semibold'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            5. Posture &amp; Hydration
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-6 min-h-[260px] flex items-center justify-center">
          {/* 1. Box Breathing */}
          {activeTab === 'boxBreathing' && (
            <div className="w-full flex flex-col items-center text-center">
              <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                {/* Dynamic Scaling Circle */}
                <div
                  className="w-32 h-32 rounded-full bg-teal-100/90 border-2 border-[#0F766E] flex flex-col items-center justify-center shadow-sm transition-transform duration-1000 ease-in-out"
                  style={{ transform: `scale(${currentBreath.scale})` }}
                >
                  <span className="font-mono text-base font-bold text-teal-950 tracking-wider">
                    {currentBreath.label}
                  </span>
                  <span className="font-mono text-xs text-teal-800 font-semibold tabular-nums mt-0.5">
                    {breathSecondsLeft}s
                  </span>
                </div>
                {/* Secondary Outer Guidance Ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-teal-300 pointer-events-none"></div>
              </div>

              <div className="font-mono text-xs font-semibold text-[#0F766E]">
                4s Inhale • 4s Hold • 4s Exhale • 4s Hold
              </div>
              <p className="text-xs text-gray-500 max-w-md mt-2">
                Haptic pacing synced with ESP32 motor. Maintain deep diaphragmatic breathing to
                stimulate parasympathetic deceleration.
              </p>

              <button
                type="button"
                onClick={() => setIsAudioGuideEnabled(!isAudioGuideEnabled)}
                className="mt-3 text-[11px] font-mono text-gray-500 hover:text-gray-800 cursor-pointer flex items-center space-x-1"
              >
                <span>Sound Cue Guide:</span>
                <span className="font-semibold text-teal-700">
                  {isAudioGuideEnabled ? 'Enabled' : 'Muted'}
                </span>
              </button>
            </div>
          )}

          {/* 2. 5-4-3-2-1 Sensory Grounding */}
          {activeTab === 'sensoryGrounding' && (
            <div className="w-full text-left space-y-3">
              <p className="text-xs text-gray-500">
                Engage sensory channels sequentially to disrupt cognitive rumination and panic
                signals:
              </p>
              <div className="space-y-2 text-xs">
                {[
                  {
                    id: 'see',
                    count: '5 Things You Can See',
                    desc: 'Acknowledge shapes, textures, lighting around you',
                  },
                  {
                    id: 'feel',
                    count: '4 Things You Can Feel',
                    desc: 'Desk surface, feet planted firmly, fabric against skin',
                  },
                  {
                    id: 'hear',
                    count: '3 Things You Can Hear',
                    desc: 'Ambient room tone, ventilation, subtle keyboard rhythm',
                  },
                  {
                    id: 'smell',
                    count: '2 Things You Can Smell',
                    desc: 'Coffee aroma, fresh breeze, notebook paper',
                  },
                  {
                    id: 'taste',
                    count: '1 Thing You Can Taste',
                    desc: 'Cool water or conscious neutral palate awareness',
                  },
                ].map((item) => {
                  const isDone = sensoryChecked[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSensory(item.id)}
                      className={`p-2.5 rounded border transition flex items-center justify-between cursor-pointer ${
                        isDone
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-gray-50 border-[#E5E7EB] hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                      <span className="text-gray-500 text-[11px]">{item.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 20-20-20 Ocular Reset */}
          {activeTab === 'ocularReset' && (
            <div className="w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center font-mono font-bold text-lg shadow-xs">
                20/20
              </div>
              <h4 className="font-semibold text-sm text-gray-900">
                Ciliary Muscle Decompression
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Direct your gaze away from all screens. Focus on an object at least{' '}
                <strong className="text-gray-800">20 feet (6 meters)</strong> away for{' '}
                <strong className="text-gray-800">20 seconds</strong> to relax accommodation spasm.
              </p>

              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded font-mono text-xs text-gray-800">
                <span>Remaining pause:</span>
                <span className="font-bold text-sm text-[#0F766E] tabular-nums">
                  {ocularSec > 0 ? `${ocularSec}s` : 'Reset Complete ✓'}
                </span>
                {ocularSec <= 0 && (
                  <button
                    type="button"
                    onClick={() => setOcularSec(20)}
                    className="ml-2 text-[10px] text-gray-500 underline cursor-pointer"
                  >
                    Repeat
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Vagus Nerve Activation */}
          {activeTab === 'vagusNerve' && (
            <div className="w-full text-left space-y-3">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                <h5 className="font-semibold text-xs text-teal-900">
                  Dr. Andrew Huberman's Physiological Sigh
                </h5>
                <p className="text-xs text-teal-800 mt-1">
                  The fastest autonomic intervention to re-inflate collapsed alveoli and lower heart
                  rate within 2 to 3 breath cycles.
                </p>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-xs text-gray-700 pl-1">
                <li>
                  <strong>First deep nasal inhale</strong>: Inhale through nose filling 80% capacity.
                </li>
                <li>
                  <strong>Second sharp top-off inhale</strong>: Without exhaling, draw an additional
                  sharp burst of air into the upper chest.
                </li>
                <li>
                  <strong>Long, vocalized oral exhale</strong>: Slowly sigh the air out through your
                  mouth for 6–8 seconds until fully empty.
                </li>
                <li>Repeat 3 times consecutively.</li>
              </ol>
            </div>
          )}

          {/* 5. Somatic Reset */}
          {activeTab === 'postureHydration' && (
            <div className="w-full text-left space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 border border-[#E5E7EB] rounded">
                  <span className="font-bold text-gray-900">Posture Alignment:</span>
                  <ul className="list-disc list-inside text-gray-600 mt-1.5 space-y-1">
                    <li>Uncross legs, plant feet firmly on floor.</li>
                    <li>Roll shoulders back and drop shoulder blades.</li>
                    <li>Align ears directly above shoulder joints.</li>
                    <li>Gently retract chin to open cervical spine.</li>
                  </ul>
                </div>
                <div className="p-3 bg-gray-50 border border-[#E5E7EB] rounded">
                  <span className="font-bold text-gray-900">Cellular Hydration:</span>
                  <ul className="list-disc list-inside text-gray-600 mt-1.5 space-y-1">
                    <li>Drink 200ml cold or room-temp water.</li>
                    <li>Stimulates gastrointestinal vagal tone reflex.</li>
                    <li>Dilutes sympathetic stress biomarkers.</li>
                    <li>Restores cellular conductivity.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500 flex items-center space-x-1">
            <Check className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>
              Pings ESP32 route{' '}
              <code className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/reset</code>
            </span>
          </div>
          <button
            type="button"
            onClick={onAcknowledgeCalibrate}
            className="w-full sm:w-auto px-4 py-2 bg-[#0F766E] hover:bg-[#0d645e] text-white font-medium text-xs rounded transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <span>Acknowledge &amp; Calibrate Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
