import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { SignalHistoryRecord, TradingSetup } from '../types/crypto.ts';

interface LiveSignalsTrackerProps {
  onSelectSymbol?: (symbol: string) => void;
}

export const LiveSignalsTracker: React.FC<LiveSignalsTrackerProps> = ({ onSelectSymbol }) => {
  const [signals, setSignals] = useState<SignalHistoryRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchLiveSignals = () => {
    fetch('/api/history')
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          // Show active signals first, then recently closed signals
          const sorted = [...data].sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return b.timestamp - a.timestamp;
          });
          setSignals(sorted.slice(0, 5));
        }
      })
      .catch(() => {
        // Silently ignore transient network drops during server reload
      });
  };

  useEffect(() => {
    fetchLiveSignals();
    const interval = setInterval(fetchLiveSignals, 8000);
    return () => clearInterval(interval);
  }, []);

  if (signals.length === 0) return null;

  const activeCount = signals.filter(s => s.status === 'Active').length;
  const inProfitCount = signals.filter(s => (s.pnlPercent ?? 0) > 0).length;

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-5 font-mono">
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-xl overflow-hidden shadow-xl">
        {/* Toggle Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-3 bg-neutral-900/70 border-b border-neutral-800/80 flex items-center justify-between cursor-pointer hover:bg-neutral-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                متتبع التوصيات الحية والربح/الخسارة اللحظية (Live Signal PnL Tracker)
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {inProfitCount}/{signals.length} في مسار ربحي
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-[11px] hidden md:inline font-sans">
              رصد استمرار التوصية في الاتجاه الصحيح لحظة بلحظة
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Grid Cards */}
        {isExpanded && (
          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-neutral-950/80">
            {signals.map(s => {
              const isLong = s.signalType === 'CONFIRMED_LONG';
              const pnl = s.pnlPercent ?? 0;
              const isPos = pnl >= 0;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSymbol && onSelectSymbol(s.symbol)}
                  className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/90 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Symbol, Direction, Status */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs tracking-wide">
                        {s.symbol}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isLong ? 'text-emerald-400 bg-emerald-950 border border-emerald-800' : 'text-rose-400 bg-rose-950 border border-rose-800'}`}>
                        {isLong ? 'LONG 🟢' : 'SHORT 🔴'}
                      </span>
                    </div>

                    {/* Entry vs Current Price */}
                    <div className="text-[11px] text-neutral-400 space-y-0.5 mb-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">سعر الدخول:</span>
                        <strong className="text-neutral-200">${formatPrice(s.entry)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">السعر اللحظي:</span>
                        <strong className="text-white">${formatPrice(s.currentPrice || s.exitPrice || s.entry)}</strong>
                      </div>
                    </div>

                    {/* Live PnL Pill */}
                    <div className={`p-1.5 rounded text-center font-bold text-xs border mb-2 flex items-center justify-center gap-1 ${isPos ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-rose-950/60 border-rose-800/80 text-rose-300'}`}>
                      {isPos ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{isPos ? '+' : ''}{pnl.toFixed(2)}%</span>
                      <span className="text-[10px] font-normal opacity-80">
                        {s.status === 'Active' ? '(عائم)' : `(${s.status})`}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Trajectory & Peak */}
                  <div className="pt-2 border-t border-neutral-800/60 text-[10px]">
                    <div className="flex justify-between items-center text-neutral-400 mb-0.5">
                      <span>مسار التوصية:</span>
                      <strong className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.trajectory === 'STRONG_CONTINUATION'
                          ? 'استمرار قوي 🚀'
                          : s.trajectory === 'CORRECT_DIRECTION'
                          ? 'اتجاه صحيح ✅'
                          : s.trajectory === 'TESTING_ENTRY'
                          ? 'تذبذب دخول 🟡'
                          : 'ارتداد عكسي 🔴'}
                      </strong>
                    </div>
                    <div className="flex justify-between text-neutral-500 font-sans">
                      <span>ذروة الربح: <strong className="text-emerald-400 font-mono">+{(s.maxRunUpPercent ?? pnl).toFixed(1)}%</strong></span>
                      <span>تراجع: <strong className="text-rose-400/80 font-mono">-{(s.maxDrawdownPercent ?? 0).toFixed(1)}%</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
