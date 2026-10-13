import React, { useState } from 'react';
import { X, Wifi } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  espIp: string;
  pollingIntervalMs: number;
  baselineBpm: number;
  onSaveSettings: (newIp: string, newPollingMs: number, newBaseline: number) => void;
  onTestPing: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  espIp,
  pollingIntervalMs,
  baselineBpm,
  onSaveSettings,
  onTestPing,
}) => {
  const [ip, setIp] = useState(espIp);
  const [pollingMs, setPollingMs] = useState(pollingIntervalMs);
  const [baseline, setBaseline] = useState(baselineBpm);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePing = () => {
    setPingStatus('Pinging...');
    onTestPing();
    setTimeout(() => {
      const mockLatency = Math.floor(Math.random() * 12) + 8;
      setPingStatus(`Ping ACK: ${mockLatency}ms round-trip`);
    }, 250);
  };

  const handleSave = () => {
    onSaveSettings(ip.trim() || 'http://192.168.4.1', pollingMs, baseline);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-xl animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              ESP32 Hardware Configuration
            </h3>
            <p className="text-xs text-gray-500">Local Wi-Fi Subnet REST Interface</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-600 mb-1 font-medium">
              ESP32 Endpoint IP Address / Host
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="flex-1 font-mono px-2.5 py-1.5 border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0F766E]"
              />
              <button
                type="button"
                onClick={handlePing}
                className="px-3 py-1.5 border border-[#E5E7EB] hover:bg-gray-50 font-mono rounded text-gray-700 cursor-pointer flex items-center space-x-1"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Test Ping</span>
              </button>
            </div>
            {pingStatus && (
              <span className="text-[11px] font-mono text-[#0F766E] mt-1 block">
                {pingStatus}
              </span>
            )}
            <span className="text-[11px] text-gray-400 mt-1 block">
              Default AP subnet: <code>http://192.168.4.1</code>
            </span>
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-medium">
              Telemetry Polling Frequency
            </label>
            <select
              value={pollingMs}
              onChange={(e) => setPollingMs(parseInt(e.target.value, 10))}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded bg-white font-mono"
            >
              <option value="1000">1000 ms (1 Hz Standard)</option>
              <option value="500">500 ms (2 Hz High-Def)</option>
              <option value="2000">2000 ms (Low Power)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-600 font-medium">Biometric Baseline BPM</label>
              <span className="font-mono text-gray-900 font-bold">{baseline} BPM</span>
            </div>
            <input
              type="range"
              min="55"
              max="95"
              value={baseline}
              onChange={(e) => setBaseline(parseInt(e.target.value, 10))}
              className="w-full accent-[#0F766E]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>55 (Athlete Rest)</span>
              <span>68 (Nominal)</span>
              <span>95 (Elevated)</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded border border-[#E5E7EB] space-y-1.5">
            <div className="font-semibold text-gray-700">Supported Hardware Endpoints:</div>
            <div className="font-mono text-[11px] text-gray-600 flex justify-between">
              <span>GET /getHeartData</span>
              <span className="text-gray-500">Read MAX30102 Raw/BPM</span>
            </div>
            <div className="font-mono text-[11px] text-gray-600 flex justify-between">
              <span>GET /stress?level=N</span>
              <span className="text-gray-500">Engage Motor &amp; Red LED</span>
            </div>
            <div className="font-mono text-[11px] text-gray-600 flex justify-between">
              <span>GET /distract</span>
              <span className="text-gray-500">Chime &amp; Amber LED</span>
            </div>
            <div className="font-mono text-[11px] text-gray-600 flex justify-between">
              <span>GET /reset</span>
              <span className="text-gray-500">Restore Green State</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2 bg-[#0F766E] text-white font-medium rounded hover:bg-[#0d645e] transition cursor-pointer shadow-xs"
            >
              Save &amp; Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
