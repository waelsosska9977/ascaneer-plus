import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Clock,
  Hourglass,
  RefreshCw,
  Target,
  Timer,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { StrictEntryEvaluation, StrictFilterSettings, TradingSetup } from '../types/crypto.ts';
import {
  evaluateStrictEntry,
  loadStrictFilterSettings,
  saveStrictFilterSettings,
} from '../utils/strictFilter.ts';
import { estimateTradeDuration } from '../utils/durationEstimator.ts';
import { StrictEntryFilterBar } from './StrictEntryFilterBar.tsx';
import { StrictSettingsModal } from './StrictSettingsModal.tsx';
import { TradeDurationModal } from './TradeDurationModal.tsx';

interface MobileCardViewProps {
  setups: TradingSetup[];
  onSelectSetup: (setup: TradingSetup) => void;
  onOpenStockTokensModal?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  setups,
  onSelectSetup,
  onOpenStockTokensModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'stock' | 'long' | 'short'>('all');

  // Strict Master Filter State
  const [strictSettings, setStrictSettings] = useState<StrictFilterSettings>(() =>
    loadStrictFilterSettings()
  );
  const [isStrictModalOpen, setIsStrictModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  const handleUpdateStrictSettings = (newSettings: StrictFilterSettings) => {
    setStrictSettings(newSettings);
    saveStrictFilterSettings(newSettings);
  };

  // Evaluate strict entry for all setups
  const strictEvaluations = useMemo(() => {
    const map = new Map<string, StrictEntryEvaluation>();
    for (const s of setups) {
      map.set(s.symbol, evaluateStrictEntry(s, strictSettings));
    }
    return map;
  }, [setups, strictSettings]);

  // Setups passing strict filters
  const qualifiedSetups = useMemo(() => {
    return setups.filter(s => strictEvaluations.get(s.symbol)?.isQualified);
  }, [setups, strictEvaluations]);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const filteredSetups = setups.filter(s => {
    // 1. Strict filter
    if (strictSettings.enabled) {
      const evaluation = strictEvaluations.get(s.symbol);
      if (!evaluation?.isQualified) return false;
    }

    // 2. Sub-filters
    if (filter === 'stock') {
      return (
        s.isPToken ||
        s.category === 'PREMARKET_P' ||
        s.symbol.endsWith('USDTP') ||
        s.symbol.endsWith('P') ||
        s.symbol.includes('SNDK') ||
        s.symbol.includes('NSDK') ||
        s.symbol.includes('SPX')
      );
    }
    if (filter === 'long') return s.state === 'CONFIRMED_LONG';
    if (filter === 'short') return s.state === 'CONFIRMED_SHORT';
    return true;
  });

  const stockCount = setups.filter(
    s =>
      s.isPToken ||
      s.category === 'PREMARKET_P' ||
      s.symbol.endsWith('USDTP') ||
      s.symbol.endsWith('P') ||
      s.symbol.includes('SNDK') ||
      s.symbol.includes('NSDK') ||
      s.symbol.includes('SPX')
  ).length;

  return (
    <div className="block lg:hidden max-w-7xl mx-auto px-4 py-2 space-y-3 font-mono">
      {/* Top Master Strict Filter Bar */}
      <StrictEntryFilterBar
        settings={strictSettings}
        onChangeSettings={handleUpdateStrictSettings}
        onOpenSettingsModal={() => setIsStrictModalOpen(true)}
        onOpenDurationModal={() => setIsDurationModalOpen(true)}
        qualifiedSetups={qualifiedSetups}
        totalSetupsCount={setups.length}
        onSelectSetup={onSelectSetup}
      />

      {/* Secondary Controls */}
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              الكل ({strictSettings.enabled ? qualifiedSetups.length : setups.length})
            </button>
            <button
              onClick={() => setFilter('stock')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                filter === 'stock'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ⚡ توكنات P ({stockCount})
            </button>
            <button
              onClick={() => setFilter('long')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'long' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-neutral-400'
              }`}
            >
              🟢 Long
            </button>
            <button
              onClick={() => setFilter('short')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'short' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-neutral-400'
              }`}
            >
              🔴 Short
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsDurationModalOpen(true)}
              title="فتح جدول مدد الصفقات وساعات الوصول للأهداف"
              className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span className="text-[10px]">مدد الصفقات</span>
            </button>

            {onOpenStockTokensModal && (
              <button
                onClick={onOpenStockTokensModal}
                title="إدارة توكنات P وما قبل التداول"
                className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-bold flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[10px]">توكنات P</span>
              </button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-[10px]">{isRefreshing ? '...' : 'تحديث ⚡'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards List or Empty State */}
      {filteredSetups.length === 0 ? (
        <div className="py-12 px-4 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 font-sans">
          <Target className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">لا توجد صفقات تطابق معايير الصرامة القصوى</h4>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
            الفلتر الصارم يستبعد الصفقات غير المؤكدة أو ذات العائد المنخفض. يمكنك تخفيف المعايير أو مراجعة إعدادات الصرامة.
          </p>
          <button
            onClick={() => setIsStrictModalOpen(true)}
            className="px-4 py-2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold font-mono"
          >
            ⚙️ تعديل معايير الصرامة
          </button>
        </div>
      ) : (
        filteredSetups.map(setup => {
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

          const isPToken =
            setup.isPToken ||
            setup.category === 'PREMARKET_P' ||
            setup.symbol.endsWith('USDTP') ||
            setup.symbol.endsWith('P') ||
            setup.symbol.includes('SNDK') ||
            setup.symbol.includes('NSDK');

          const evalData = strictEvaluations.get(setup.symbol);

          return (
            <div
              key={setup.symbol}
              onClick={() => onSelectSetup(setup)}
              className={`bg-neutral-950 border rounded-xl p-3.5 hover:border-neutral-700 transition-all cursor-pointer shadow-md ${
                strictSettings.enabled && evalData?.isQualified
                  ? 'border-emerald-600/60 shadow-emerald-950/20'
                  : 'border-neutral-800'
              }`}
            >
              {/* Header: Symbol, Price, Score, State */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-white tracking-wide">
                      {setup.symbol}
                    </span>
                    {strictSettings.enabled && evalData?.isQualified && (
                      <span className="text-[9px] text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700 font-bold">
                        {evalData.strictGrade === 'AAA_ELITE' ? '⭐ AAA' : '⚡ STRICT'}
                      </span>
                    )}
                    {isPToken && (
                      <span className="text-[9px] text-cyan-300 bg-cyan-950 px-1 py-0.5 rounded border border-cyan-800/80">
                        P-TOKEN
                      </span>
                    )}
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
                  {setup.entryZone && (
                    <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                      Zone: ${formatPrice(setup.entryZone.min)} - ${formatPrice(setup.entryZone.max)}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 uppercase">Score</span>
                  <div className="text-sm font-bold text-emerald-400">
                    {setup.score}<span className="text-xs text-neutral-500 font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Strict Profit & Targets Banner in Mobile Card */}
              {evalData && (
                <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-lg p-2 mb-2 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">TP1: +{evalData.tp1GainPercent.toFixed(1)}%</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-teal-300 font-bold">TP2: +{evalData.tp2GainPercent.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold">{evalData.realizedRR.toFixed(1)}:1 R:R</span>
                      <span className="text-rose-400">SL: -{evalData.slRiskPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5 border-t border-emerald-900/40">
                    <span className="text-amber-300 font-semibold">
                      🚀 ارتفاع: {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(1)}% (≤ {strictSettings.max24hChangePercent}%)
                    </span>
                    <span className="text-cyan-300 font-semibold">
                      💧 سيولة: ${(setup.quoteVolume24h / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              )}

              {/* Estimated Trade Duration ETA row in mobile card */}
              {(() => {
                const duration = estimateTradeDuration(setup);
                return (
                  <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-2 mb-2 text-[10px] font-mono flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Hourglass className="w-3 h-3 text-amber-400" />
                      <span className="text-emerald-400 font-bold">🎯 هدف 1: ~{duration.tp1Text}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-teal-300 font-bold">🏁 انتهاء: ~{duration.tp2Text}</span>
                    </div>
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${duration.speedBadgeColor}`}>
                      {duration.speedCategoryArabic}
                    </span>
                  </div>
                );
              })()}

              {/* State Pill & Setup Type */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${stateColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {stateText}
                </span>
                {setup.setupType && setup.setupType !== 'None' && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {setup.setupType}
                  </span>
                )}
                {evalData?.entryStatus === 'PERFECT_ZONE' && (
                  <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1 py-0.5 rounded border border-emerald-800">
                    نطاق مثالي 🎯
                  </span>
                )}
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
                  <div className="text-neutral-500">RSI</div>
                  <div className="text-neutral-200 font-bold">{ind.rsi.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-neutral-500">MFI</div>
                  <div className={ind.mfi > 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {ind.mfi.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">MTF</div>
                  <div className="text-cyan-400 font-bold">{setup.mtf.alignmentFraction}</div>
                </div>
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
        })
      )}

      {/* Strict Settings Modal */}
      <StrictSettingsModal
        isOpen={isStrictModalOpen}
        onClose={() => setIsStrictModalOpen(false)}
        settings={strictSettings}
        onSave={handleUpdateStrictSettings}
        qualifiedCount={qualifiedSetups.length}
        totalCount={setups.length}
      />

      {/* Trade Duration & ETA Table Modal */}
      <TradeDurationModal
        isOpen={isDurationModalOpen}
        onClose={() => setIsDurationModalOpen(false)}
        setups={setups}
        onSelectSetup={onSelectSetup}
      />
    </div>
  );
};
