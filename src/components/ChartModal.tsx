import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Flame,
  HelpCircle,
  ShieldAlert,
  Target,
  Waves,
  X,
} from 'lucide-react';
import { Candle, TradingSetup } from '../types/crypto.ts';
import { CandlestickChart } from './CandlestickChart.tsx';

interface ChartModalProps {
  setup: TradingSetup | null;
  onClose: () => void;
  onOpenRiskCalc: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  setup,
  onClose,
  onOpenRiskCalc,
}) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartInterval, setChartInterval] = useState<'5m' | '15m' | '1h' | '4h'>('1h');
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);

  useEffect(() => {
    if (!setup) return;

    let isMounted = true;
    setIsLoadingCandles(true);

    fetch(`/api/klines?symbol=${setup.symbol}&interval=${chartInterval}&limit=70`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setCandles(data);
        }
      })
      .catch(err => console.error('Error fetching candles:', err))
      .finally(() => {
        if (isMounted) setIsLoadingCandles(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setup, chartInterval]);

  if (!setup) return null;

  const ind = setup.indicators;
  const isLong = setup.state === 'CONFIRMED_LONG';
  const isShort = setup.state === 'CONFIRMED_SHORT';
  const isWait = setup.state === 'WAIT_FOR_CONFIRMATION';

  const stateColor = isLong
    ? 'text-emerald-400 bg-emerald-950/70 border-emerald-800'
    : isShort
    ? 'text-rose-400 bg-rose-950/70 border-rose-800'
    : isWait
    ? 'text-amber-400 bg-amber-950/70 border-amber-800'
    : 'text-neutral-400 bg-neutral-900 border-neutral-800';

  const stateLabel = isLong
    ? 'CONFIRMED LONG'
    : isShort
    ? 'CONFIRMED SHORT'
    : isWait
    ? 'WAIT FOR CONFIRMATION'
    : 'NO SETUP';

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white font-mono">{setup.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${stateColor}`}>
                  {stateLabel}
                </span>
                {setup.setupType === 'Whale Resilience' && (
                  <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded font-mono">
                    <Waves className="w-3 h-3" /> Whale Resilience
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono mt-1">
                <span>Price: <strong className="text-white">${formatPrice(setup.price)}</strong></span>
                <span className={setup.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  24h: {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%
                </span>
                <span>24h Vol: <strong className="text-neutral-200">${(setup.quoteVolume24h / 1e6).toFixed(1)}M</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://www.tradingview.com/chart/?symbol=BINANCE:${setup.symbol}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors font-mono"
            >
              <span>TradingView</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Chart Controls & Candlestick Component */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold font-mono text-neutral-400 tracking-wider">
                Price Action & Indicator Overlays
              </span>

              {/* Timeframe selector */}
              <div className="flex items-center gap-1 p-0.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs font-mono">
                {(['5m', '15m', '1h', '4h'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setChartInterval(tf)}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      chartInterval === tf
                        ? 'bg-neutral-800 text-emerald-400 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingCandles ? (
              <div className="w-full h-72 flex items-center justify-center bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-500 font-mono text-xs">
                Loading live chart data from Binance...
              </div>
            ) : (
              <CandlestickChart
                candles={candles}
                symbol={setup.symbol}
                entry={setup.entry}
                tp1={setup.tp1}
                tp2={setup.tp2}
                sl={setup.sl}
                nearestSupport={setup.nearestSupport}
                nearestResistance={setup.nearestResistance}
                showIndicators={true}
              />
            )}
          </div>

          {/* Trade Setup Execution Box (Entry, TP1, TP2, SL, R:R) */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Automated Trading Setup Parameters
                </span>
              </div>
              <span className="text-xs text-neutral-400">
                Risk/Reward: <strong className="text-emerald-400 text-sm">1:{setup.riskRewardRatio}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-neutral-950/80 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px] mb-1">Entry Price</div>
                <div className="text-sm font-bold text-sky-400">${formatPrice(setup.entry)}</div>
              </div>
              <div className="p-2.5 bg-neutral-950/80 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px] mb-1">Take Profit 1 (TP1)</div>
                <div className="text-sm font-bold text-emerald-400">${formatPrice(setup.tp1)}</div>
              </div>
              <div className="p-2.5 bg-neutral-950/80 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px] mb-1">Take Profit 2 (TP2)</div>
                <div className="text-sm font-bold text-emerald-500">${formatPrice(setup.tp2)}</div>
              </div>
              <div className="p-2.5 bg-neutral-950/80 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px] mb-1">Stop Loss (SL)</div>
                <div className="text-sm font-bold text-rose-400">${formatPrice(setup.sl)}</div>
              </div>
            </div>

            {/* Support & Resistance Levels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] mt-3 pt-3 border-t border-neutral-800 text-neutral-400">
              <div>Nearest Support: <strong className="text-neutral-200">${formatPrice(setup.nearestSupport)}</strong></div>
              <div>Major Support: <strong className="text-neutral-200">${formatPrice(setup.majorSupport)}</strong></div>
              <div>Nearest Resist: <strong className="text-neutral-200">${formatPrice(setup.nearestResistance)}</strong></div>
              <div>Major Resist: <strong className="text-neutral-200">${formatPrice(setup.majorResistance)}</strong></div>
            </div>
          </div>

          {/* Score Breakdown & Confirmation Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score Breakdown (Transparent Formula) */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 font-mono">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Score Breakdown
                  </span>
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  {setup.score}/100 ({setup.scoreBreakdown.scoreLabel})
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Trend Baseline:</span>
                  <strong className="text-white">{setup.scoreBreakdown.trendScore}/20</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>EMA Alignment:</span>
                  <strong className="text-white">{setup.scoreBreakdown.emaScore}/20</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>VWAP Status:</span>
                  <strong className="text-white">{setup.scoreBreakdown.vwapScore}/15</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Volume Expansion:</span>
                  <strong className="text-white">{setup.scoreBreakdown.volumeScore}/15</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>RSI Momentum:</span>
                  <strong className="text-white">{setup.scoreBreakdown.rsiScore}/10</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Oscillators & MFI:</span>
                  <strong className="text-white">{setup.scoreBreakdown.momentumScore}/10</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-300">
                  <span>MTF Synchronization:</span>
                  <strong className="text-white">{setup.scoreBreakdown.mtfScore}/10</strong>
                </div>

                <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 font-sans">
                  ⚠️ Note: Score measures algorithmic condition alignment; it is not a win rate percentage or trade guarantee.
                </div>
              </div>
            </div>

            {/* Confirmation Checklist */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 font-mono">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Confirmation Checklist
                  </span>
                </div>
                <span className="text-xs text-neutral-400">
                  {setup.confirmations.filter(c => c.satisfied).length}/{setup.confirmations.length} Satisfied
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {setup.confirmations.map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className={item.satisfied ? 'text-emerald-400 font-bold' : 'text-neutral-500 font-bold'}>
                      {item.satisfied ? '☑' : '☐'}
                    </span>
                    <div>
                      <div className={`font-semibold ${item.satisfied ? 'text-neutral-200' : 'text-neutral-400'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-sans">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Timeframe Alignment Matrix */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Timeframe Analysis Matrix (MTF: {setup.mtf.alignmentFraction})
              </span>
              <span className="text-xs text-emerald-400">{setup.mtf.overallAlignment}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {(['tf5m', 'tf15m', 'tf1h', 'tf4h'] as const).map(tfKey => {
                const tf = setup.mtf[tfKey];
                const isBull = tf.trend === 'bullish';
                const isBear = tf.trend === 'bearish';
                return (
                  <div key={tfKey} className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <div className="flex items-center justify-between mb-1.5 font-bold">
                      <span className="text-white">{tf.timeframe.toUpperCase()}</span>
                      <span className={isBull ? 'text-emerald-400' : isBear ? 'text-rose-400' : 'text-neutral-400'}>
                        {isBull ? '🟢 Bullish' : isBear ? '🔴 Bearish' : '⚪ Neutral'}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-neutral-400">
                      <div>EMA: <strong className="text-neutral-200">{tf.emaBullish ? 'Bullish' : 'Bearish'}</strong></div>
                      <div>VWAP: <strong className="text-neutral-200">{tf.vwapBullish ? 'Above' : 'Below'}</strong></div>
                      <div>RSI: <strong className="text-neutral-200">{tf.rsi}</strong></div>
                      <div>Volume: <strong className="text-neutral-200">{tf.volumeBullish ? 'Expanding' : 'Subdued'}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Indicator Exact Readings */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 font-mono text-xs">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3 border-b border-neutral-800 pb-2">
              Comprehensive Technical Indicator Values
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-neutral-300">
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">EMA 9</span>
                <div className="font-bold text-white">${formatPrice(ind.ema9)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">EMA 21</span>
                <div className="font-bold text-white">${formatPrice(ind.ema21)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">EMA 200</span>
                <div className="font-bold text-white">${formatPrice(ind.ema200)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">VWAP</span>
                <div className="font-bold text-white">${formatPrice(ind.vwap)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">RSI (14)</span>
                <div className="font-bold text-emerald-400">{ind.rsi.toFixed(1)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">MFI (14)</span>
                <div className="font-bold text-emerald-400">{ind.mfi.toFixed(1)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">Stoch %K / %D</span>
                <div className="font-bold text-white">{ind.stochK.toFixed(1)} / {ind.stochD.toFixed(1)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">ATR (14)</span>
                <div className="font-bold text-white">${formatPrice(ind.atr)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">Vol vs 20-SMA</span>
                <div className={ind.volumeChangePercent >= 0 ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>
                  {ind.volumeChangePercent >= 0 ? '+' : ''}{ind.volumeChangePercent.toFixed(1)}%
                </div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">Taker Buy %</span>
                <div className="font-bold text-cyan-400">{ind.buyPressurePercent.toFixed(1)}%</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">Current Vol</span>
                <div className="font-bold text-neutral-300">{ind.currentVolume.toFixed(0)}</div>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500">20-SMA Vol</span>
                <div className="font-bold text-neutral-300">{ind.avgVolume20.toFixed(0)}</div>
              </div>
            </div>
          </div>

          {/* Explainable Rationale: Why This Setup? & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Why This Setup? */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider mb-2.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Why this setup?</span>
              </div>
              <ul className="space-y-1.5 text-neutral-300 font-sans">
                {setup.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Potential Headwinds & Risks */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Headwinds & Risks</span>
              </div>
              <ul className="space-y-1.5 text-neutral-300 font-sans">
                {setup.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400">⚠</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-neutral-500 font-mono">
            SOSSKA CRYPTO SCREENER V2 · Market Analysis Tool · Not Financial Advice
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenRiskCalc();
              }}
              className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 rounded-lg transition-colors cursor-pointer"
            >
              Open Position Sizer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
