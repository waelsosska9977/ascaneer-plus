import React, { useMemo, useState } from 'react';
import { Candle } from '../types/crypto.ts';

interface CandlestickChartProps {
  candles: Candle[];
  symbol: string;
  entry?: number;
  tp1?: number;
  tp2?: number;
  sl?: number;
  nearestSupport?: number;
  nearestResistance?: number;
  showIndicators?: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  symbol,
  entry,
  tp1,
  tp2,
  sl,
  nearestSupport,
  nearestResistance,
  showIndicators = true,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Take the most recent 60 candles for crisp visibility
  const visibleCandles = useMemo(() => {
    return candles.slice(-60);
  }, [candles]);

  const { minPrice, maxPrice, maxVolume, ema9, ema21, ema200, vwap } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { minPrice: 0, maxPrice: 1, maxVolume: 1, ema9: [], ema21: [], ema200: [], vwap: [] };
    }

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    if (entry) {
      if (entry < min) min = entry;
      if (entry > max) max = entry;
    }
    if (sl) {
      if (sl < min) min = sl;
      if (sl > max) max = sl;
    }
    if (tp2) {
      if (tp2 > max) max = tp2;
    }

    const padding = (max - min) * 0.08 || 1;
    min -= padding;
    max += padding;

    // Calculate EMA 9, 21, 200 on all candles then slice
    const closes = candles.map(c => c.close);
    const calcEma = (period: number) => {
      const k = 2 / (period + 1);
      const res: number[] = [];
      let prev = closes[0] || 0;
      res.push(prev);
      for (let i = 1; i < closes.length; i++) {
        prev = closes[i] * k + prev * (1 - k);
        res.push(prev);
      }
      return res.slice(-visibleCandles.length);
    };

    // Calculate session VWAP
    let cumVol = 0;
    let cumTyp = 0;
    const vwapFull = candles.map(c => {
      const typ = (c.high + c.low + c.close) / 3;
      cumVol += c.volume;
      cumTyp += typ * c.volume;
      return cumVol > 0 ? cumTyp / cumVol : c.close;
    });

    return {
      minPrice: min,
      maxPrice: max,
      maxVolume: maxVol || 1,
      ema9: calcEma(9),
      ema21: calcEma(21),
      ema200: calcEma(Math.min(200, candles.length)),
      vwap: vwapFull.slice(-visibleCandles.length),
    };
  }, [candles, visibleCandles, entry, sl, tp2]);

  const width = 800;
  const height = 340;
  const chartHeight = 240;
  const volumeHeight = 70;
  const volumeTop = 260;

  const count = visibleCandles.length;
  const candleWidth = count > 0 ? Math.max(3, (width - 60) / count) : 10;
  const barSpacing = candleWidth * 0.75;

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight + 10;
  };

  const getVolY = (vol: number) => {
    return height - (vol / maxVolume) * volumeHeight - 5;
  };

  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex]
    ? visibleCandles[hoverIndex]
    : visibleCandles[visibleCandles.length - 1];

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toFixed(2);
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  // Build EMA Paths
  const buildPath = (data: number[]) => {
    if (data.length === 0) return '';
    return data
      .map((val, i) => {
        const x = i * candleWidth + candleWidth / 2;
        const y = getY(val);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200">
      {/* Chart Top Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-neutral-800/80 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white tracking-wide">{symbol}</span>
          {activeCandle && (
            <div className="flex items-center gap-3 text-neutral-400">
              <span>O: <strong className="text-white">${formatPrice(activeCandle.open)}</strong></span>
              <span>H: <strong className="text-emerald-400">${formatPrice(activeCandle.high)}</strong></span>
              <span>L: <strong className="text-rose-400">${formatPrice(activeCandle.low)}</strong></span>
              <span>C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${formatPrice(activeCandle.close)}</strong></span>
              <span>Vol: <strong className="text-neutral-200">{activeCandle.volume.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong></span>
            </div>
          )}
        </div>

        {showIndicators && (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> EMA 9
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-0.5 bg-amber-400 inline-block" /> EMA 21
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-0.5 bg-purple-400 inline-block" /> EMA 200
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-0.5 bg-blue-400 inline-block" /> VWAP
            </span>
          </div>
        )}
      </div>

      {/* SVG Candlestick Plot */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[380px] overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
            const y = chartHeight * ratio + 10;
            const price = maxPrice - (maxPrice - minPrice) * ratio;
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={width - 50} y2={y} stroke="#262626" strokeDasharray="3 3" strokeWidth="0.8" />
                <text x={width - 45} y={y + 3} fill="#737373" fontSize="10" fontFamily="monospace">
                  {formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* Volume separator */}
          <line x1={0} y1={volumeTop - 5} x2={width - 50} y2={volumeTop - 5} stroke="#262626" strokeWidth="1" />
          <text x={10} y={volumeTop + 12} fill="#525252" fontSize="9" fontFamily="monospace">
            VOLUME
          </text>

          {/* Target Price Lines if provided */}
          {entry && (
            <g>
              <line x1={0} y1={getY(entry)} x2={width - 50} y2={getY(entry)} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x={width - 45} y={getY(entry) + 3} fill="#60a5fa" fontSize="9" fontWeight="600" fontFamily="monospace">
                ENTRY
              </text>
            </g>
          )}

          {tp1 && (
            <g>
              <line x1={0} y1={getY(tp1)} x2={width - 50} y2={getY(tp1)} stroke="#10b981" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x={width - 45} y={getY(tp1) + 3} fill="#34d399" fontSize="9" fontWeight="600" fontFamily="monospace">
                TP1
              </text>
            </g>
          )}

          {tp2 && (
            <g>
              <line x1={0} y1={getY(tp2)} x2={width - 50} y2={getY(tp2)} stroke="#059669" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x={width - 45} y={getY(tp2) + 3} fill="#10b981" fontSize="9" fontWeight="600" fontFamily="monospace">
                TP2
              </text>
            </g>
          )}

          {sl && (
            <g>
              <line x1={0} y1={getY(sl)} x2={width - 50} y2={getY(sl)} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x={width - 45} y={getY(sl) + 3} fill="#f87171" fontSize="9" fontWeight="600" fontFamily="monospace">
                SL
              </text>
            </g>
          )}

          {/* Support / Resistance Levels */}
          {nearestSupport && (
            <line x1={0} y1={getY(nearestSupport)} x2={width - 50} y2={getY(nearestSupport)} stroke="#065f46" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
          )}
          {nearestResistance && (
            <line x1={0} y1={getY(nearestResistance)} x2={width - 50} y2={getY(nearestResistance)} stroke="#881337" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
          )}

          {/* Candlesticks & Volume Bars */}
          {visibleCandles.map((c, i) => {
            const x = i * candleWidth + candleWidth / 2;
            const isGreen = c.close >= c.open;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
            const volY = getVolY(c.volume);
            const volBarHeight = Math.max(1, height - 5 - volY);

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-crosshair"
              >
                {/* Candle Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isGreen ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.2"
                />

                {/* Candle Body */}
                <rect
                  x={x - barSpacing / 2}
                  y={bodyTop}
                  width={barSpacing}
                  height={bodyHeight}
                  fill={isGreen ? '#10b981' : '#f43f5e'}
                  rx="0.5"
                />

                {/* Volume Bar */}
                <rect
                  x={x - barSpacing / 2}
                  y={volY}
                  width={barSpacing}
                  height={volBarHeight}
                  fill={isGreen ? '#065f46' : '#881337'}
                  opacity={hoverIndex === i ? 0.9 : 0.6}
                />
              </g>
            );
          })}

          {/* Indicator Lines */}
          {showIndicators && (
            <>
              {/* EMA 9 */}
              <path d={buildPath(ema9)} fill="none" stroke="#22d3ee" strokeWidth="1.3" opacity="0.9" />
              {/* EMA 21 */}
              <path d={buildPath(ema21)} fill="none" stroke="#fbbf24" strokeWidth="1.3" opacity="0.9" />
              {/* EMA 200 */}
              <path d={buildPath(ema200)} fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.85" />
              {/* VWAP */}
              <path d={buildPath(vwap)} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.95" />
            </>
          )}

          {/* Vertical Crosshair Line */}
          {hoverIndex !== null && (
            <line
              x1={hoverIndex * candleWidth + candleWidth / 2}
              y1={0}
              x2={hoverIndex * candleWidth + candleWidth / 2}
              y2={height}
              stroke="#525252"
              strokeDasharray="2 2"
              strokeWidth="0.8"
            />
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono">
        <span>60 Bars ({symbol})</span>
        <span>Green = Close ≥ Open · Red = Close &lt; Open</span>
      </div>
    </div>
  );
};
