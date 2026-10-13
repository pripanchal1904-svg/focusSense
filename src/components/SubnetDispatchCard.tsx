import React from 'react';
import { OutboundLogEntry } from '../types';

interface SubnetDispatchCardProps {
  logs: OutboundLogEntry[];
  activeIp: string;
  onClearLogs: () => void;
  onCalibrateBaseline: () => void;
}

export const SubnetDispatchCard: React.FC<SubnetDispatchCardProps> = ({
  logs,
  activeIp,
  onClearLogs,
  onCalibrateBaseline,
}) => {
  return (
    <div className="metric-card rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-gray-500">
              Subnet Dispatch
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Outbound Signal Ledger</h2>
          </div>
          <button
            type="button"
            onClick={onClearLogs}
            className="text-[10px] font-mono text-gray-500 hover:text-gray-900 cursor-pointer transition"
          >
            Clear
          </button>
        </div>

        <div className="space-y-1.5 font-mono text-[11px] max-h-36 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="text-gray-600 flex justify-between border-b border-gray-100 pb-0.5"
            >
              <span className="truncate mr-2">{log.message}</span>
              <span className="text-gray-400 shrink-0 tabular-nums">{log.timestamp}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-400 italic text-center py-4">[Ledger empty]</div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-gray-500 flex justify-between items-center mt-3">
        <span>
          Active IP:{' '}
          <span className="font-mono text-gray-800 font-medium">
            {activeIp.replace(/^https?:\/\//, '')}
          </span>
        </span>
        <button
          type="button"
          onClick={onCalibrateBaseline}
          className="text-[#0F766E] hover:underline font-medium cursor-pointer"
        >
          Calibrate Baseline
        </button>
      </div>
    </div>
  );
};
