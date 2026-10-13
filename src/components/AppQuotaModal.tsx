import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MonitoredApp } from '../types';

interface AppQuotaModalProps {
  breachedApp: MonitoredApp | null;
  onAcknowledge: () => void;
}

export const AppQuotaModal: React.FC<AppQuotaModalProps> = ({
  breachedApp,
  onAcknowledge,
}) => {
  if (!breachedApp) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-amber-300 max-w-md w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>

        <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200 mb-2">
          Cognitive Boundary Tripped
        </div>

        <h3 className="text-lg font-bold text-gray-900">Attention Quota Exceeded</h3>

        <p className="text-xs text-gray-600 mt-2">
          You reached your {breachedApp.quotaMinutes}-minute allocation for{' '}
          <strong className="text-gray-900 font-semibold">{breachedApp.name}</strong>. Step away from
          the screen immediately.
        </p>

        {/* Mindful Quote Block */}
        <div className="my-5 p-3 bg-gray-50 border-l-2 border-amber-500 rounded text-left">
          <p className="text-xs italic text-gray-700">
            &ldquo;Focus is a muscle; stepping back is how it recovers.&rdquo;
          </p>
          <span className="text-[10px] text-gray-500 block mt-1">— Ergonomic Principle</span>
        </div>

        <div className="text-[11px] font-mono text-gray-500 mb-5 flex items-center justify-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>ESP32 Physical Chime Active + Amber LED Engaged</span>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition cursor-pointer shadow-xs"
          >
            I Acknowledge &amp; Close Application
          </button>
        </div>
      </div>
    </div>
  );
};
