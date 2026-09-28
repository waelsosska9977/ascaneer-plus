import React from 'react';
import { ArrowUpRight, CheckCircle2, ShieldAlert, Waves, Zap } from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';

interface WhaleFlowViewProps {
  setups: TradingSetup[];
  onSelectSetup: (setup: TradingSetup) => void;
}

export const WhaleFlowView: React.FC<WhaleFlowViewProps> = ({
  setups,
  onSelectSetup,
}) => {
  // Sort primarily by highest MFI & buy pressure
  const liquiditySetups = [...setups].sort(
    (a, b) => b.indicators.mfi + b.indicators.buyPressurePercent - (a.indicators.mfi + a.indicators.buyPressurePercent)
  );

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-mono">
      {/* View Header with Strict Methodology Transparency */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Institutional Liquidity & Relative Volume Flow
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-sans leading-relaxed max-w-3xl">
          Tracks relative taker volume aggression, 14-period Money Flow Index (MFI), and volume expansion vs. the 20-period moving average. The setup label <strong>"Whale Resilience"</strong> identifies coins sustaining accumulation structure (MFI &gt; 55, Taker Buy Pressure &gt; 52%, and Volume Expansion &gt; +15%) while maintaining price above key moving averages.
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-neutral-900 text-xs text-neutral-400">
          <span>Formula: <strong className="text-white">MFI + Taker Volume Delta + 20-SMA Ratio</strong></span>
          <span className="text-neutral-600">·</span>
          <span>Category: <strong className="text-cyan-400">Order Flow & Volume Concentration</strong></span>
        </div>
      </div>

      {/* Grid of Liquidity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liquiditySetups.map(setup => {
          const flow = setup.liquidityFlow;
          const ind = setup.indicators;
          const isWhale = flow.whaleResilience;

          let badgeColor = 'text-neutral-400 border-neutral-800 bg-neutral-900';
          if (flow.relativeFlow === 'High Institutional Inflow') {
            badgeColor = 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40';
          } else if (flow.relativeFlow === 'Moderate Inflow') {
            badgeColor = 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40';
          } else if (flow.relativeFlow === 'Outflow / Distribution') {
            badgeColor = 'text-rose-400 border-rose-800/80 bg-rose-950/40';
          }

          return (
            <div
              key={setup.symbol}
              onClick={() => onSelectSetup(setup)}
              className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg p-4 transition-all cursor-pointer shadow-lg hover:shadow-cyan-950/20 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {setup.symbol}
                    </span>
                    {isWhale && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                        WHALE RESILIENCE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    ${formatPrice(setup.price)}{' '}
                    <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ({setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-500">Flow Score</span>
                  <div className="text-base font-bold text-cyan-400">
                    {flow.moneyFlowScore}<span className="text-xs text-neutral-500 font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="mb-3">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}>
                  {flow.relativeFlow}
                </span>
              </div>

              {/* Indicators Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-900/60 p-2.5 rounded border border-neutral-800/80 mb-3">
                <div>
                  <span className="text-neutral-500 text-[11px] block">MFI (Money Flow):</span>
                  <strong className={ind.mfi > 50 ? 'text-emerald-400' : 'text-rose-400'}>
                    {ind.mfi.toFixed(1)} {ind.mfi > 50 ? '🟢' : '🔴'}
                  </strong>
                </div>

                <div>
                  <span className="text-neutral-500 text-[11px] block">Taker Buy Pressure:</span>
                  <strong className={ind.buyPressurePercent > 50 ? 'text-cyan-400' : 'text-neutral-300'}>
                    {ind.buyPressurePercent.toFixed(1)}%
                  </strong>
                </div>

                <div>
                  <span className="text-neutral-500 text-[11px] block">Vol vs 20-SMA:</span>
                  <strong className={ind.volumeChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {ind.volumeChangePercent >= 0 ? '+' : ''}{ind.volumeChangePercent.toFixed(1)}%
                  </strong>
                </div>

                <div>
                  <span className="text-neutral-500 text-[11px] block">VWAP Benchmark:</span>
                  <strong className={ind.priceVsVwap === 'above' ? 'text-emerald-400' : 'text-rose-400'}>
                    {ind.priceVsVwap === 'above' ? 'Above VWAP' : 'Below VWAP'}
                  </strong>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
                <span>Score: <strong className="text-white">{setup.score}/100</strong></span>
                <span className="text-cyan-400 font-sans font-medium flex items-center group-hover:underline">
                  Analyze Setup <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
