import React, { useState } from 'react';
import { Check, Save, Settings, ShieldAlert, Sliders } from 'lucide-react';
import { ScreenerSettings } from '../types/crypto.ts';

interface SettingsViewProps {
  settings: ScreenerSettings;
  onUpdateSettings: (newSettings: Partial<ScreenerSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<ScreenerSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 font-mono text-neutral-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Screener & Algorithm Configuration
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-sans">
          Customize backend scanning cadences, alert thresholds, target multipliers, and live data modes. Changes are saved persistently.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scanner Engine Settings */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
            1. Automated Scanning Frequency & Filtering
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                Scan Interval (Seconds):
              </label>
              <select
                value={formData.scanIntervalSeconds}
                onChange={e => setFormData({ ...formData, scanIntervalSeconds: parseInt(e.target.value, 10) })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>Every 30 Seconds (Fast)</option>
                <option value={60}>Every 60 Seconds (Standard Recommended)</option>
                <option value={120}>Every 120 Seconds</option>
                <option value={300}>Every 5 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                Minimum Score for Telegram Alert:
              </label>
              <input
                type="number"
                min={50}
                max={95}
                value={formData.minScoreAlert}
                onChange={e => setFormData({ ...formData, minScoreAlert: parseInt(e.target.value, 10) || 70 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Alerts are withheld if algorithmic score &lt; {formData.minScoreAlert}/100.
              </span>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                Minimum 24h Volume (USD):
              </label>
              <input
                type="number"
                step="1000000"
                value={formData.min24hVolumeUsd}
                onChange={e => setFormData({ ...formData, min24hVolumeUsd: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Filters out illiquid pairs below ${(formData.min24hVolumeUsd / 1e6).toFixed(1)}M 24h volume.
              </span>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                Market Data Provider Mode:
              </label>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.demoMode}
                    onChange={() => setFormData({ ...formData, demoMode: false })}
                    className="accent-emerald-500"
                  />
                  <span className="text-white text-xs">Live Binance REST / Tickers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.demoMode}
                    onChange={() => setFormData({ ...formData, demoMode: true })}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-400 text-xs">Demo / Sandbox Mode</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Setup Multipliers & Risk */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
            2. Setup Target Multipliers & Risk Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                Default Risk per Trade (%):
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.riskPercentage}
                onChange={e => setFormData({ ...formData, riskPercentage: parseFloat(e.target.value) || 1 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                TP1 Multiplier (x Risk):
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.tp1Multiplier}
                onChange={e => setFormData({ ...formData, tp1Multiplier: parseFloat(e.target.value) || 1.5 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                TP2 Multiplier (x Risk):
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.tp2Multiplier}
                onChange={e => setFormData({ ...formData, tp2Multiplier: parseFloat(e.target.value) || 2.5 })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-emerald-500 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Enabled Setup Toggles */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
            3. Setup Classification Directives
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <label className="flex items-center gap-2.5 p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableLong}
                onChange={e => setFormData({ ...formData, enableLong: e.target.checked })}
                className="accent-emerald-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-white block">Enable Long Setups</span>
                <span className="text-[10px] text-neutral-500 font-sans">Bullish trend & breakout scans</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableShort}
                onChange={e => setFormData({ ...formData, enableShort: e.target.checked })}
                className="accent-rose-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-white block">Enable Short Setups</span>
                <span className="text-[10px] text-neutral-500 font-sans">Bearish distribution scans</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableWhaleFlow}
                onChange={e => setFormData({ ...formData, enableWhaleFlow: e.target.checked })}
                className="accent-cyan-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-white block">Whale / Liquidity Flow</span>
                <span className="text-[10px] text-neutral-500 font-sans">High taker buy aggression tags</span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <Check className="w-4 h-4" />
              <span>Settings successfully updated and applied!</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
