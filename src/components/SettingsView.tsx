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
                Number of Coins to Scan (عدد العملات المفحوصة):
              </label>
              <select
                value={formData.maxCoinsScanned || 60}
                onChange={e => setFormData({ ...formData, maxCoinsScanned: parseInt(e.target.value, 10) })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>Top 30 High Volume Pairs</option>
                <option value={60}>Top 60 Liquid Pairs (Recommended)</option>
                <option value={100}>Top 100 Market Pairs</option>
                <option value={150}>Top 150 Extended Pairs</option>
              </select>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                يحدد العدد الأقصى للعملات التي يفحصها الماسح تلقائياً حسب حجم التداول.
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

        {/* 4. Pre-Market P-Tokens Manager */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              4. Binance Pre-Market & P-Tokens Watchlist (توكنات ما قبل التداول وعقود P)
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">
              {(formData.stockTokens || []).length} توكن مسجل
            </span>
          </div>

          <p className="text-xs text-neutral-400 font-sans">
            الرموز المسجلة هنا (مثل SNDKP، SNDKUSDTP، NSDKUSDTP، SPXUSDTP، SCRUSDTP وغيرها) يتم فحصها بشكل دائم في كل دورة مسح مع استخراج مناطق الدخول الدقيقة ووقف الخسارة وأهداف الربح وتنبيهات التيليجرام.
          </p>

          {/* Active tokens chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(formData.stockTokens || []).map(sym => (
              <span
                key={sym}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs font-mono font-bold text-white shadow-sm"
              >
                <span className="text-cyan-400">⚡</span>
                <span>{sym}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (formData.stockTokens || []).filter(s => s !== sym);
                    setFormData({ ...formData, stockTokens: next });
                  }}
                  className="text-neutral-500 hover:text-rose-400 ml-1 text-sm font-bold cursor-pointer"
                  title="حذف"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Quick preset actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const defaults = [
                  'SNDKP',
                  'SNDKUSDTP',
                  'NSDKUSDTP',
                  'NSDKP',
                  'SPXUSDTP',
                  'PENGUUSDTP',
                  'MOVEUSDTP',
                  'THEUSDTP',
                  'SCRUSDTP',
                  'EIGENUSDTP',
                  'HMSTRUSDTP',
                  'CATIUSDTP',
                  'ACTUSDTP',
                  'PNUTUSDTP',
                ];
                const merged = Array.from(new Set([...defaults, ...(formData.stockTokens || [])]));
                setFormData({ ...formData, stockTokens: merged });
              }}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-cyan-800/60 rounded-lg text-xs font-mono text-cyan-300 font-semibold cursor-pointer"
            >
              + إضافة حزمة توكنات P وما قبل التداول (SNDKP, NSDK, SPX...)
            </button>

            <button
              type="button"
              onClick={() => {
                const newCoins = [
                  'PENGUUSDT',
                  'MOVEUSDT',
                  'THEUSDT',
                  'ACXUSDT',
                  'ORCAUSDT',
                  'PNUTUSDT',
                  'ACTUSDT',
                  'MEUSDT',
                  'VIRTUALUSDT',
                ];
                const merged = Array.from(new Set([...newCoins, ...(formData.stockTokens || [])]));
                setFormData({ ...formData, stockTokens: merged });
              }}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-purple-800/60 rounded-lg text-xs font-mono text-purple-300 font-semibold cursor-pointer"
            >
              + إضافة توكنات بينانس الجديدة
            </button>
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
