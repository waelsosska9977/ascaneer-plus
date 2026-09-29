import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Layers,
  LineChart,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';

interface StockTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  setups: TradingSetup[];
  stockTokens: string[];
  onSelectSetup: (setup: TradingSetup) => void;
  onRefreshSetups?: () => void;
}

export const StockTokensModal: React.FC<StockTokensModalProps> = ({
  isOpen,
  onClose,
  setups,
  stockTokens,
  onSelectSetup,
  onRefreshSetups,
}) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter current setups to match premarket and P tokens
  const stockSetups = setups.filter(
    s =>
      s.isPToken ||
      s.category === 'PREMARKET_P' ||
      s.symbol.endsWith('USDTP') ||
      s.symbol.endsWith('P') ||
      s.symbol.includes('SNDK') ||
      s.symbol.includes('NSDK') ||
      stockTokens.some(st => st.toUpperCase() === s.symbol.toUpperCase())
  );

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSymbol.trim().toUpperCase();
    if (!clean) return;

    setIsAdding(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/symbols/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: clean, isStock: true }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ تمت إضافة ${clean} وفحص التوصية بنجاح!`);
        setNewSymbol('');
        if (onRefreshSetups) onRefreshSetups();
      } else {
        setActionMessage(`❌ فشلت الإضافة: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch {
      setActionMessage('❌ حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsAdding(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    try {
      const res = await fetch('/api/symbols/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🗑️ تم حذف ${symbol} من قائمة المتابعة.`);
        if (onRefreshSetups) onRefreshSetups();
      }
    } catch {
      setActionMessage('❌ فشل حذف الرمز.');
    } finally {
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLoadPreset = async (preset: 'stock' | 'new_listings') => {
    setLoadingPreset(preset);
    try {
      const res = await fetch('/api/symbols/stock-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(
          preset === 'stock'
            ? '✅ تم تحميل حزمة توكنات ما قبل التداول P (SNDKP, NSDK, SPX...) بنجاح!'
            : '✅ تم تحميل حزمة الإدراجات الجديدة في بينانس بنجاح!'
        );
        if (onRefreshSetups) onRefreshSetups();
      }
    } catch {
      setActionMessage('❌ فشل تحميل الحزمة.');
    } finally {
      setLoadingPreset(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-xl border border-cyan-500/30 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  إدارة وفحص توكنات ما قبل التداول وعقود P (Binance Pre-Market & P-Tokens)
                </h3>
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded-full text-[10px] font-mono font-semibold">
                  {stockSetups.length} توكن P نشط
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                Binance Pre-Market & Synthetic P-Tokens (SNDKP, NSDKUSDTP, SPXUSDTP, SCRUSDTP...)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Add Symbol + Preset Buttons */}
        <div className="p-4 sm:p-5 bg-neutral-900/30 border-b border-neutral-800 space-y-3">
          {/* Add form */}
          <form onSubmit={handleAddSymbol} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                placeholder="أدخل رمز توكن P أو عقد ما قبل التداول (مثال: SNDKP أو NSDKUSDTP أو SPXUSDTP)..."
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 font-mono uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newSymbol.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-cyan-950/40"
            >
              {isAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>إضافة وفحص فوري ⚡</span>
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-mono">حزم سريعة:</span>
              <button
                onClick={() => handleLoadPreset('stock')}
                disabled={loadingPreset !== null}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 rounded-lg text-cyan-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingPreset === 'stock' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-cyan-400" />}
                <span>حزمة توكنات ما قبل التداول وعقود P (SNDKP, NSDK, SPX...)</span>
              </button>
              <button
                onClick={() => handleLoadPreset('new_listings')}
                disabled={loadingPreset !== null}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 rounded-lg text-purple-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingPreset === 'new_listings' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Flame className="w-3 h-3 text-purple-400" />}
                <span>حزمة الإدراجات الجديدة (PENGU, MOVE, THE...)</span>
              </button>
            </div>

            {actionMessage && (
              <div className="text-xs font-mono font-semibold px-2.5 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded-lg animate-fadeIn">
                {actionMessage}
              </div>
            )}
          </div>
        </div>

        {/* Stock Tokens Grid / Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {stockSetups.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 font-mono space-y-3">
              <Layers className="w-12 h-12 mx-auto text-neutral-700 opacity-60" />
              <p className="text-sm">لا توجد توكنات ما قبل التداول مضافة حالياً.</p>
              <p className="text-xs text-neutral-600">
                اضغط على زر &quot;حزمة توكنات ما قبل التداول P&quot; أعلاه لإدراج عملات مثل SNDKP و NSDKUSDTP وفحصها فورياً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {stockSetups.map(setup => {
                const isLong = setup.state === 'CONFIRMED_LONG';
                const isShort = setup.state === 'CONFIRMED_SHORT';

                return (
                  <div
                    key={setup.symbol}
                    className="p-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex flex-col justify-between gap-3 shadow-md"
                  >
                    {/* Card Header: Symbol, Price, Category & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-base">
                            {setup.symbol}
                          </span>
                          <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/80 rounded text-[10px] font-mono font-bold">
                            ⚡ P-TOKEN
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isLong
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isShort
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {isLong ? '🟢 صعود مؤكد' : isShort ? '🔴 هبوط مؤكد' : '🟡 في الانتظار'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs font-mono text-neutral-400">
                          <span className="text-white font-bold">${formatPrice(setup.price)}</span>
                          <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {setup.change24h >= 0 ? `+${setup.change24h.toFixed(2)}%` : `${setup.change24h.toFixed(2)}%`}
                          </span>
                          <span>•</span>
                          <span className="text-neutral-500">{setup.setupType}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono">
                          <div className="text-[10px] text-neutral-500">Score</div>
                          <div
                            className={`text-xs font-bold ${
                              setup.score >= 80 ? 'text-emerald-400' : setup.score >= 68 ? 'text-cyan-400' : 'text-neutral-300'
                            }`}
                          >
                            {setup.score}/100
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSymbol(setup.symbol)}
                          title="حذف من قائمة المتابعة"
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Entry Zone & Targets Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-lg">
                      <div>
                        <div className="text-[10px] text-neutral-500">نطاق الدخول</div>
                        <div className="text-neutral-200 font-bold truncate">
                          {setup.entryZone
                            ? `$${formatPrice(setup.entryZone.min)} - $${formatPrice(setup.entryZone.max)}`
                            : `$${formatPrice(setup.entry)}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500">وقف الخسارة (SL)</div>
                        <div className="text-rose-400 font-bold truncate">
                          ${formatPrice(setup.sl)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500">الهدف 1 (TP1)</div>
                        <div className="text-emerald-400 font-bold truncate">
                          ${formatPrice(setup.tp1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500">الهدف 2 (TP2)</div>
                        <div className="text-emerald-500 font-bold truncate">
                          ${formatPrice(setup.tp2)}
                        </div>
                      </div>
                    </div>

                    {/* Execution Tip */}
                    {setup.executionTip && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-800/40 p-2 rounded-lg leading-relaxed font-sans">
                        {setup.executionTip}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-neutral-500 font-mono">
                        العائد للمخاطرة (R:R):{' '}
                        <span className="text-emerald-400 font-bold">1:{setup.riskRewardRatio}</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectSetup(setup);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فتح الشارت والتفاصيل</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>تحديث وفحص آلي مستمر كل 30 ثانية لكل التوكنات المضافة</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
