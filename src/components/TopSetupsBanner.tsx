import React from 'react';
import { ArrowUpRight, Flame, Target, TrendingUp, Waves } from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';

interface TopSetupsBannerProps {
  setups: TradingSetup[];
  onSelectSetup: (setup: TradingSetup) => void;
}

export const TopSetupsBanner: React.FC<TopSetupsBannerProps> = ({
  setups,
  onSelectSetup,
}) => {
  // Sort by score descending, filtering for valid high score setups
  const topSetups = [...setups]
    .filter(s => s.score >= 65 && s.state !== 'NO_SETUP')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (topSetups.length === 0) return null;

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Highest Score Setups
          </h2>
        </div>
        <span className="text-[11px] text-neutral-500 font-mono">
          Evaluated algorithmically · Score is not an outcome guarantee
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {topSetups.map(setup => {
          const isLong = setup.state === 'CONFIRMED_LONG';
          const isShort = setup.state === 'CONFIRMED_SHORT';
          const isWhale = setup.setupType === 'Whale Resilience';

          const stateColor = isLong
            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
            : isShort
            ? 'text-rose-400 bg-rose-950/40 border-rose-800/60'
            : 'text-amber-400 bg-amber-950/40 border-amber-800/60';

          const stateLabel = isLong
            ? 'CONFIRMED LONG'
            : isShort
            ? 'CONFIRMED SHORT'
            : 'WAIT FOR CONFIRMATION';

          return (
            <div
              key={setup.symbol}
              onClick={() => onSelectSetup(setup)}
              className="group bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg p-3.5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Symbol & Score */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white font-mono group-hover:text-emerald-400 transition-colors">
                        {setup.symbol}
                      </span>
                      {isWhale && (
                        <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">
                          <Waves className="w-2.5 h-2.5" /> Whale
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                      <span className="text-white">${formatPrice(setup.price)}</span>
                      <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-neutral-400 font-mono">Score</div>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {setup.score}<span className="text-xs text-neutral-500 font-normal">/100</span>
                    </div>
                  </div>
                </div>

                {/* State Tag */}
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${stateColor}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {stateLabel}
                  </span>
                </div>

                {/* MTF & Technical Indicators Preview */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-neutral-950/60 p-2 rounded border border-neutral-800/60 mb-3">
                  <div>
                    <span className="text-neutral-500">MTF Alignment:</span>
                    <strong className="ml-1 text-white">{setup.mtf.alignmentFraction}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">R:R Ratio:</span>
                    <strong className="ml-1 text-emerald-400">1:{setup.riskRewardRatio}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">RSI (14):</span>
                    <strong className="ml-1 text-neutral-200">{setup.indicators.rsi.toFixed(1)}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">VWAP:</span>
                    <strong className={`ml-1 ${setup.indicators.priceVsVwap === 'above' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {setup.indicators.priceVsVwap === 'above' ? 'Above' : 'Below'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Targets Preview Footer */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Entry: <strong className="text-neutral-200">${formatPrice(setup.entry)}</strong></span>
                <span>TP1: <strong className="text-emerald-400">${formatPrice(setup.tp1)}</strong></span>
                <span>SL: <strong className="text-rose-400">${formatPrice(setup.sl)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
