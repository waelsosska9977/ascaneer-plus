import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, Filter, History, XCircle } from 'lucide-react';
import { SignalHistoryRecord } from '../types/crypto.ts';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<SignalHistoryRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'INVALIDATED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = history.filter(item => {
    if (filter === 'ACTIVE') return item.status === 'Active';
    if (filter === 'TP_HIT') return item.status === 'TP1 Hit' || item.status === 'TP2 Hit';
    if (filter === 'SL_HIT') return item.status === 'SL Hit';
    if (filter === 'INVALIDATED') return item.status === 'Invalidated';
    return true;
  });

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const getStatusBadge = (status: SignalHistoryRecord['status']) => {
    switch (status) {
      case 'TP2 Hit':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
            🎯 TP2 HIT
          </span>
        );
      case 'TP1 Hit':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
            🎯 TP1 HIT
          </span>
        );
      case 'SL Hit':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 border border-rose-800 text-rose-300">
            🛑 SL HIT
          </span>
        );
      case 'Invalidated':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-900 border border-neutral-700 text-neutral-400">
            ⚠️ INVALIDATED
          </span>
        );
      case 'Active':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-950 border border-sky-800 text-sky-400">
            ⚡ ACTIVE
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-mono">
      {/* Header */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <History className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Immutable Signal History & Lifecycle Tracking
              </h2>
            </div>
            <p className="text-xs text-neutral-400 font-sans">
              Every identified setup is permanently committed to history. Outcomes are evaluated algorithmically against live high/low ticks without retrospective curve-fitting.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded cursor-pointer ${filter === 'ALL' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded cursor-pointer ${filter === 'ACTIVE' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-neutral-400 hover:text-white'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('TP_HIT')}
              className={`px-3 py-1.5 rounded cursor-pointer ${filter === 'TP_HIT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-neutral-400 hover:text-white'}`}
            >
              TP Hit
            </button>
            <button
              onClick={() => setFilter('SL_HIT')}
              className={`px-3 py-1.5 rounded cursor-pointer ${filter === 'SL_HIT' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-neutral-400 hover:text-white'}`}
            >
              SL Hit
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Symbol</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Setup</th>
                <th className="py-2.5 px-3 font-semibold">Score</th>
                <th className="py-2.5 px-3 font-semibold">Entry</th>
                <th className="py-2.5 px-3 font-semibold">TP1</th>
                <th className="py-2.5 px-3 font-semibold">TP2</th>
                <th className="py-2.5 px-3 font-semibold">SL</th>
                <th className="py-2.5 px-3 font-semibold">Outcome Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">PnL %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 font-mono text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-500 font-sans">
                    Loading signal history records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-500 font-sans">
                    No signals matched the selected status filter.
                  </td>
                </tr>
              ) : (
                filtered.map(record => {
                  const dateStr = new Date(record.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const isLong = record.signalType === 'CONFIRMED_LONG';

                  return (
                    <tr key={record.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-500 text-[11px]">
                        {dateStr}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                        {record.symbol}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={isLong ? 'text-emerald-400' : 'text-rose-400'}>
                          {isLong ? 'LONG 🟢' : 'SHORT 🔴'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-400 text-[11px]">
                        {record.setupType}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-emerald-400 font-bold">
                        {record.score}/100
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-200">
                        ${formatPrice(record.entry)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-emerald-400">
                        ${formatPrice(record.tp1)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-emerald-500">
                        ${formatPrice(record.tp2)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-rose-400">
                        ${formatPrice(record.sl)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-right font-bold">
                        {record.pnlPercent !== undefined ? (
                          <span className={record.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {record.pnlPercent >= 0 ? '+' : ''}{record.pnlPercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-neutral-500">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
