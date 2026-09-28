import React from 'react';
import { AlertCircle, Flame, ShieldAlert, X } from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';

interface ScoreBreakdownModalProps {
  setup: TradingSetup | null;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  setup,
  onClose,
}) => {
  if (!setup) return null;

  const b = setup.scoreBreakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-5 font-mono text-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {setup.symbol} · Algorithmic Score Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Top Banner */}
        <div className="p-3.5 bg-neutral-900/80 rounded-lg border border-neutral-800 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 block">Total Setup Score:</span>
            <div className="text-2xl font-bold text-emerald-400">
              {setup.score}<span className="text-sm text-neutral-500 font-normal">/100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-neutral-400 block">Setup Classification:</span>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
              {b.scoreLabel}
            </span>
          </div>
        </div>

        {/* Breakdown Items List */}
        <div className="space-y-2.5 text-xs mb-4">
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">1. Trend Baseline (EMA 200 & Slope):</span>
            <strong className="text-white">{b.trendScore} / 20</strong>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">2. EMA 9 & EMA 21 Cross & Position:</span>
            <strong className="text-white">{b.emaScore} / 20</strong>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">3. Session VWAP Confluence:</span>
            <strong className="text-white">{b.vwapScore} / 15</strong>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">4. Relative Volume Expansion:</span>
            <strong className="text-white">{b.volumeScore} / 15</strong>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">5. RSI Zone & Recovery:</span>
            <strong className="text-white">{b.rsiScore} / 10</strong>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">6. Momentum (MFI / Stoch):</span>
            <strong className="text-white">{b.momentumScore} / 10</strong>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-neutral-900/40 border border-neutral-800/60">
            <span className="text-neutral-300">7. Multi-Timeframe Alignment:</span>
            <strong className="text-white">{b.mtfScore} / 10</strong>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded text-[11px] text-amber-200/90 font-sans flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>ملاحظة هامة:</strong> الـ Score هو قياس رياضي لمدى اكتمال وتوافق الشروط الفنية والمؤشرات، ولا يمثل احتمال نجاح أو ضمانًا لأي صفقة (Score is not a win probability).
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
