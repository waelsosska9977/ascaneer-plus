import React, { useState } from 'react';
import { ArrowUpDown, ChevronRight, Eye, Filter, Info, RefreshCw, Search, Waves, Zap } from 'lucide-react';
import { TradingSetup } from '../types/crypto.ts';

interface CryptoTableProps {
  setups: TradingSetup[];
  onSelectSetup: (setup: TradingSetup) => void;
  onOpenScoreModal: (setup: TradingSetup) => void;
  onOpenStockTokensModal?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type FilterType = 'all' | 'long' | 'short' | 'wait' | 'whale' | 'stock' | 'new';
type SortField = 'score' | 'volume' | 'change' | 'rsi' | 'volChange' | 'mtf';

export const CryptoTable: React.FC<CryptoTableProps> = ({
  setups,
  onSelectSetup,
  onOpenScoreModal,
  onOpenStockTokensModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  // Filter items
  const filtered = setups.filter(s => {
    if (search) {
      const q = search.trim().toUpperCase();
      if (!s.symbol.includes(q)) return false;
    }
    if (filter === 'long') return s.state === 'CONFIRMED_LONG';
    if (filter === 'short') return s.state === 'CONFIRMED_SHORT';
    if (filter === 'wait') return s.state === 'WAIT_FOR_CONFIRMATION';
    if (filter === 'whale') return s.setupType === 'Whale Resilience' || s.indicators.mfi > 60;
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
    if (filter === 'new') return s.category === 'NEW_LISTING';
    return true;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'score') diff = b.score - a.score;
    else if (sortField === 'volume') diff = b.quoteVolume24h - a.quoteVolume24h;
    else if (sortField === 'change') diff = b.change24h - a.change24h;
    else if (sortField === 'rsi') diff = b.indicators.rsi - a.indicators.rsi;
    else if (sortField === 'volChange') diff = b.indicators.volumeChangePercent - a.indicators.volumeChangePercent;
    else if (sortField === 'mtf') diff = b.mtf.alignedCount - a.mtf.alignedCount;
    return sortAsc ? -diff : diff;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

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

  const newListingCount = setups.filter(s => s.category === 'NEW_LISTING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Controls Bar: Filters, Search, Counts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Pairs ({setups.length})
          </button>
          <button
            onClick={() => setFilter('stock')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'stock' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            ⚡ توكنات P & Pre-Market ({stockCount})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'new' ? 'bg-purple-950 text-purple-300 border border-purple-800/80 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🆕 إدراجات جديدة ({newListingCount})
          </button>
          <button
            onClick={() => setFilter('long')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'long' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🟢 Long ({setups.filter(s => s.state === 'CONFIRMED_LONG').length})
          </button>
          <button
            onClick={() => setFilter('short')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'short' ? 'bg-rose-950 text-rose-300 border border-rose-800/80' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🔴 Short ({setups.filter(s => s.state === 'CONFIRMED_SHORT').length})
          </button>
          <button
            onClick={() => setFilter('wait')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'wait' ? 'bg-amber-950 text-amber-300 border border-amber-800/80' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🟡 Waiting ({setups.filter(s => s.state === 'WAIT_FOR_CONFIRMATION').length})
          </button>
          <button
            onClick={() => setFilter('whale')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'whale' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/80' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🐳 Whale Flow ({setups.filter(s => s.setupType === 'Whale Resilience' || s.indicators.mfi > 60).length})
          </button>
        </div>

        {/* Search, Refresh & Sort Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenStockTokensModal && (
            <button
              onClick={onOpenStockTokensModal}
              title="إدارة وفحص توكنات ما قبل التداول وعقود P (مثل SNDKP و NSDKUSDTP)"
              className="px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 rounded-lg text-xs font-mono text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>توكنات P / Pre-Market ⚡</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="تحديث يدوي وفحص فوري للجدول الآن"
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'جاري الفحص...' : 'تحديث يدوي ⚡'}</span>
            </button>
          )}

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search symbol (BTC, SOL...)"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 font-mono">
            <span>Sort by:</span>
            <button
              onClick={() => toggleSort('score')}
              className={`px-2 py-1 rounded cursor-pointer ${sortField === 'score' ? 'text-emerald-400 font-bold' : 'hover:text-white'}`}
            >
              Score
            </button>
            <button
              onClick={() => toggleSort('volume')}
              className={`px-2 py-1 rounded cursor-pointer ${sortField === 'volume' ? 'text-emerald-400 font-bold' : 'hover:text-white'}`}
            >
              Volume
            </button>
            <button
              onClick={() => toggleSort('volChange')}
              className={`px-2 py-1 rounded cursor-pointer ${sortField === 'volChange' ? 'text-emerald-400 font-bold' : 'hover:text-white'}`}
            >
              Vol %
            </button>
          </div>
        </div>
      </div>

      {/* Main High-Density Terminal Table */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-lg overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                <th className="py-2.5 px-3 font-semibold">Symbol</th>
                <th className="py-2.5 px-3 font-semibold">Price</th>
                <th className="py-2.5 px-3 font-semibold">24H %</th>
                <th className="py-2.5 px-3 font-semibold">Volume</th>
                <th className="py-2.5 px-3 font-semibold">Trend</th>
                <th className="py-2.5 px-3 font-semibold">EMA 9</th>
                <th className="py-2.5 px-3 font-semibold">EMA 21</th>
                <th className="py-2.5 px-3 font-semibold">EMA 200</th>
                <th className="py-2.5 px-3 font-semibold">VWAP</th>
                <th className="py-2.5 px-3 font-semibold">RSI (14)</th>
                <th className="py-2.5 px-3 font-semibold">MFI (14)</th>
                <th className="py-2.5 px-3 font-semibold">Stoch (K/D)</th>
                <th className="py-2.5 px-3 font-semibold">Vol Change</th>
                <th className="py-2.5 px-3 font-semibold">MTF</th>
                <th
                  onClick={() => toggleSort('score')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold">Setup State</th>
                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 font-mono text-neutral-300 text-xs">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-neutral-500 font-sans">
                    No cryptocurrency pairs matched your search or filter criteria.
                  </td>
                </tr>
              ) : (
                sorted.map(setup => {
                  const ind = setup.indicators;
                  const isLong = setup.state === 'CONFIRMED_LONG';
                  const isShort = setup.state === 'CONFIRMED_SHORT';
                  const isWait = setup.state === 'WAIT_FOR_CONFIRMATION';

                  const stateColor = isLong
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
                    : isShort
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800/80'
                    : isWait
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800/80'
                    : 'text-neutral-400 bg-neutral-900 border-neutral-800';

                  const stateText = isLong
                    ? 'CONFIRMED LONG'
                    : isShort
                    ? 'CONFIRMED SHORT'
                    : isWait
                    ? 'WAIT FOR CONFIRMATION'
                    : 'NO SETUP';

                  // RSI Interpretation
                  let rsiDesc = 'Neutral';
                  let rsiColor = 'text-neutral-300';
                  if (ind.rsi < 30) {
                    rsiDesc = 'Oversold';
                    rsiColor = 'text-amber-400';
                  } else if (ind.rsi < 45) {
                    rsiDesc = 'Weak/Recov';
                    rsiColor = 'text-neutral-400';
                  } else if (ind.rsi <= 55) {
                    rsiDesc = 'Neutral';
                    rsiColor = 'text-neutral-300';
                  } else if (ind.rsi <= 70) {
                    rsiDesc = 'Strong';
                    rsiColor = 'text-emerald-400';
                  } else {
                    rsiDesc = 'Overbought';
                    rsiColor = 'text-rose-400';
                  }

                  // MTF color
                  const mtfColor = setup.mtf.alignedCount >= 3 ? 'text-emerald-400' : 'text-amber-400';

                  return (
                    <tr
                      key={setup.symbol}
                      className="hover:bg-neutral-900/50 transition-colors group"
                    >
                      {/* Symbol */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-emerald-400 transition-colors">
                          <span>{setup.symbol}</span>
                          {(setup.isPToken || setup.category === 'PREMARKET_P' || setup.symbol.endsWith('USDTP') || setup.symbol.endsWith('P') || setup.symbol.includes('SNDK') || setup.symbol.includes('NSDK')) && (
                            <span className="px-1.5 py-0.5 bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 rounded text-[9px] font-mono tracking-tight" title="توكن ما قبل التداول وعقود P">
                              P-TOKEN
                            </span>
                          )}
                          {setup.category === 'NEW_LISTING' && (
                            <span className="px-1.5 py-0.5 bg-purple-950/90 text-purple-300 border border-purple-800/80 rounded text-[9px] font-mono tracking-tight" title="إدراج توكن جديد في بينانس">
                              NEW
                            </span>
                          )}
                          {setup.setupType === 'Whale Resilience' && (
                            <span title="Whale Resilience Setup Detected">
                              <Waves className="w-3 h-3 text-cyan-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price & Entry Zone */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-white font-medium">${formatPrice(setup.price)}</div>
                        {setup.entryZone && (
                          <div className="text-[10px] text-sky-400/90 font-mono" title="منطقة الدخول المثالية">
                            Zone: ${formatPrice(setup.entryZone.min)}
                          </div>
                        )}
                      </td>

                      {/* 24h % */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-400">
                        {formatVolume(setup.quoteVolume24h)}
                      </td>

                      {/* Trend */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={ind.emaTrend === 'bullish' ? 'text-emerald-400' : ind.emaTrend === 'bearish' ? 'text-rose-400' : 'text-neutral-400'}>
                          {ind.emaTrend === 'bullish' ? 'Bullish' : ind.emaTrend === 'bearish' ? 'Bearish' : 'Neutral'}
                        </span>
                      </td>

                      {/* EMA 9 */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className="text-neutral-300">${formatPrice(ind.ema9)}</span>{' '}
                        <span className={ind.ema9 > ind.ema21 ? 'text-emerald-400' : 'text-rose-400'}>
                          {ind.ema9 > ind.ema21 ? '🟢' : '🔴'}
                        </span>
                      </td>

                      {/* EMA 21 */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className="text-neutral-300">${formatPrice(ind.ema21)}</span>{' '}
                        <span className={setup.price > ind.ema21 ? 'text-emerald-400' : 'text-rose-400'}>
                          {setup.price > ind.ema21 ? '🟢' : '🔴'}
                        </span>
                      </td>

                      {/* EMA 200 */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className="text-neutral-300">${formatPrice(ind.ema200)}</span>{' '}
                        <span className={setup.price > ind.ema200 ? 'text-emerald-400' : 'text-rose-400'}>
                          {setup.price > ind.ema200 ? '🟢' : '🔴'}
                        </span>
                      </td>

                      {/* VWAP */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className="text-neutral-300">${formatPrice(ind.vwap)}</span>{' '}
                        <span className={ind.priceVsVwap === 'above' ? 'text-emerald-400' : 'text-rose-400'}>
                          {ind.priceVsVwap === 'above' ? '🟢 Above' : '🔴 Below'}
                        </span>
                      </td>

                      {/* RSI */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className={rsiColor}>{ind.rsi.toFixed(1)}</span>{' '}
                        <span className="text-[10px] text-neutral-500 font-sans">({rsiDesc})</span>
                      </td>

                      {/* MFI */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className={ind.mfi > 50 ? 'text-emerald-400' : 'text-rose-400'}>
                          {ind.mfi.toFixed(1)}
                        </span>{' '}
                        <span className="text-[10px] text-neutral-500 font-sans">
                          {ind.mfi > 50 ? 'Pos Flow' : 'Neg Flow'}
                        </span>
                      </td>

                      {/* Stoch */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-neutral-300">
                        {ind.stochK.toFixed(0)}/{ind.stochD.toFixed(0)}
                      </td>

                      {/* Volume Change */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <span className={ind.volumeChangePercent >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                          {ind.volumeChangePercent >= 0 ? '+' : ''}{ind.volumeChangePercent.toFixed(1)}%
                        </span>{' '}
                        <span className="text-[10px] text-neutral-500 font-sans">
                          {ind.volumeChangePercent >= 0 ? 'Expansion 🟢' : 'Weak 🔴'}
                        </span>
                      </td>

                      {/* MTF */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${mtfColor}`}>{setup.mtf.alignmentFraction}</span>
                          <span className="text-[10px] text-neutral-500">
                            {setup.mtf.tf5m.trend === 'bullish' ? '🟢' : '🔴'}
                            {setup.mtf.tf15m.trend === 'bullish' ? '🟢' : '🔴'}
                            {setup.mtf.tf1h.trend === 'bullish' ? '🟢' : '🔴'}
                            {setup.mtf.tf4h.trend === 'bullish' ? '🟢' : '🔴'}
                          </span>
                        </div>
                      </td>

                      {/* Score (Clickable) */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenScoreModal(setup);
                          }}
                          title="Click to view Score Breakdown"
                          className="font-bold text-emerald-400 hover:text-emerald-300 underline decoration-dotted underline-offset-2 cursor-pointer"
                        >
                          {setup.score}
                          <span className="text-[10px] text-neutral-500 font-normal">/100</span>
                        </button>
                      </td>

                      {/* Setup State */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${stateColor}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {stateText}
                          </span>
                          {setup.setupType && setup.setupType !== 'None' && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {setup.setupType === 'Early Breakout' ? '⚡ Early Breakout' : setup.setupType === 'Pullback Retest' ? '🔄 Pullback Retest' : setup.setupType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => onSelectSetup(setup)}
                          className="px-2.5 py-1 text-[11px] font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Analyze</span>
                        </button>
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
