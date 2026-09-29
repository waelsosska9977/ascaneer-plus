import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  History,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { EntryAccuracy, SignalHistoryRecord, SignalTrajectory } from '../types/crypto.ts';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<SignalHistoryRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CONTINUATION' | 'REVERSAL' | 'TP_HIT' | 'SL_HIT'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = () => {
    fetch('/api/history')
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {
        // Silently handle transient reconnect
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHistory();
    // Poll every 10 seconds for real-time live PnL updates
    const timer = setInterval(fetchHistory, 10000);
    return () => clearInterval(timer);
  }, []);

  const filtered = history.filter(item => {
    if (filter === 'ACTIVE') return item.status === 'Active';
    if (filter === 'CONTINUATION') {
      return item.trajectory === 'STRONG_CONTINUATION' || item.trajectory === 'CORRECT_DIRECTION';
    }
    if (filter === 'REVERSAL') {
      return item.trajectory === 'REVERSAL_AGAINST' || item.status === 'SL Hit';
    }
    if (filter === 'TP_HIT') return item.status === 'TP1 Hit' || item.status === 'TP2 Hit';
    if (filter === 'SL_HIT') return item.status === 'SL Hit';
    return true;
  });

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  // KPIs
  const total = history.length;
  const continuations = history.filter(
    h => h.trajectory === 'STRONG_CONTINUATION' || h.trajectory === 'CORRECT_DIRECTION' || h.status === 'TP1 Hit' || h.status === 'TP2 Hit'
  ).length;
  const continuationRate = total > 0 ? Number(((continuations / total) * 100).toFixed(1)) : 0;

  const validEntries = history.filter(
    h => h.entryAccuracy === 'PERFECT_TIMING' || h.entryAccuracy === 'SOUND_ENTRY'
  ).length;
  const entryAccuracyRate = total > 0 ? Number(((validEntries / total) * 100).toFixed(1)) : 0;

  const avgRunUp = total > 0
    ? Number((history.reduce((acc, h) => acc + (h.maxRunUpPercent ?? 0), 0) / total).toFixed(2))
    : 0;

  const avgDrawdown = total > 0
    ? Number((history.reduce((acc, h) => acc + (h.maxDrawdownPercent ?? 0), 0) / total).toFixed(2))
    : 0;

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
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-950 border border-sky-800 text-sky-400 flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            ACTIVE
          </span>
        );
    }
  };

  const getTrajectoryBadge = (trajectory?: SignalTrajectory) => {
    switch (trajectory) {
      case 'STRONG_CONTINUATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300 flex items-center gap-1 w-fit">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            استمرار قوي 🚀
          </span>
        );
      case 'CORRECT_DIRECTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            اتجاه صحيح ✅
          </span>
        );
      case 'TESTING_ENTRY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/50 border border-amber-800 text-amber-300 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-amber-400" />
            تذبذب الدخول 🟡
          </span>
        );
      case 'REVERSAL_AGAINST':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-1 w-fit">
            <TrendingDown className="w-3 h-3 text-rose-400" />
            ارتداد عكسي 🔴
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-neutral-400">قيد الرصد</span>
        );
    }
  };

  const getAccuracyBadge = (accuracy?: EntryAccuracy) => {
    switch (accuracy) {
      case 'PERFECT_TIMING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/70 border border-cyan-700 text-cyan-300 flex items-center gap-1 w-fit">
            <Target className="w-3 h-3 text-cyan-400" />
            توقيت مثالي 🎯
          </span>
        );
      case 'SOUND_ENTRY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            نقطة سليمة 100%
          </span>
        );
      case 'EXTENDED_ENTRY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 border border-amber-800 text-amber-300 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            تحت الاختبار ⚠️
          </span>
        );
      case 'FAILED_ENTRY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-400" />
            فشل التحليل ❌
          </span>
        );
      default:
        return <span className="text-[10px] text-neutral-500">-</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-mono">
      {/* Top Header & Core Purpose Banner */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                تعقب أداء التوصيات اللحظي وصحة نقاط الدخول (Real-Time Signal Trajectory Tracker)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              يقوم هذا النظام برصد كل توصية لحظة صدورها: هل واصلت الحركة في الاتجاه الصحيح فوراً نحو الأهداف أم عكست ضد نقطة الدخول؟ لحساب قيمة الربح/الخسارة الفعلية والتأكد من دقة نقطة الدخول قبل المخاطرة.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filter === 'ALL' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              الكل ({history.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filter === 'ACTIVE' ? 'bg-sky-950 text-sky-300 border border-sky-800 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              ⚡ نشطة لحظياً
            </button>
            <button
              onClick={() => setFilter('CONTINUATION')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filter === 'CONTINUATION' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              🟢 اتجاه صحيح
            </button>
            <button
              onClick={() => setFilter('REVERSAL')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filter === 'REVERSAL' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              🔴 ارتداد عكسي
            </button>
            <button
              onClick={() => setFilter('TP_HIT')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filter === 'TP_HIT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              🎯 حققت الأهداف
            </button>
            <button
              onClick={() => setFilter('SL_HIT')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filter === 'SL_HIT' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              🛑 ضربت الوقف
            </button>
          </div>
        </div>

        {/* 4 Live Verification KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
            <div className="text-neutral-500 text-[11px] mb-1 font-sans">نسبة استمرار التوصيات في الاتجاه الصحيح</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
              <span>{continuationRate}%</span>
              <span className="text-[10px] text-neutral-400 font-normal font-sans">({continuations}/{total})</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 font-sans mt-0.5">تتحرك فوراً نحو الربح</div>
          </div>

          <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
            <div className="text-neutral-500 text-[11px] mb-1 font-sans">دقة توقيت نقطة الدخول (Entry Accuracy)</div>
            <div className="text-lg font-bold text-sky-400 flex items-center gap-1.5">
              <span>{entryAccuracyRate}%</span>
              <span className="text-[10px] text-neutral-400 font-normal font-sans">({validEntries}/{total})</span>
            </div>
            <div className="text-[10px] text-sky-400/80 font-sans mt-0.5">دخول سليم دون انعكاس</div>
          </div>

          <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
            <div className="text-neutral-500 text-[11px] mb-1 font-sans">متوسط أقصى صعود ربحي (Peak Run-up)</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              +{avgRunUp}%
            </div>
            <div className="text-[10px] text-neutral-400 font-sans mt-0.5">أعلى ربح بلغته الصفقات</div>
          </div>

          <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
            <div className="text-neutral-500 text-[11px] mb-1 font-sans">متوسط أقصى تراجع ضد الدخول (Drawdown)</div>
            <div className="text-lg font-bold text-rose-400 font-mono">
              -{avgDrawdown}%
            </div>
            <div className="text-[10px] text-neutral-400 font-sans mt-0.5">مخاطرة محكمة ومحدودة</div>
          </div>
        </div>
      </div>

      {/* Main Signal Trajectory & PnL Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                <th className="py-3 px-3 font-semibold">التاريخ</th>
                <th className="py-3 px-3 font-semibold">العملة والنوع</th>
                <th className="py-3 px-3 font-semibold">سعر الدخول</th>
                <th className="py-3 px-3 font-semibold">السعر الحالي / الخروج</th>
                <th className="py-3 px-3 font-semibold text-center">الربح / الخسارة (PnL %)</th>
                <th className="py-3 px-3 font-semibold">مسار الحركة (Trajectory)</th>
                <th className="py-3 px-3 font-semibold">أعلى ربح / أقصى تراجع</th>
                <th className="py-3 px-3 font-semibold">صحة نقطة الدخول</th>
                <th className="py-3 px-3 font-semibold">حالة الهدف</th>
                <th className="py-3 px-3 font-semibold">تفاصيل مسار التوصية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 font-mono text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500 font-sans">
                    جاري تحميل وتحديث مسار التوصيات اللحظي...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500 font-sans">
                    لا توجد توصيات تطابق التصنيف المختار حالياً.
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
                  const pnl = record.pnlPercent ?? 0;
                  const isPositive = pnl >= 0;

                  return (
                    <tr key={record.id} className="hover:bg-neutral-900/50 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-500 text-[11px]">
                        {dateStr}
                      </td>

                      {/* Symbol & Direction */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{record.symbol}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${isLong ? 'text-emerald-400 bg-emerald-950 border border-emerald-800' : 'text-rose-400 bg-rose-950 border border-rose-800'}`}>
                            {isLong ? 'LONG 🟢' : 'SHORT 🔴'}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-sans mt-0.5">
                          {record.setupType}
                        </div>
                      </td>

                      {/* Entry Price & Zone */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-white font-medium">${formatPrice(record.entry)}</div>
                        {record.entryZone && (
                          <div className="text-[10px] text-sky-400 font-mono">
                            Zone: ${formatPrice(record.entryZone.min)} - ${formatPrice(record.entryZone.max)}
                          </div>
                        )}
                      </td>

                      {/* Current / Exit Price */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-neutral-200">
                        ${formatPrice(record.currentPrice || record.exitPrice || record.entry)}
                        {record.exitPrice && (
                          <span className="block text-[10px] text-neutral-500">تم الخروج</span>
                        )}
                      </td>

                      {/* Live PnL % */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border ${isPositive ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' : 'bg-rose-950/80 border-rose-700 text-rose-300'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                          {isPositive ? '+' : ''}{pnl.toFixed(2)}%
                        </span>
                      </td>

                      {/* Trajectory */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getTrajectoryBadge(record.trajectory)}
                      </td>

                      {/* Max Run-up & Drawdown */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <div className="text-emerald-400 font-semibold">
                          ذروة: +{(record.maxRunUpPercent ?? pnl).toFixed(2)}%
                        </div>
                        <div className="text-rose-400/80 text-[11px]">
                          تراجع: -{(record.maxDrawdownPercent ?? 0).toFixed(2)}%
                        </div>
                      </td>

                      {/* Entry Accuracy */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getAccuracyBadge(record.entryAccuracy)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>

                      {/* Continuation Notes */}
                      <td className="py-3 px-3 text-xs text-neutral-400 font-sans max-w-xs leading-relaxed">
                        {record.continuationNotes || 'تتحرك التوصية وفق المعايير الفنية المحددة'}
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
