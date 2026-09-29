import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Hourglass,
  Layers,
  Search,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';
import { estimateTradeDuration, TradeDurationEstimate } from '../utils/durationEstimator.ts';

interface TradeDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setups: TradingSetup[];
  onSelectSetup: (setup: TradingSetup) => void;
}

export const TradeDurationModal: React.FC<TradeDurationModalProps> = ({
  isOpen,
  onClose,
  setups,
  onSelectSetup,
}) => {
  const [search, setSearch] = useState('');
  const [filterSpeed, setFilterSpeed] = useState<'ALL' | 'FAST' | 'MEDIUM' | 'SWING'>('ALL');
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [sortBy, setSortBy] = useState<'fastest_tp1' | 'fastest_tp2' | 'highest_profit' | 'score'>('fastest_tp1');

  // Compute duration estimates
  const items = useMemo(() => {
    return setups
      .filter(s => s.state === 'CONFIRMED_LONG' || s.state === 'CONFIRMED_SHORT' || s.state === 'WAIT_FOR_CONFIRMATION')
      .map(s => ({
        setup: s,
        duration: estimateTradeDuration(s),
      }));
  }, [setups]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(({ setup, duration }) => {
      if (search) {
        const q = search.trim().toUpperCase();
        if (!setup.symbol.includes(q)) return false;
      }
      if (filterSpeed !== 'ALL' && duration.speedCategory !== filterSpeed) {
        return false;
      }
      if (filterDirection === 'LONG' && setup.state !== 'CONFIRMED_LONG') return false;
      if (filterDirection === 'SHORT' && setup.state !== 'CONFIRMED_SHORT') return false;
      return true;
    });
  }, [items, search, filterSpeed, filterDirection]);

  // Sort items
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'fastest_tp1') return a.duration.tp1HoursAvg - b.duration.tp1HoursAvg;
      if (sortBy === 'fastest_tp2') return a.duration.tp2HoursAvg - b.duration.tp2HoursAvg;
      if (sortBy === 'highest_profit') return b.duration.targetGainTP2Percent - a.duration.targetGainTP2Percent;
      return b.setup.score - a.setup.score;
    });
  }, [filtered, sortBy]);

  if (!isOpen) return null;

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const fastCount = items.filter(i => i.duration.speedCategory === 'FAST').length;
  const mediumCount = items.filter(i => i.duration.speedCategory === 'MEDIUM').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 rounded-xl border border-amber-500/40 text-amber-400">
              <Hourglass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  جدول مدد الصفقات والوقت المتوقع للوصول للهدف (Trade Duration & ETA)
                </h3>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold rounded-full">
                  {sorted.length} صفقة
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                تقدير رياضي تقريبي لعدد الساعات المطلوبة لتحقيق الهدف الأول (TP1) والانتهاء التام من الصفقة (TP2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Quick Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterSpeed('ALL')}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors cursor-pointer ${
                filterSpeed === 'ALL'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              الكل ({items.length})
            </button>
            <button
              onClick={() => setFilterSpeed('FAST')}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-colors cursor-pointer ${
                filterSpeed === 'FAST'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              ⚡ صفقات سريعة (1 - 4 س) ({fastCount})
            </button>
            <button
              onClick={() => setFilterSpeed('MEDIUM')}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-colors cursor-pointer ${
                filterSpeed === 'MEDIUM'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              ⏱️ صفقات يومية (5 - 10 س) ({mediumCount})
            </button>
            <button
              onClick={() => setFilterSpeed('SWING')}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors cursor-pointer ${
                filterSpeed === 'SWING'
                  ? 'bg-purple-950 text-purple-300 border border-purple-700'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              📅 سوينغ ممتد (12+ س)
            </button>
          </div>

          {/* Direction & Sort */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
              <button
                onClick={() => setFilterDirection('ALL')}
                className={`px-2 py-1 rounded text-[11px] font-mono ${
                  filterDirection === 'ALL' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterDirection('LONG')}
                className={`px-2 py-1 rounded text-[11px] font-mono ${
                  filterDirection === 'LONG' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-neutral-400'
                }`}
              >
                🟢 Long
              </button>
              <button
                onClick={() => setFilterDirection('SHORT')}
                className={`px-2 py-1 rounded text-[11px] font-mono ${
                  filterDirection === 'SHORT' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-neutral-400'
                }`}
              >
                🔴 Short
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 font-mono cursor-pointer outline-none"
            >
              <option value="fastest_tp1">⚡ الأسرع وصولاً للهدف الأول</option>
              <option value="fastest_tp2">⏱️ الأسرع انتهاءً بالكامل</option>
              <option value="highest_profit">🎯 الأعلى ربحاً متوقعاً</option>
              <option value="score">⭐ أعلى جودة فنية (Score)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-right border-collapse font-sans text-xs">
            <thead className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 text-[11px] font-mono text-neutral-400 uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold text-right">العملة والسعر</th>
                <th className="py-3 px-3 font-semibold text-center">إشارة الدخول والاتجاه</th>
                <th className="py-3 px-3 font-semibold text-center">سعر الدخول (Entry)</th>
                <th className="py-3 px-4 font-semibold text-center text-emerald-400 bg-emerald-950/20">
                  🎯 الهدف الأول (TP1) والمدة المتوقعة
                </th>
                <th className="py-3 px-4 font-semibold text-center text-teal-300 bg-teal-950/20">
                  🏁 انتهاء الصفقة (TP2) والمدة الإجمالية
                </th>
                <th className="py-3 px-3 font-semibold text-center text-rose-400">وقف الخسارة (SL)</th>
                <th className="py-3 px-3 font-semibold text-center">نوع وسرعة الصفقة</th>
                <th className="py-3 px-3 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850 font-mono text-xs">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 font-sans">
                    لا توجد عملات تطابق البحث المحدد حالياً.
                  </td>
                </tr>
              ) : (
                sorted.map(({ setup, duration }) => {
                  const isLong = setup.state === 'CONFIRMED_LONG';
                  const isShort = setup.state === 'CONFIRMED_SHORT';

                  return (
                    <tr
                      key={setup.symbol}
                      className="hover:bg-neutral-850/60 transition-colors group cursor-pointer"
                      onClick={() => {
                        onSelectSetup(setup);
                        onClose();
                      }}
                    >
                      {/* Symbol & Price */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                            {setup.symbol}
                          </span>
                          {setup.isPToken && (
                            <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[9px]">
                              P
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span>${formatPrice(setup.price)}</span>
                          <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </td>

                      {/* Signal & Direction */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                              isLong
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700/80 shadow-sm shadow-emerald-950'
                                : isShort
                                ? 'bg-rose-950 text-rose-300 border-rose-700/80 shadow-sm shadow-rose-950'
                                : 'bg-amber-950 text-amber-300 border-amber-700'
                            }`}
                          >
                            {isLong ? (
                              <>
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                <span>دخول شراء (LONG)</span>
                              </>
                            ) : isShort ? (
                              <>
                                <TrendingDown className="w-3 h-3 text-rose-400" />
                                <span>دخول بيع (SHORT)</span>
                              </>
                            ) : (
                              <span>انتظار تأكيد</span>
                            )}
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-0.5">
                            سكور: <strong className="text-white">{setup.score}</strong>/100
                          </span>
                        </div>
                      </td>

                      {/* Entry Price & Zone */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-white">${formatPrice(setup.entry)}</div>
                        {setup.entryZone && (
                          <div className="text-[10px] text-sky-400 font-mono">
                            نطاق: ${formatPrice(setup.entryZone.min)}
                          </div>
                        )}
                      </td>

                      {/* Target 1 (TP1) & ETA */}
                      <td className="py-3 px-4 text-center bg-emerald-950/15">
                        <div className="font-bold text-emerald-400">${formatPrice(setup.tp1)}</div>
                        <div className="text-[11px] text-emerald-300 font-bold">
                          +{duration.targetGainTP1Percent}%
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold font-mono">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>~{duration.tp1Text}</span>
                        </div>
                      </td>

                      {/* Target 2 (TP2 - Completion) & ETA */}
                      <td className="py-3 px-4 text-center bg-teal-950/15">
                        <div className="font-bold text-teal-300">${formatPrice(setup.tp2)}</div>
                        <div className="text-[11px] text-teal-300 font-bold">
                          +{duration.targetGainTP2Percent}%
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-950/80 border border-teal-700 text-teal-200 text-[10px] font-bold font-mono">
                          <Timer className="w-3 h-3 text-teal-400" />
                          <span>~{duration.tp2Text} انتهاء</span>
                        </div>
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-rose-400">${formatPrice(setup.sl)}</div>
                        <div className="text-[10px] text-neutral-400">
                          {setup.riskRewardRatio.toFixed(1)}:1 R:R
                        </div>
                      </td>

                      {/* Speed Category */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${duration.speedBadgeColor}`}
                        >
                          {duration.speedCategoryArabic}
                        </span>
                        <div className="text-[9px] text-neutral-400 mt-1">
                          معدل: ~{duration.hourlyVelocityPercent}% / س
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectSetup(setup);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-medium text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <span>عرض</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-neutral-300">💡 ملاحظة للمتداول:</span>
            <span>المدد الزمنية محسوبة بناءً على متوسط الحركة السعرية (ATR) وحجم السيولة وزخم شمعات الـ 15 دقيقة والساعة.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            إغلاق الجدول
          </button>
        </div>
      </div>
    </div>
  );
};
