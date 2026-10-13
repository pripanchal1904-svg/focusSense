import React from 'react';
import { StressTierLevel, ESP32ActuatorState } from '../types';

interface PhysiologicalScaleCardProps {
  currentTier: StressTierLevel;
  actuatorState: ESP32ActuatorState;
  onOpenProtocols: () => void;
}

const TIERS = [
  {
    tier: 1 as StressTierLevel,
    name: 'Tier 1: Deep Flow / Resting',
    range: '55–70 BPM',
    dotColor: 'bg-emerald-500',
    activeBg: 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400',
    activeText: 'text-emerald-950 font-semibold',
    normalText: 'text-gray-700',
  },
  {
    tier: 2 as StressTierLevel,
    name: 'Tier 2: Active Focus (Current)',
    range: '71–82 BPM',
    dotColor: 'bg-teal-600',
    activeBg: 'bg-teal-50 border-teal-300 ring-1 ring-teal-500',
    activeText: 'text-teal-900 font-semibold',
    normalText: 'text-gray-700',
  },
  {
    tier: 3 as StressTierLevel,
    name: 'Tier 3: Mild Tension / Fatigue',
    range: '83–94 BPM',
    dotColor: 'bg-amber-500',
    activeBg: 'bg-amber-50 border-amber-300 ring-1 ring-amber-500',
    activeText: 'text-amber-900 font-semibold',
    normalText: 'text-gray-700',
  },
  {
    tier: 4 as StressTierLevel,
    name: 'Tier 4: Elevated Stress (Intervention)',
    range: '95–109 BPM',
    dotColor: 'bg-orange-500',
    activeBg: 'bg-orange-50 border-orange-300 ring-1 ring-orange-500',
    activeText: 'text-orange-900 font-semibold',
    normalText: 'text-gray-700',
  },
  {
    tier: 5 as StressTierLevel,
    name: 'Tier 5: Acute Fight-or-Flight',
    range: '110+ BPM',
    dotColor: 'bg-red-600',
    activeBg: 'bg-red-50 border-red-300 ring-1 ring-red-500',
    activeText: 'text-red-950 font-semibold',
    normalText: 'text-gray-700',
  },
];

export const PhysiologicalScaleCard: React.FC<PhysiologicalScaleCardProps> = ({
  currentTier,
  actuatorState,
  onOpenProtocols,
}) => {
  return (
    <div className="metric-card rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-gray-500">
              Autonomic Nervous System
            </div>
            <h2 className="text-sm font-semibold text-gray-900">5-Tier Physiological Scale</h2>
          </div>
          <button
            onClick={onOpenProtocols}
            className="text-xs text-[#0F766E] hover:underline font-medium flex items-center space-x-1 cursor-pointer"
          >
            <span>View Protocols</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Stress Tiers Matrix */}
        <div className="space-y-2 mt-3 text-xs">
          {TIERS.map((t) => {
            const isCurrent = t.tier === currentTier;
            const displayName = isCurrent
              ? t.name.replace(' (Current)', '') + ' (Current)'
              : t.name.replace(' (Current)', '');

            return (
              <div
                key={t.tier}
                className={`flex items-center justify-between p-2 rounded border transition-all ${
                  isCurrent ? t.activeBg : 'border-gray-100 bg-gray-50 hover:bg-gray-100/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${t.dotColor} ${
                      isCurrent ? 'animate-pulse ring-2 ring-white' : ''
                    }`}
                  ></span>
                  <span className={isCurrent ? t.activeText : t.normalText}>{displayName}</span>
                </div>
                <span
                  className={`font-mono text-[11px] ${
                    isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {t.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware Signal Sync Indicators */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
        <div className="text-gray-500">ESP32 Actuator State:</div>
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span
            className={`px-2 py-0.5 rounded border ${
              actuatorState.ledColor === 'green'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : actuatorState.ledColor === 'amber'
                ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                : 'bg-red-100 text-red-800 border-red-200 animate-pulse'
            }`}
          >
            LED: {actuatorState.ledText}
          </span>
          <span
            className={`px-2 py-0.5 rounded border ${
              actuatorState.motorActive
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            MOTOR: {actuatorState.motorText}
          </span>
        </div>
      </div>
    </div>
  );
};
