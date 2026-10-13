import React, { useEffect, useRef, useState } from 'react';
import { TelemetryPoint, StressTierLevel } from '../types';

interface BiometricsCardProps {
  currentBpm: number;
  currentHrv: number;
  baselineBpm: number;
  stressTier: StressTierLevel;
  history: TelemetryPoint[];
}

const TIER_DETAILS = {
  1: {
    label: 'Deep Flow',
    badgeClass: 'badge-tier-1',
    desc: 'Resting parasympathetic tone',
    color: '#059669',
  },
  2: {
    label: 'Normal Focus',
    badgeClass: 'badge-tier-2',
    desc: 'Sustained active flow',
    color: '#0F766E',
  },
  3: {
    label: 'Mild Tension',
    badgeClass: 'badge-tier-3',
    desc: 'Elevated sympathetic arousal',
    color: '#D97706',
  },
  4: {
    label: 'Elevated Stress',
    badgeClass: 'badge-tier-4',
    desc: 'Intervention recommended',
    color: '#EA580C',
  },
  5: {
    label: 'Fight-or-Flight',
    badgeClass: 'badge-tier-5',
    desc: 'Acute distress detected',
    color: '#DC2626',
  },
};

export const BiometricsCard: React.FC<BiometricsCardProps> = ({
  currentBpm,
  currentHrv,
  baselineBpm,
  stressTier,
  history,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    bpm: number;
    secAgo: number;
    x: number;
    y: number;
  } | null>(null);

  const tierInfo = TIER_DETAILS[stressTier];
  const delta = currentBpm - baselineBpm;
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;

    if (history.length < 2) {
      ctx.restore();
      return;
    }

    const minBpm = 45;
    const maxBpm = 135;
    const getY = (val: number) => {
      const clamped = Math.max(minBpm, Math.min(maxBpm, val));
      return h - ((clamped - minBpm) / (maxBpm - minBpm)) * (h - 20) - 10;
    };

    // 1. Draw subtle horizontal grid reference lines
    [60, 80, 100, 120].forEach((gridVal) => {
      const gridY = getY(gridVal);
      ctx.beginPath();
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 1;
      ctx.moveTo(0, gridY);
      ctx.lineTo(w, gridY);
      ctx.stroke();
    });

    // 2. Draw 68 BPM baseline dashed reference line
    const baseY = getY(baselineBpm);
    ctx.beginPath();
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw smoothed Sensor Pulse Trace line
    const stepX = w / (history.length - 1);
    ctx.beginPath();
    ctx.moveTo(0, getY(history[0].bpm));

    for (let i = 1; i < history.length; i++) {
      const prevX = (i - 1) * stepX;
      const prevY = getY(history[i - 1].bpm);
      const curX = i * stepX;
      const curY = getY(history[i].bpm);

      // Spline curve via midpoints
      const midX = (prevX + curX) / 2;
      ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + curY) / 2);
    }
    // Final segment to last point
    const lastX = (history.length - 1) * stepX;
    const lastY = getY(history[history.length - 1].bpm);
    ctx.lineTo(lastX, lastY);

    const strokeColor = tierInfo.color;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 4. Subtle vertical gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `${strokeColor}25`);
    gradient.addColorStop(0.8, `${strokeColor}04`);
    gradient.addColorStop(1, `${strokeColor}00`);

    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 5. Draw live pulsing endpoint dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, 7.5, 0, Math.PI * 2);
    ctx.strokeStyle = `${strokeColor}55`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [history, baselineBpm, tierInfo.color]);

  // Handle canvas hover tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const stepX = rect.width / (history.length - 1);
    const closestIdx = Math.max(0, Math.min(history.length - 1, Math.round(mouseX / stepX)));
    const pt = history[closestIdx];

    const minBpm = 45;
    const maxBpm = 135;
    const y = rect.height - ((pt.bpm - minBpm) / (maxBpm - minBpm)) * (rect.height - 20) - 10;

    setHoveredPoint({
      index: closestIdx,
      bpm: pt.bpm,
      secAgo: history.length - 1 - closestIdx,
      x: closestIdx * stepX,
      y,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="metric-card rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-gray-500">
              MAX30102 Optical Biometrics
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              Real-Time Cardiovascular Telemetry
            </h2>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            <span className="text-[11px] font-mono text-gray-500">60s rolling window</span>
          </div>
        </div>

        {/* Numerical Metrics Row */}
        <div className="grid grid-cols-3 gap-4 mb-4 pt-2">
          {/* Heart Rate */}
          <div className="border-l-2 border-[#0F766E] pl-3">
            <div className="text-[11px] font-mono uppercase text-gray-500">Heart Rate</div>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-3xl font-mono font-bold tracking-tight text-gray-900 tabular-nums">
                {currentBpm}
              </span>
              <span className="text-xs font-mono text-gray-500">BPM</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
              Baseline: {baselineBpm} BPM ({deltaStr})
            </div>
          </div>

          {/* HRV / RMSSD */}
          <div className="border-l-2 border-gray-300 pl-3">
            <div className="text-[11px] font-mono uppercase text-gray-500">HRV / RMSSD</div>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-3xl font-mono font-bold tracking-tight text-gray-900 tabular-nums">
                {currentHrv}
              </span>
              <span className="text-xs font-mono text-gray-500">ms</span>
            </div>
            <div className="text-[11px] text-teal-700 mt-0.5">
              {currentHrv >= 50
                ? 'Optimal autonomic balance'
                : currentHrv >= 35
                ? 'Moderate sympathetic tone'
                : 'Elevated stress depression'}
            </div>
          </div>

          {/* Tiered Stress Index */}
          <div className="border-l-2 border-[#0F766E] pl-3">
            <div className="text-[11px] font-mono uppercase text-gray-500">Tiered Stress Index</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span
                className="text-3xl font-mono font-bold tracking-tight tabular-nums"
                style={{ color: tierInfo.color }}
              >
                L{stressTier}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${tierInfo.badgeClass}`}>
                {tierInfo.label}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{tierInfo.desc}</div>
          </div>
        </div>
      </div>

      {/* Real-Time Sparkline Canvas */}
      <div className="mt-2 pt-3 border-t border-[#E5E7EB]">
        <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mb-1.5">
          <span>60s ago</span>
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-0.5 rounded"
              style={{ backgroundColor: tierInfo.color }}
            ></span>{' '}
            Sensor Pulse Trace
            <span className="inline-block w-2.5 h-0.5 border-t border-dashed border-gray-400"></span>{' '}
            {baselineBpm} BPM Baseline
          </span>
          <span>Now (1Hz)</span>
        </div>

        <div className="h-28 w-full relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {hoveredPoint && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-gray-900 text-white font-mono text-[10px] py-1 px-2 rounded shadow-md z-10"
              style={{
                left: `${hoveredPoint.x}px`,
                top: `${hoveredPoint.y - 8}px`,
              }}
            >
              <div className="font-semibold">{hoveredPoint.bpm} BPM</div>
              <div className="text-gray-400 text-[9px]">{hoveredPoint.secAgo}s ago</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
