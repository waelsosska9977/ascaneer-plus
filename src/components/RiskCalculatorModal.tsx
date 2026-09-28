import React, { useState } from 'react';
import { Calculator, ShieldCheck, X } from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntry?: number;
  defaultSL?: number;
  defaultSymbol?: string;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultEntry = 100,
  defaultSL = 95,
  defaultSymbol = 'BTCUSDT',
}) => {
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(defaultEntry);
  const [stopLoss, setStopLoss] = useState<number>(defaultSL);

  if (!isOpen) return null;

  const dollarRisk = (accountSize * riskPercent) / 100;
  const priceDistance = Math.abs(entryPrice - stopLoss);
  const riskPerUnit = priceDistance;

  const positionSizeCoins = riskPerUnit > 0 ? dollarRisk / riskPerUnit : 0;
  const positionSizeUsd = positionSizeCoins * entryPrice;
  const leverageRequired = accountSize > 0 ? (positionSizeUsd / accountSize).toFixed(1) : '1.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-6 font-mono text-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Position Sizing & Risk Management
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-4 font-sans">
          Calculate strict mathematical position sizing based on portfolio capital and pre-determined invalidation levels.
        </p>

        {/* Inputs Form */}
        <div className="space-y-3 text-xs mb-5">
          <div>
            <label className="block text-neutral-400 mb-1">Account Portfolio Size (USD):</label>
            <input
              type="number"
              value={accountSize}
              onChange={e => setAccountSize(parseFloat(e.target.value) || 0)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Max Risk per Trade (%):</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={e => setRiskPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Max Risk ($):</label>
              <div className="bg-neutral-900/80 border border-neutral-800 rounded px-3 py-2 text-amber-400 font-bold">
                ${dollarRisk.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Planned Entry Price ($):</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Stop Loss Price ($):</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={e => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-rose-400 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results Box */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-2.5 text-xs mb-4">
          <div className="flex justify-between items-center text-neutral-300">
            <span>Stop Loss Distance:</span>
            <strong className="text-rose-400 font-mono">
              ${priceDistance.toFixed(4)} ({entryPrice > 0 ? ((priceDistance / entryPrice) * 100).toFixed(2) : 0}%)
            </strong>
          </div>
          <div className="flex justify-between items-center text-neutral-300">
            <span>Allocated Position Size:</span>
            <strong className="text-white font-mono text-sm">
              {positionSizeCoins.toFixed(4)} Units
            </strong>
          </div>
          <div className="flex justify-between items-center text-neutral-300">
            <span>Total Position Value:</span>
            <strong className="text-emerald-400 font-mono text-sm">
              ${positionSizeUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex justify-between items-center text-neutral-300">
            <span>Implied Effective Leverage:</span>
            <strong className="text-amber-400 font-mono">
              {leverageRequired}x
            </strong>
          </div>
        </div>

        <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded text-[11px] text-neutral-400 font-sans flex items-start gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            هذا حساب رياضي لحجم المخاطرة وإدارة رأس المال وليس توصية استثمارية. تأكد دائمًا من الالتزام بقواعد إدارة المخاطر الخاصة بك.
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
