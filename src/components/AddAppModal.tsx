import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MonitoredApp } from '../types';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApp: (newApp: MonitoredApp) => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onAddApp,
}) => {
  const [appName, setAppName] = useState('');
  const [appDomain, setAppDomain] = useState('');
  const [quotaMinutes, setQuotaMinutes] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = appName.trim();
    if (!trimmedName) return;

    const trimmedDomain =
      appDomain.trim() ||
      `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    const newApp: MonitoredApp = {
      id: `app_${Date.now()}`,
      name: trimmedName,
      domain: trimmedDomain,
      quotaMinutes,
      elapsedSeconds: 0,
      status: 'idle',
    };

    onAddApp(newApp);
    setAppName('');
    setAppDomain('');
    setQuotaMinutes(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] max-w-sm w-full p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Track New Application</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-600 mb-1 font-medium">Application Name</label>
            <input
              type="text"
              placeholder="e.g. TikTok, Discord, Hacker News"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-medium">App Identifier / Domain</label>
            <input
              type="text"
              placeholder="e.g. tiktok.com or discord.exe"
              value={appDomain}
              onChange={(e) => setAppDomain(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-medium">Strict Quota Interval</label>
            <select
              value={quotaMinutes}
              onChange={(e) => setQuotaMinutes(parseInt(e.target.value, 10))}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0F766E] bg-white"
            >
              <option value="1">1 Minute (Habit Breaker / Quick Check)</option>
              <option value="5">5 Minutes (Standard Cap)</option>
              <option value="10">10 Minutes (Extended Window)</option>
              <option value="15">15 Minutes (Maximum Hard Threshold)</option>
              <option value="30">30 Minutes (Deep Research Slot)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#0F766E] text-white font-medium rounded hover:bg-[#0d645e] cursor-pointer shadow-xs"
            >
              Add Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
