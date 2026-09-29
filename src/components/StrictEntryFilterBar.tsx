import React from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Flame,
  Hourglass,
  Percent,
  Scale,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { StrictFilterSettings, TradingSetup } from '../types/crypto.ts';
import { STRICT_PRESETS } from '../utils/strictFilter.ts';

interface StrictEntryFilterBarProps {
  settings: StrictFilterSettings;
  onChangeSettings: (newSettings: StrictFilterSettings) => void;
  onOpenSettingsModal: () => void;
  onOpenDurationModal?: () => void;
  qualifiedSetups: TradingSetup[];
  totalSetupsCount: number;
  onSelectSetup?: (setup: TradingSetup) => void;
}

export const StrictEntryFilterBar: React.FC<StrictEntryFilterBarProps> = ({
  settings,
  onChangeSettings,
  onOpenSettingsModal,
  onOpenDurationModal,
  qualifiedSetups,
  totalSetupsCount,
  onSelectSetup,
}) => {
  const isEnabled = settings.enabled;

  // Compute live averages of qualified setups
  let avgProfitTP1 = 0;
  let avgProfitTP2 = 0;
  let avgRR = 0;

  if (qualifiedSetups.length > 0) {
    let sumTP1 = 0;
    let sumTP2 = 0;
    let sumRR = 0;

    for (const s of qualifiedSetups) {
      const isLong = s.state === 'CONFIRMED_LONG';
      const entry = s.entry || s.price;
      const tp1Gain = isLong ? ((s.tp1 - entry) / entry) * 100 : ((entry - s.tp1) / entry) * 100;
      const tp2Gain = isLong ? ((s.tp2 - entry) / entry) * 100 : ((entry - s.tp2) / entry) * 100;
      const slRisk = isLong ? ((entry - s.sl) / entry) * 100 : ((s.sl - entry) / entry) * 100;

      sumTP1 += Math.max(0, tp1Gain);
      sumTP2 += Math.max(0, tp2Gain);
      sumRR += slRisk > 0 ? tp2Gain / slRisk : s.riskRewardRatio || 2.0;
    }

    avgProfitTP1 = sumTP1 / qualifiedSetups.length;
    avgProfitTP2 = sumTP2 / qualifiedSetups.length;
    avgRR = sumRR / qualifiedSetups.length;
  }

  // Top recommendation setup
  const topPick = qualifiedSetups.length > 0
    ? [...qualifiedSetups].sort((a, b) => b.score - a.score)[0]
    : null;

  const handleToggle = () => {
    onChangeSettings({
      ...settings,
      enabled: !isEnabled,
    });
  };

  const handlePresetChange = (preset: 'elite' | 'sniper' | 'explosive') => {
    const p = STRICT_PRESETS[preset];
    onChangeSettings({
      ...settings,
      enabled: true,
      preset,
      ...p,
    });
  };

  return (
    <div
      className={`relative mb-4 rounded-2xl border transition-all overflow-hidden ${
        isEnabled
          ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900/90 to-teal-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
          : 'bg-neutral-900/80 border-neutral-800'
      }`}
    >
      {/* Top Banner Bar */}
      <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left Side: Toggle, Title, Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isEnabled
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 shadow-emerald-950/50 font-black'
                : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
            }`}
          >
            <Target className={`w-4 h-4 ${isEnabled ? 'text-black animate-pulse' : 'text-neutral-400'}`} />
            <span>فلتر صفقات الدخول الصارم (Strict Entry)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                isEnabled
                  ? 'bg-black/25 text-neutral-950 font-black'
                  : 'bg-neutral-700 text-neutral-300'
              }`}
            >
              {isEnabled ? 'مفعل 🟢' : 'معطل ⚪'}
            </span>
          </button>

          {/* Qualified Count Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs font-mono">
            <span className="text-neutral-400">الفرص الصارمة المتاحة:</span>
            <span
              className={`font-bold ${
                qualifiedSetups.length > 0 ? 'text-emerald-400 text-sm' : 'text-amber-400'
              }`}
            >
              {qualifiedSetups.length}
            </span>
            <span className="text-neutral-500">من أصل {totalSetupsCount}</span>
          </div>

          {/* Top Pick Quick Trigger */}
          {isEnabled && topPick && (
            <button
              type="button"
              onClick={() => onSelectSetup && onSelectSetup(topPick)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs font-mono text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>أقوى صفقة مؤكدة الآن:</span>
              <span className="font-bold text-white underline underline-offset-2">{topPick.symbol}</span>
              <span className="text-emerald-400 font-bold">({topPick.score} سكور)</span>
            </button>
          )}
        </div>

        {/* Right Side: Quick Presets & Customize Settings Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          <div className="flex items-center gap-1 bg-neutral-950/70 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => handlePresetChange('elite')}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors cursor-pointer text-xs ${
                settings.preset === 'elite' && isEnabled
                  ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="سكور 75+ | R:R 2.0x | ربح 1.5% - 2.5%"
            >
              🎯 النخبة الصارم
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('sniper')}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors cursor-pointer text-xs ${
                settings.preset === 'sniper' && isEnabled
                  ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="سكور 82+ | R:R 2.5x | ربح 2.0% - 3.2%"
            >
              💎 قناص الأرباح
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('explosive')}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors cursor-pointer text-xs ${
                settings.preset === 'explosive' && isEnabled
                  ? 'bg-purple-900/80 text-purple-300 border border-purple-700/80 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="ربح هدف ثانٍ 4.5%+ | صفقات انفجار سعري"
            >
              🚀 عائد مضاعف
            </button>
          </div>

          {/* Trade Duration Table Modal Button */}
          {onOpenDurationModal && (
            <button
              type="button"
              onClick={onOpenDurationModal}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-950/80 to-amber-900/60 hover:from-amber-900/80 hover:to-amber-800/70 border border-amber-600/70 rounded-xl text-xs font-mono font-bold text-amber-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-amber-950/40"
              title="عرض جدول كل عملة والمدة التقريبية بالساعات للوصول للأهداف والانتهاء"
            >
              <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>⏱️ جدول مدد الصفقات والانتهاء</span>
            </button>
          )}

          {/* Customize Rules Button */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl text-xs font-mono font-semibold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚙️ تعديل معايير الصرامة</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Real-time Stats & Active Criteria Summary */}
      {isEnabled && (
        <div className="px-4 py-2 bg-neutral-950/70 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-neutral-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>متوسط ربح الهدف الأول:</span>
              <span className="font-bold text-emerald-400">+{avgProfitTP1.toFixed(1)}%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>متوسط ربح الهدف الثاني:</span>
              <span className="font-bold text-teal-300">+{avgProfitTP2.toFixed(1)}%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>متوسط نسبة العائد للمخاطرة:</span>
              <span className="font-bold text-cyan-300">{avgRR.toFixed(1)}:1 R:R</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="px-2 py-0.5 bg-amber-950/90 border border-amber-700 text-amber-300 rounded font-semibold flex items-center gap-1">
              <span>🚀 أقصى ارتفاع: ≤ {settings.max24hChangePercent}%</span>
            </span>
            <span className="px-2 py-0.5 bg-cyan-950/90 border border-cyan-700 text-cyan-300 rounded font-semibold flex items-center gap-1">
              <span>💧 سيولة: ≥ ${(settings.min24hVolumeUsd / 1_000_000).toFixed(0)}M</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded font-semibold">
              سكور {settings.minScore}+
            </span>
            <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded font-semibold">
              R:R {settings.minRiskReward.toFixed(1)}+
            </span>
            <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-800 text-purple-300 rounded font-semibold">
              ربح TP1 {settings.minTp1ProfitPercent}%+
            </span>
            {settings.requireInsideEntryZone && (
              <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded">
                داخل منطقة الدخول ✅
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
