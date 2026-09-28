import React from 'react';
import { ChevronRight, Waves } from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';

interface MobileCardViewProps {
  setups: TradingSetup[];
  onSelectSetup: (setup: TradingSetup) => void;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  setups,
  onSelectSetup,
}) => {
  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="block lg:hidden max-w-7xl mx-auto px-4 py-2 space-y-3 font-mono">
      {setups.map(setup => {
        const ind = setup.indicators;
        const isLong = setup.state === 'CONFIRMED_LONG';
        const isShort = setup.state === 'CONFIRMED_SHORT';
        const isWait = setup.state === 'WAIT_FOR_CONFIRMATION';

        const stateColor = isLong
          ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800'
          : isShort
          ? 'text-rose-400 bg-rose-950/50 border-rose-800'
          : isWait
          ? 'text-amber-400 bg-amber-950/50 border-amber-800'
          : 'text-neutral-400 bg-neutral-900 border-neutral-800';

        const stateText = isLong
          ? 'CONFIRMED LONG'
          : isShort
          ? 'CONFIRMED SHORT'
          : isWait
          ? 'WAIT FOR CONFIRMATION'
          : 'NO SETUP';

        return (
          <div
            key={setup.symbol}
            onClick={() => onSelectSetup(setup)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 hover:border-neutral-700 transition-all cursor-pointer shadow-md"
          >
            {/* Header: Symbol, Price, Score, State */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white tracking-wide">
                    {setup.symbol}
                  </span>
                  {setup.setupType === 'Whale Resilience' && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950 px-1 rounded border border-cyan-800">
                      <Waves className="w-2.5 h-2.5" /> Whale
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span className="text-white">${formatPrice(setup.price)}</span>
                  <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-neutral-500 uppercase">Score</span>
                <div className="text-sm font-bold text-emerald-400">
                  {setup.score}<span className="text-xs text-neutral-500 font-normal">/100</span>
                </div>
              </div>
            </div>

            {/* State Pill */}
            <div className="mb-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${stateColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {stateText}
              </span>
            </div>

            {/* Core Indicator Badges */}
            <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center bg-neutral-900/60 p-2 rounded border border-neutral-800/80 mb-2.5">
              <div>
                <div className="text-neutral-500">EMA 9</div>
                <div className={ind.ema9 > ind.ema21 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {ind.ema9 > ind.ema21 ? '🟢' : '🔴'}
                </div>
              </div>
              <div>
                <div className="text-neutral-500">EMA 21</div>
                <div className={setup.price > ind.ema21 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {setup.price > ind.ema21 ? '🟢' : '🔴'}
                </div>
              </div>
              <div>
                <div className="text-neutral-500">EMA 200</div>
                <div className={setup.price > ind.ema200 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {setup.price > ind.ema200 ? '🟢' : '🔴'}
                </div>
              </div>
              <div>
                <div className="text-neutral-500">VWAP</div>
                <div className={ind.priceVsVwap === 'above' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {ind.priceVsVwap === 'above' ? '🟢' : '🔴'}
                </div>
              </div>
            </div>

            {/* RSI, MFI, MTF Alignment */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-900 pt-2 mb-2">
              <span>RSI: <strong className="text-neutral-200">{ind.rsi.toFixed(1)}</strong></span>
              <span>MFI: <strong className="text-neutral-200">{ind.mfi.toFixed(1)}</strong></span>
              <span>MTF: <strong className="text-emerald-400">{setup.mtf.alignmentFraction}</strong></span>
              <span>R:R: <strong className="text-emerald-400">1:{setup.riskRewardRatio}</strong></span>
            </div>

            {/* Target & Action Row */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
              <div className="text-[10px] text-neutral-400 space-x-2">
                <span>Entry: <strong className="text-white">${formatPrice(setup.entry)}</strong></span>
                <span>TP1: <strong className="text-emerald-400">${formatPrice(setup.tp1)}</strong></span>
                <span>SL: <strong className="text-rose-400">${formatPrice(setup.sl)}</strong></span>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center font-sans font-semibold">
                Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
