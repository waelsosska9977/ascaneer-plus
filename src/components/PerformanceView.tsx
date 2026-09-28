import React, { useEffect, useState } from 'react';
import { Award, BarChart3, CheckCircle2, Percent, ShieldCheck, Target, TrendingUp, XCircle } from 'lucide-react';
import { PerformanceStats } from '../types/crypto.ts';

export const PerformanceView: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/performance')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-neutral-500 font-mono text-xs">
        Computing empirical signal performance metrics from recorded history...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-mono">
      {/* Overview Header */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Signal Performance Analytics (Historical Track Record)
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-sans max-w-3xl leading-relaxed">
          Real mathematical calculations derived strictly from the recorded signals journal. Win rates reflect the proportion of resolved trades that reached Take Profit 1 or Take Profit 2 prior to hitting the stop loss or triggering an invalidation exit.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
          <div className="text-neutral-500 text-[11px] mb-1">Total Signals</div>
          <div className="text-xl font-bold text-white">{stats.totalSignals}</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
          <div className="text-neutral-500 text-[11px] mb-1">TP1 Win Rate</div>
          <div className="text-xl font-bold text-emerald-400">{stats.winRateTP1}%</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
          <div className="text-neutral-500 text-[11px] mb-1">TP2 Win Rate</div>
          <div className="text-xl font-bold text-emerald-500">{stats.winRateTP2}%</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
          <div className="text-neutral-500 text-[11px] mb-1">Average R:R</div>
          <div className="text-xl font-bold text-cyan-400">1:{stats.avgRR}</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
          <div className="text-neutral-500 text-[11px] mb-1">Average Score</div>
          <div className="text-xl font-bold text-amber-400">{stats.avgScore}</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
          <div className="text-neutral-500 text-[11px] mb-1">Active Positions</div>
          <div className="text-xl font-bold text-sky-400">{stats.active}</div>
        </div>
      </div>

      {/* Outcome Breakdown & Performance by Score Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outcome Breakdown Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">
            Target Resolution Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Take Profit 1 (TP1) Hits:
              </span>
              <strong className="text-white text-sm">{stats.tp1Hits} Trades</strong>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-2 text-emerald-500">
                <Target className="w-4 h-4" /> Take Profit 2 (TP2) Extended:
              </span>
              <strong className="text-white text-sm">{stats.tp2Hits} Trades</strong>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-2 text-rose-400">
                <XCircle className="w-4 h-4" /> Stop Loss (SL) Hits:
              </span>
              <strong className="text-white text-sm">{stats.slHits} Trades</strong>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-2 text-neutral-400">
                <ShieldCheck className="w-4 h-4" /> Invalidated Pre-SL:
              </span>
              <strong className="text-white text-sm">{stats.invalidated} Trades</strong>
            </div>
          </div>
        </div>

        {/* Performance by Score Range (User explicit Requirement 25) */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">
            Empirical Win Rate by Score Range
          </h3>

          <div className="space-y-3 text-xs">
            {stats.byScoreRange.map(r => (
              <div key={r.range} className="space-y-1">
                <div className="flex items-center justify-between text-neutral-300 text-[11px]">
                  <span>Score Range: <strong className="text-white">{r.range}</strong></span>
                  <span>{r.count} Signals · Win Rate: <strong className="text-emerald-400">{r.winRate}%</strong></span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, r.winRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
