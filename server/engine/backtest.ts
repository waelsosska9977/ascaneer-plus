import { BacktestResult, BacktestTrade } from '../../src/types/crypto.ts';
import { fetchKlines } from '../data/binance.ts';
import { computeTechnicalIndicators, findSupportResistance } from './indicators.ts';
import { buildMTFAnalysis, calculateScore } from './signalEngine.ts';

export async function runBacktest(
  symbol: string,
  timeframe: string = '1h',
  candleLimit: number = 250,
  minScore: number = 70
): Promise<BacktestResult> {
  const candles = await fetchKlines(symbol, timeframe, candleLimit);
  if (candles.length < 50) {
    return {
      symbol,
      timeframe,
      candleCount: candles.length,
      totalSetups: 0,
      tp1Hits: 0,
      tp2Hits: 0,
      slHits: 0,
      winRateTP1: 0,
      winRateTP2: 0,
      averageR: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      trades: [],
    };
  }

  const trades: BacktestTrade[] = [];
  let inTrade = false;
  let activeTrade: Partial<BacktestTrade> | null = null;
  let tradeIndex = 0;

  // We start simulating from index 35 (needs history for 21 EMA, RSI, VWAP)
  for (let i = 35; i < candles.length - 1; i++) {
    const currentSlice = candles.slice(0, i + 1);
    const c = candles[i];
    const price = c.close;

    if (inTrade && activeTrade) {
      // Check trade progression
      const isLong = activeTrade.type === 'LONG';
      const high = c.high;
      const low = c.low;
      const barsHeld = i - tradeIndex;

      let outcome: 'TP1 Hit' | 'TP2 Hit' | 'SL Hit' | 'Timed Out' | null = null;
      let exitPrice = price;

      if (isLong) {
        if (high >= (activeTrade.tp2 || 0)) {
          outcome = 'TP2 Hit';
          exitPrice = activeTrade.tp2 || price;
        } else if (high >= (activeTrade.tp1 || 0)) {
          outcome = 'TP1 Hit';
          exitPrice = activeTrade.tp1 || price;
        } else if (low <= (activeTrade.sl || 0)) {
          outcome = 'SL Hit';
          exitPrice = activeTrade.sl || price;
        } else if (barsHeld >= 24) {
          outcome = 'Timed Out';
          exitPrice = price;
        }
      } else {
        if (low <= (activeTrade.tp2 || 0)) {
          outcome = 'TP2 Hit';
          exitPrice = activeTrade.tp2 || price;
        } else if (low <= (activeTrade.tp1 || 0)) {
          outcome = 'TP1 Hit';
          exitPrice = activeTrade.tp1 || price;
        } else if (high >= (activeTrade.sl || 0)) {
          outcome = 'SL Hit';
          exitPrice = activeTrade.sl || price;
        } else if (barsHeld >= 24) {
          outcome = 'Timed Out';
          exitPrice = price;
        }
      }

      if (outcome) {
        const entry = activeTrade.entryPrice || 1;
        const pnlPercent = isLong
          ? ((exitPrice - entry) / entry) * 100
          : ((entry - exitPrice) / entry) * 100;

        const risk = Math.abs(entry - (activeTrade.sl || entry));
        const rMultiple = risk > 0 ? (isLong ? (exitPrice - entry) / risk : (entry - exitPrice) / risk) : 1;

        trades.push({
          id: `bt_${symbol}_${trades.length + 1}`,
          entryTimestamp: activeTrade.entryTimestamp || c.timestamp,
          exitTimestamp: c.timestamp,
          type: activeTrade.type || 'LONG',
          entryPrice: Number(entry.toFixed(4)),
          exitPrice: Number(exitPrice.toFixed(4)),
          tp1: Number((activeTrade.tp1 || 0).toFixed(4)),
          tp2: Number((activeTrade.tp2 || 0).toFixed(4)),
          sl: Number((activeTrade.sl || 0).toFixed(4)),
          score: activeTrade.score || 75,
          outcome,
          pnlPercent: Number(pnlPercent.toFixed(2)),
          rMultiple: Number(rMultiple.toFixed(2)),
        });

        inTrade = false;
        activeTrade = null;
      }
      continue;
    }

    // Evaluate setup at this bar
    const ind = computeTechnicalIndicators(currentSlice);
    const mtf = buildMTFAnalysis(currentSlice, currentSlice, currentSlice, currentSlice);
    const sr = findSupportResistance(currentSlice);

    const longScore = calculateScore(ind, mtf, price, 'LONG');
    const shortScore = calculateScore(ind, mtf, price, 'SHORT');

    if (longScore.totalScore >= minScore && price > ind.ema200 && ind.ema9 > ind.ema21 && ind.priceVsVwap === 'above') {
      const atrBuffer = Math.max(ind.atr * 1.5, price * 0.015);
      const sl = Math.max(price - atrBuffer, sr.nearestSupport * 0.995);
      const risk = price - sl;
      const tp1 = price + risk * 1.5;
      const tp2 = price + risk * 2.5;

      inTrade = true;
      tradeIndex = i;
      activeTrade = {
        type: 'LONG',
        entryTimestamp: c.timestamp,
        entryPrice: price,
        tp1,
        tp2,
        sl,
        score: longScore.totalScore,
      };
    } else if (shortScore.totalScore >= minScore && price < ind.ema200 && ind.ema9 < ind.ema21 && ind.priceVsVwap === 'below') {
      const atrBuffer = Math.max(ind.atr * 1.5, price * 0.015);
      const sl = Math.min(price + atrBuffer, sr.nearestResistance * 1.005);
      const risk = sl - price;
      const tp1 = price - risk * 1.5;
      const tp2 = price - risk * 2.5;

      inTrade = true;
      tradeIndex = i;
      activeTrade = {
        type: 'SHORT',
        entryTimestamp: c.timestamp,
        entryPrice: price,
        tp1,
        tp2,
        sl,
        score: shortScore.totalScore,
      };
    }
  }

  const totalSetups = trades.length;
  const tp1Hits = trades.filter(t => t.outcome === 'TP1 Hit').length;
  const tp2Hits = trades.filter(t => t.outcome === 'TP2 Hit').length;
  const slHits = trades.filter(t => t.outcome === 'SL Hit').length;

  const winRateTP1 = totalSetups > 0 ? Number(((tp1Hits + tp2Hits) / totalSetups * 100).toFixed(1)) : 0;
  const winRateTP2 = totalSetups > 0 ? Number((tp2Hits / totalSetups * 100).toFixed(1)) : 0;

  const totalPnL = trades.reduce((acc, t) => acc + t.pnlPercent, 0);
  const averageR = totalSetups > 0 ? Number((trades.reduce((acc, t) => acc + t.rMultiple, 0) / totalSetups).toFixed(2)) : 0;

  // Max drawdown calculation
  let peak = 0;
  let cumPnL = 0;
  let maxDD = 0;
  for (const t of trades) {
    cumPnL += t.pnlPercent;
    if (cumPnL > peak) peak = cumPnL;
    const dd = peak - cumPnL;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    symbol,
    timeframe,
    candleCount: candles.length,
    totalSetups,
    tp1Hits,
    tp2Hits,
    slHits,
    winRateTP1,
    winRateTP2,
    averageR,
    totalPnL: Number(totalPnL.toFixed(2)),
    maxDrawdown: Number(maxDD.toFixed(2)),
    trades,
  };
}
