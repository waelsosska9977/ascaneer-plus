import React from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Clock, ShieldAlert, Waves, Zap } from 'lucide-react';
import { MarketOverview } from '../types/crypto.ts';

interface MarketOverviewBarProps {
  overview: MarketOverview | null;
  secondsRemaining: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MarketOverviewBar: React.FC<MarketOverviewBarProps> = ({
  overview,
  secondsRemaining,
  onRefresh,
  isRefreshing = false,
}) => {
  const statusBadge = overview?.status === 'Market Bullish' ? (
    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>Market Bullish</span>
    </div>
  ) : overview?.status === 'Market Bearish' ? (
    <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-sm">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      <span>Market Bearish</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      <span>Mixed Market</span>
    </div>
  );

  return (
    <div className="bg-neutral-950 border-b border-neutral-800/80 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Market Status & Scanner Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-neutral-500 font-mono">Market Regime:</span>
            {statusBadge}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono text-neutral-400">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="تحديث فوري يدوي للمؤشرات والعملات"
                className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-emerald-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث يدوي ⚡'}</span>
              </button>
            )}

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              Next Scan in:{' '}
              <strong className="text-neutral-200">
                {Math.max(0, secondsRemaining)}s
                {secondsRemaining >= 60 && (
                  <span className="text-neutral-400 font-normal ml-1">
                    ({Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')})
                  </span>
                )}
              </strong>
            </span>
            <span className="hidden sm:inline text-neutral-600">·</span>
            <span className="hidden sm:inline">
              BTC: <strong className="text-white">${overview?.btcPrice.toLocaleString() || '96,500'}</strong>
            </span>
            <span className="hidden sm:inline text-neutral-600">·</span>
            <span className="hidden sm:inline">
              Dominance: <strong className="text-neutral-200">{overview?.btcDominance || 58.4}%</strong>
            </span>
          </div>
        </div>

        {/* 6 Key Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-neutral-300">
          {/* Total Scanned */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Scanned Pairs</span>
              <Activity className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {overview?.totalCoinsScanned || 0}
            </div>
          </div>

          {/* Long Setups */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Long Setups</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {overview?.longSetupsCount || 0}
            </div>
          </div>

          {/* Short Setups */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Short Setups</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg font-bold font-mono text-rose-400">
              {overview?.shortSetupsCount || 0}
            </div>
          </div>

          {/* Waiting for Confirmation */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Waiting Conf.</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {overview?.waitingCount || 0}
            </div>
          </div>

          {/* High Volume Expansion */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Vol. Expansion</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-400">
              {overview?.highVolumeCount || 0}
            </div>
          </div>

          {/* Whale Flow Setups */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Whale Flow</span>
              <Waves className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold font-mono text-indigo-400">
              {overview?.whaleSetupsCount || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
