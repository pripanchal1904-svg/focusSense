import React from 'react';
import { MonitoredApp } from '../types';

interface AttentionProtectionCardProps {
  apps: MonitoredApp[];
  onToggleSimulate: (appId: string) => void;
  onDeleteApp: (appId: string) => void;
  onOpenAddModal: () => void;
}

export const AttentionProtectionCard: React.FC<AttentionProtectionCardProps> = ({
  apps,
  onToggleSimulate,
  onDeleteApp,
  onOpenAddModal,
}) => {
  const activeCount = apps.filter((a) => a.status === 'active').length;

  return (
    <div className="metric-card rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-gray-500">
              Attention Protection
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              Monitored Applications &amp; Strict Quotas
            </h2>
          </div>
          {/* Add App Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-900 transition cursor-pointer"
          >
            <span className="mr-1 text-[#0F766E] font-bold">+</span> Track Application
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          When usage reaches the threshold, the dashboard locks and triggers the ESP32 physical chime
          + amber warning LED.
        </p>

        {/* Apps List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-gray-500 font-mono uppercase text-[10px]">
                <th className="pb-2 font-medium">Application</th>
                <th className="pb-2 font-medium">Quota Cap</th>
                <th className="pb-2 font-medium">Active Session</th>
                <th className="pb-2 font-medium">Simulation</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map((app) => {
                const limitSec = app.quotaMinutes * 60;
                const progressPercent = Math.min(100, (app.elapsedSeconds / limitSec) * 100);
                const elapsedMinStr = `${Math.floor(app.elapsedSeconds / 60)}m ${
                  app.elapsedSeconds % 60
                }s`;
                const initials = app.name.slice(0, 2).toUpperCase();

                return (
                  <tr key={app.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-2.5 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center font-mono text-[10px] uppercase font-bold text-gray-700">
                          {initials}
                        </div>
                        <div>
                          <span className="block font-medium">{app.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{app.domain}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-semibold">
                        {app.quotaMinutes} min
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5 tabular-nums">
                          <span>{elapsedMinStr}</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPercent >= 100
                                ? 'bg-red-600'
                                : progressPercent > 80
                                ? 'bg-amber-600'
                                : 'bg-[#0F766E]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      {app.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => onToggleSimulate(app.id)}
                          className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[11px] hover:bg-amber-200 transition cursor-pointer flex items-center space-x-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                          <span>Active (Stop)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleSimulate(app.id)}
                          className="px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 font-mono text-[11px] transition cursor-pointer"
                        >
                          Simulate Open
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteApp(app.id)}
                        className="text-gray-400 hover:text-red-600 font-mono text-[11px] px-1 cursor-pointer transition"
                        title="Remove Application"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-gray-400 font-mono">
                    No applications currently monitored. Click "+ Track Application" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>
            Breach behavior: Hard Interception + ESP32{' '}
            <code className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/distract</code>{' '}
            pulse
          </span>
        </div>
        <span className="font-mono text-[11px]">{activeCount} Apps active</span>
      </div>
    </div>
  );
};
