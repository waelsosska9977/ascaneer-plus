import { Candle, TechnicalIndicators } from '../../src/types/crypto.ts';

export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  if (prices.length < period) {
    const sum = prices.reduce((a, b) => a + b, 0);
    return new Array(prices.length).fill(sum / prices.length);
  }

  const k = 2 / (period + 1);
  const emaValues: number[] = new Array(prices.length);

  // Initial SMA for the first period elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  emaValues[period - 1] = sum / period;

  for (let i = 0; i < period - 1; i++) {
    emaValues[i] = prices[i];
  }

  for (let i = period; i < prices.length; i++) {
    emaValues[i] = prices[i] * k + emaValues[i - 1] * (1 - k);
  }

  return emaValues;
}

export function calculateVWAP(candles: Candle[]): number[] {
  if (candles.length === 0) return [];
  const vwap: number[] = [];
  let cumTypicalVolume = 0;
  let cumVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumTypicalVolume += typicalPrice * c.volume;
    cumVolume += c.volume;

    vwap.push(cumVolume > 0 ? cumTypicalVolume / cumVolume : c.close);
  }

  return vwap;
}

export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length <= period) return new Array(prices.length).fill(50);

  const rsi: number[] = new Array(prices.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

export function calculateMFI(candles: Candle[], period: number = 14): number[] {
  if (candles.length <= period) return new Array(candles.length).fill(50);

  const mfi: number[] = new Array(candles.length).fill(50);
  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
  const rawMoneyFlow = typicalPrices.map((tp, i) => tp * candles[i].volume);

  for (let i = period; i < candles.length; i++) {
    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      if (typicalPrices[j] > typicalPrices[j - 1]) {
        positiveFlow += rawMoneyFlow[j];
      } else if (typicalPrices[j] < typicalPrices[j - 1]) {
        negativeFlow += rawMoneyFlow[j];
      }
    }

    if (negativeFlow === 0) {
      mfi[i] = 100;
    } else {
      const moneyRatio = positiveFlow / negativeFlow;
      mfi[i] = 100 - (100 / (1 + moneyRatio));
    }
  }

  return mfi;
}

export function calculateStochastic(
  candles: Candle[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number[]; d: number[] } {
  const kFast: number[] = new Array(candles.length).fill(50);

  for (let i = period - 1; i < candles.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      if (candles[j].low < lowestLow) lowestLow = candles[j].low;
    }

    const range = highestHigh - lowestLow;
    if (range > 0) {
      kFast[i] = ((candles[i].close - lowestLow) / range) * 100;
    } else {
      kFast[i] = 50;
    }
  }

  // Smooth K with SMA smoothK
  const kSlow: number[] = new Array(candles.length).fill(50);
  for (let i = period - 1 + smoothK - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - smoothK + 1; j <= i; j++) {
      sum += kFast[j];
    }
    kSlow[i] = sum / smoothK;
  }

  // %D is SMA of %K over smoothD
  const d: number[] = new Array(candles.length).fill(50);
  for (let i = period - 1 + smoothK - 1 + smoothD - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - smoothD + 1; j <= i; j++) {
      sum += kSlow[j];
    }
    d[i] = sum / smoothD;
  }

  return { k: kSlow, d };
}

export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length === 0) return [];
  const tr: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const prevClose = candles[i - 1].close;
    const trueRange = Math.max(h - l, Math.abs(h - prevClose), Math.abs(l - prevClose));
    tr.push(trueRange);
  }

  const atr: number[] = new Array(candles.length).fill(0);
  if (candles.length <= period) {
    const avg = tr.reduce((a, b) => a + b, 0) / tr.length;
    return new Array(candles.length).fill(avg);
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  atr[period - 1] = sum / period;

  for (let i = period; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  return atr;
}

export function calculateVolumeSMA(candles: Candle[], period: number = 20): number[] {
  const sma: number[] = new Array(candles.length).fill(0);
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    const count = i - start + 1;
    let sum = 0;
    for (let j = start; j <= i; j++) {
      sum += candles[j].volume;
    }
    sma[i] = sum / count;
  }
  return sma;
}

export function findSupportResistance(candles: Candle[]): {
  nearestSupport: number;
  majorSupport: number;
  nearestResistance: number;
  majorResistance: number;
} {
  const currentPrice = candles[candles.length - 1]?.close || 0;
  const swingLows: number[] = [];
  const swingHighs: number[] = [];

  // Look for pivot highs and lows (local extrema in 5-bar window)
  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];
    const isLow =
      c.low <= candles[i - 1].low &&
      c.low <= candles[i - 2].low &&
      c.low <= candles[i + 1].low &&
      c.low <= candles[i + 2].low;

    const isHigh =
      c.high >= candles[i - 1].high &&
      c.high >= candles[i - 2].high &&
      c.high >= candles[i + 1].high &&
      c.high >= candles[i + 2].high;

    if (isLow) swingLows.push(c.low);
    if (isHigh) swingHighs.push(c.high);
  }

  const supportsBelow = swingLows.filter(p => p < currentPrice).sort((a, b) => b - a);
  const resistancesAbove = swingHighs.filter(p => p > currentPrice).sort((a, b) => a - b);

  const nearestSupport = supportsBelow[0] ?? currentPrice * 0.97;
  const majorSupport = supportsBelow[supportsBelow.length - 1] ?? currentPrice * 0.92;
  const nearestResistance = resistancesAbove[0] ?? currentPrice * 1.03;
  const majorResistance = resistancesAbove[resistancesAbove.length - 1] ?? currentPrice * 1.08;

  return {
    nearestSupport,
    majorSupport,
    nearestResistance,
    majorResistance,
  };
}

export function computeTechnicalIndicators(candles: Candle[]): TechnicalIndicators {
  if (candles.length === 0) {
    return {
      ema9: 0,
      ema21: 0,
      ema200: 0,
      vwap: 0,
      rsi: 50,
      mfi: 50,
      stochK: 50,
      stochD: 50,
      atr: 0,
      currentVolume: 0,
      avgVolume20: 0,
      volumeChangePercent: 0,
      priceVsVwap: 'above',
      emaTrend: 'neutral',
      stochSignal: 'neutral',
      buyPressurePercent: 50,
    };
  }

  const closes = candles.map(c => c.close);
  const lastIndex = candles.length - 1;
  const lastClose = closes[lastIndex];

  const ema9Series = calculateEMA(closes, 9);
  const ema21Series = calculateEMA(closes, 21);
  const ema200Series = calculateEMA(closes, Math.min(200, closes.length));
  const vwapSeries = calculateVWAP(candles);
  const rsiSeries = calculateRSI(closes, 14);
  const mfiSeries = calculateMFI(candles, 14);
  const stoch = calculateStochastic(candles, 14, 3, 3);
  const atrSeries = calculateATR(candles, 14);
  const volSmaSeries = calculateVolumeSMA(candles, 20);

  const ema9 = ema9Series[lastIndex] || lastClose;
  const ema21 = ema21Series[lastIndex] || lastClose;
  const ema200 = ema200Series[lastIndex] || lastClose;
  const vwap = vwapSeries[lastIndex] || lastClose;
  const rsi = rsiSeries[lastIndex] || 50;
  const mfi = mfiSeries[lastIndex] || 50;
  const stochK = stoch.k[lastIndex] || 50;
  const stochD = stoch.d[lastIndex] || 50;
  const atr = atrSeries[lastIndex] || lastClose * 0.02;

  const currentVolume = candles[lastIndex].volume;
  const avgVolume20 = volSmaSeries[lastIndex] || currentVolume;
  const volumeChangePercent = avgVolume20 > 0
    ? ((currentVolume - avgVolume20) / avgVolume20) * 100
    : 0;

  const priceVsVwap: 'above' | 'below' = lastClose >= vwap ? 'above' : 'below';

  let emaTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (ema9 > ema21 && lastClose > ema200) {
    emaTrend = 'bullish';
  } else if (ema9 < ema21 && lastClose < ema200) {
    emaTrend = 'bearish';
  }

  let stochSignal: 'oversold' | 'overbought' | 'bullish_cross' | 'bearish_cross' | 'neutral' = 'neutral';
  const prevK = stoch.k[lastIndex - 1] ?? stochK;
  const prevD = stoch.d[lastIndex - 1] ?? stochD;

  if (stochK < 20 && stochD < 20) {
    stochSignal = 'oversold';
  } else if (stochK > 80 && stochD > 80) {
    stochSignal = 'overbought';
  } else if (prevK <= prevD && stochK > stochD && stochK < 60) {
    stochSignal = 'bullish_cross';
  } else if (prevK >= prevD && stochK < stochD && stochK > 40) {
    stochSignal = 'bearish_cross';
  }

  // Taker buy pressure calculation
  const totalTakerBuy = candles[lastIndex].takerBuyBaseVolume ?? (currentVolume * 0.5);
  const buyPressurePercent = currentVolume > 0
    ? Math.min(100, Math.max(0, (totalTakerBuy / currentVolume) * 100))
    : 50;

  return {
    ema9,
    ema21,
    ema200,
    vwap,
    rsi,
    mfi,
    stochK,
    stochD,
    atr,
    currentVolume,
    avgVolume20,
    volumeChangePercent,
    priceVsVwap,
    emaTrend,
    stochSignal,
    buyPressurePercent,
  };
}
