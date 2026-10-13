import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface DeepWorkCardProps {
  onSessionComplete: (minutes: number) => void;
  dailyTotalMinutes: number;
}

export const DeepWorkCard: React.FC<DeepWorkCardProps> = ({
  onSessionComplete,
  dailyTotalMinutes,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [customInput, setCustomInput] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Sync remaining time when selectedMinutes changes (if not running)
  useEffect(() => {
    if (!isActive && !sessionCompleted) {
      setRemainingSeconds(selectedMinutes * 60);
    }
  }, [selectedMinutes, isActive, sessionCompleted]);

  // Timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setSessionCompleted(true);
            soundEngine.playCompletionChime();
            onSessionComplete(selectedMinutes);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, remainingSeconds, selectedMinutes, onSessionComplete]);

  const handlePresetClick = (mins: number) => {
    setIsActive(false);
    setSessionCompleted(false);
    setSelectedMinutes(mins);
    setCustomInput('');
    setRemainingSeconds(mins * 60);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      setIsActive(false);
      setSessionCompleted(false);
      setSelectedMinutes(parsed);
      setRemainingSeconds(parsed * 60);
    }
  };

  const handleToggleTimer = () => {
    if (sessionCompleted) {
      setSessionCompleted(false);
      setRemainingSeconds(selectedMinutes * 60);
      setIsActive(true);
      return;
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSessionCompleted(false);
    setRemainingSeconds(selectedMinutes * 60);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSec = selectedMinutes * 60;
  const progressPercent = totalSec > 0 ? Math.min(100, Math.max(0, ((totalSec - remainingSeconds) / totalSec) * 100)) : 0;

  return (
    <div className="metric-card rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-gray-500">
              Cognitive Performance
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Deep Work Engine</h2>
          </div>
          <div className="text-[11px] font-mono text-gray-500">
            Daily Total:{' '}
            <span className="font-semibold text-gray-900 tabular-nums">
              {dailyTotalMinutes}m
            </span>
          </div>
        </div>

        {/* Timer Presets */}
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-xs text-gray-500">Duration:</span>
          {[25, 45, 60].map((mins) => {
            const isSelected = selectedMinutes === mins && customInput === '';
            return (
              <button
                key={mins}
                type="button"
                onClick={() => handlePresetClick(mins)}
                className={`px-2.5 py-1 text-xs rounded border font-mono transition cursor-pointer ${
                  isSelected
                    ? 'bg-gray-200 border-gray-300 font-bold text-gray-900 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {mins}m
              </button>
            );
          })}
          <div className="flex items-center ml-auto">
            <input
              type="number"
              min="1"
              max="180"
              value={customInput}
              onChange={handleCustomChange}
              placeholder="Custom"
              className="w-16 px-2 py-0.5 text-xs font-mono border border-gray-200 rounded text-center focus:outline-none focus:border-[#0F766E]"
            />
            <span className="text-[11px] text-gray-500 ml-1 font-mono">m</span>
          </div>
        </div>

        {/* Big Monospace Digital Countdown */}
        <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-md mb-6">
          <div className="font-mono text-5xl font-bold tracking-tight text-gray-900 tabular-nums">
            {timeFormatted}
          </div>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
            {sessionCompleted
              ? 'Complete • Session Logged'
              : isActive
              ? 'Active • Cognition Guarded'
              : remainingSeconds < selectedMinutes * 60
              ? 'Paused • Session on Hold'
              : 'Ready • Undisturbed Flow'}
          </div>

          {/* Progress Bar */}
          <div className="w-4/5 mx-auto bg-gray-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#0F766E] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          type="button"
          onClick={handleToggleTimer}
          className="flex-1 py-2 px-4 bg-[#0F766E] hover:bg-[#0d645e] text-white font-medium text-xs rounded transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:translate-y-px"
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Focus Session</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{sessionCompleted ? 'Start New Session' : 'Start Focus Session'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs rounded font-medium transition cursor-pointer flex items-center space-x-1"
          title="Reset Session"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-0.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
