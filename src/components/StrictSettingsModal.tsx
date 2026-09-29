import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  Percent,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sliders,
  Sparkles,
  Target,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { StrictFilterSettings } from '../types/crypto.ts';
import { DEFAULT_STRICT_SETTINGS, STRICT_PRESETS } from '../utils/strictFilter.ts';

interface StrictSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StrictFilterSettings;
  onSave: (settings: StrictFilterSettings) => void;
  qualifiedCount: number;
  totalCount: number;
}

export const StrictSettingsModal: React.FC<StrictSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  qualifiedCount,
  totalCount,
}) => {
  const [form, setForm] = useState<StrictFilterSettings>({ ...settings });

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: 'elite' | 'sniper' | 'explosive') => {
    const p = STRICT_PRESETS[presetKey];
    setForm(prev => ({
      ...prev,
      preset: presetKey,
      ...p,
    }));
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_STRICT_SETTINGS });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/40 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  معايير وإعدادات الدخول الصارم (Strict Entry Rules)
                </h3>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold rounded-full">
                  {qualifiedCount} / {totalCount} صفقة مؤهلة
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                تصفية الصفقات وفق شروط ربحية ورياضية صارمة لضمان أعلى نسبة نجاح وحماية رأس المال
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-neutral-200">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              القوالب الجاهزة الموصى بها (Strict Presets)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('elite')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  form.preset === 'elite'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-400">🎯 النخبة الصارم</span>
                  {form.preset === 'elite' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  سكور 75+ | R:R 2.0x | ربح 1.5% - 2.5% | توازن مثالي بين الدقة والفرص
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('sniper')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  form.preset === 'sniper'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm shadow-cyan-900/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-400">💎 قناص الأرباح</span>
                  {form.preset === 'sniper' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  سكور 82+ | R:R 2.5x | ربح 2.0% - 3.2% | أقصى درجات الانتقائية لصفقات القمة
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('explosive')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  form.preset === 'explosive'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm shadow-purple-900/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-400">🚀 عائد مضاعف</span>
                  {form.preset === 'explosive' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  ربح هدف ثانٍ 4.5%+ | R:R 2.4x | صفقات المومنتوم والانفجار السعري
                </p>
              </button>
            </div>
          </div>

          {/* Direction Filter */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
            <label className="block text-[11px] font-bold text-neutral-400 mb-2">
              نوع الصفقات المسموح بظهورها:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'ALL', preset: 'custom' })}
                className={`py-1.5 px-3 rounded-lg border font-mono font-bold text-center transition-colors cursor-pointer ${
                  form.direction === 'ALL'
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                الكل (Long + Short)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'LONG_ONLY', preset: 'custom' })}
                className={`py-1.5 px-3 rounded-lg border font-mono font-bold text-center transition-colors cursor-pointer ${
                  form.direction === 'LONG_ONLY'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                🟢 صفقات شراء فقط (Long)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'SHORT_ONLY', preset: 'custom' })}
                className={`py-1.5 px-3 rounded-lg border font-mono font-bold text-center transition-colors cursor-pointer ${
                  form.direction === 'SHORT_ONLY'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                🔴 صفقات بيع فقط (Short)
              </button>
            </div>
          </div>

          {/* Anti-Pump & Liquidity Controls (User Request: نسبة الارتفاع لا تزيد عن 5% + تحديد السيولة) */}
          <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 space-y-4 shadow-md shadow-emerald-950/20">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    حماية عدم الدخول بعد الارتفاع (Anti-Pump) وتحديد السيولة
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    ضوابط صارمة تمنع الشراء في القمة بعد انتهاء الصعود، مع تصفية العملات ذات السيولة الكافية
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/80 rounded-full font-mono text-[10px] font-bold">
                أمان عالي 🛡️
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Max 24h Pump Cap */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    أقصى نسبة ارتفاع مسموحة:
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    ≤ +{form.max24hChangePercent.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={form.max24hChangePercent}
                  onChange={e =>
                    setForm({ ...form, max24hChangePercent: Number(e.target.value), preset: 'custom' })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {[3.0, 5.0, 7.0, 10.0].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, max24hChangePercent: val, preset: 'custom' })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                        form.max24hChangePercent === val
                          ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {val === 5.0 ? '5% (موصى به ⭐)' : `${val}%`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal pt-1">
                  ⚠️ لن تظهر أي عملة صاعدة بأكثر من {form.max24hChangePercent}% لضمان الدخول في بداية الحركة وعدم الشراء بعد الارتفاع.
                </p>
              </div>

              {/* Min Liquidity / Volume */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-cyan-400" />
                    الحد الأدنى لسيولة التداول (24h Volume):
                  </span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    ≥ ${(form.min24hVolumeUsd / 1_000_000).toFixed(0)}M
                  </span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="100000000"
                  step="2000000"
                  value={form.min24hVolumeUsd}
                  onChange={e =>
                    setForm({ ...form, min24hVolumeUsd: Number(e.target.value), preset: 'custom' })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {[
                    { label: '$5M', val: 5_000_000 },
                    { label: '$10M (موصى به)', val: 10_000_000 },
                    { label: '$25M', val: 25_000_000 },
                    { label: '$50M', val: 5_000_000 * 10 },
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, min24hVolumeUsd: item.val, preset: 'custom' })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                        form.min24hVolumeUsd === item.val
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal pt-1">
                  💧 يستبعد العملات الضعيفة وغير النشطة لضمان تنفيذ سريع وسلس بدون انزلاق سعري.
                </p>
              </div>
            </div>
          </div>

          {/* Numeric Thresholds Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Min Score */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  الحد الأدنى للسكور (Score):
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{form.minScore} / 100</span>
              </div>
              <input
                type="range"
                min="65"
                max="95"
                step="1"
                value={form.minScore}
                onChange={e => setForm({ ...form, minScore: Number(e.target.value), preset: 'custom' })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500">
                يضمن عدم إدخالك إلا في عملات ذات جودة فنية وسيولة قوية.
              </p>
            </div>

            {/* Min Risk Reward */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  نسبة العائد للمخاطرة (R:R):
                </span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{form.minRiskReward.toFixed(1)}:1 R:R</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="3.5"
                step="0.1"
                value={form.minRiskReward}
                onChange={e => setForm({ ...form, minRiskReward: Number(e.target.value), preset: 'custom' })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500">
                الربح المحتمل للهدف مقارنة بمقدار وقف الخسارة.
              </p>
            </div>

            {/* Min Profit TP1 */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  أقل ربح مستهدف للهدف الأول (TP1):
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">+{form.minTp1ProfitPercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.1"
                value={form.minTp1ProfitPercent}
                onChange={e => setForm({ ...form, minTp1ProfitPercent: Number(e.target.value), preset: 'custom' })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500">
                الربح الصافي المباشر عند أول مستوى جني أرباح.
              </p>
            </div>

            {/* Min Profit TP2 */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  أقل ربح مستهدف للهدف الثاني (TP2):
                </span>
                <span className="font-mono font-bold text-purple-400 text-sm">+{form.minTp2ProfitPercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="8.0"
                step="0.2"
                value={form.minTp2ProfitPercent}
                onChange={e => setForm({ ...form, minTp2ProfitPercent: Number(e.target.value), preset: 'custom' })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500">
                الربح الكلي المستهدف عند تفريغ باقي عقد الصفقة.
              </p>
            </div>
          </div>

          {/* Strict Binary Safeguards */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              شروط الأمان والانضباط الصارم (Disciplined Execution Safeguards)
            </h4>

            {/* Require Confirmed */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.requireConfirmedState}
                onChange={e => setForm({ ...form, requireConfirmedState: e.target.checked, preset: 'custom' })}
                className="mt-0.5 accent-emerald-500 rounded cursor-pointer"
              />
              <div>
                <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">
                  اشتراط إشارة مؤكدة فقط (استبعاد إشارات الانتظار Waiting)
                </span>
                <p className="text-[10px] text-neutral-400">
                  لا يعرض إلا العملات التي اكتملت فيها الشروط وتأكد اتجاهها تماماً (Confirmed Long / Short).
                </p>
              </div>
            </label>

            {/* Require Inside Entry Zone */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.requireInsideEntryZone}
                onChange={e => setForm({ ...form, requireInsideEntryZone: e.target.checked, preset: 'custom' })}
                className="mt-0.5 accent-emerald-500 rounded cursor-pointer"
              />
              <div>
                <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">
                  اشتراط التواجد داخل أو قرب منطقة الدخول (منع ملاحقة الشموع No FOMO)
                </span>
                <p className="text-[10px] text-neutral-400">
                  يستبعد أي عملة تحركت بالفعل وابتعدت عن سعر الدخول لتجنب الدخول المتأخر أو الشراء في القمة.
                </p>
              </div>
            </label>

            {/* Require Positive Whale Flow */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.requirePositiveFlow}
                onChange={e => setForm({ ...form, requirePositiveFlow: e.target.checked, preset: 'custom' })}
                className="mt-0.5 accent-emerald-500 rounded cursor-pointer"
              />
              <div>
                <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">
                  اشتراط توافق سيولة الحيتان وزخم تدفق الأموال (Whale Confluence)
                </span>
                <p className="text-[10px] text-neutral-400">
                  التأكد من أن كبار المتداولين ومؤشر MFI يدعمون اتجاه الصفقة قبل صدور أمر الدخول.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800 bg-neutral-950">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg text-neutral-400 hover:text-white font-mono text-xs cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>استعادة الافتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>تطبيق شروط الدخول الصارم 🎯</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
