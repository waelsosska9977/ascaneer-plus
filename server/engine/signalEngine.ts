import {
  Candle,
  ConfirmationItem,
  MTFAnalysis,
  ScoreBreakdown,
  SetupType,
  SignalState,
  TechnicalIndicators,
  TimeframeSignal,
  TradingSetup,
} from '../../src/types/crypto.ts';
import {
  computeTechnicalIndicators,
  findSupportResistance,
} from './indicators.ts';

export function analyzeTimeframe(candles: Candle[], tf: '5m' | '15m' | '1h' | '4h'): TimeframeSignal {
  const ind = computeTechnicalIndicators(candles);
  const lastClose = candles[candles.length - 1]?.close || 0;

  const emaBullish = ind.ema9 > ind.ema21 && lastClose > ind.ema200;
  const vwapBullish = ind.priceVsVwap === 'above';
  const volumeBullish = ind.volumeChangePercent > 0;

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let score = 0;

  if (emaBullish && vwapBullish) {
    trend = 'bullish';
    score += 40;
  } else if (!emaBullish && !vwapBullish) {
    trend = 'bearish';
    score -= 40;
  }

  if (ind.rsi > 50 && ind.rsi < 70) score += 20;
  else if (ind.rsi <= 50 && ind.rsi > 30) score -= 20;

  if (volumeBullish) score += (trend === 'bullish' ? 20 : -20);

  return {
    timeframe: tf,
    trend,
    emaBullish,
    vwapBullish,
    rsi: Number(ind.rsi.toFixed(1)),
    volumeBullish,
    score,
  };
}

export function buildMTFAnalysis(
  candles5m: Candle[],
  candles15m: Candle[],
  candles1h: Candle[],
  candles4h: Candle[]
): MTFAnalysis {
  const tf5m = analyzeTimeframe(candles5m, '5m');
  const tf15m = analyzeTimeframe(candles15m, '15m');
  const tf1h = analyzeTimeframe(candles1h, '1h');
  const tf4h = analyzeTimeframe(candles4h, '4h');

  const bullishCount = [tf5m, tf15m, tf1h, tf4h].filter(t => t.trend === 'bullish').length;
  const bearishCount = [tf5m, tf15m, tf1h, tf4h].filter(t => t.trend === 'bearish').length;

  let alignedCount = 0;
  let overallAlignment: 'Strong Bullish' | 'Strong Bearish' | 'Mixed' | 'Neutral' = 'Neutral';

  if (bullishCount >= 3) {
    alignedCount = bullishCount;
    overallAlignment = bullishCount === 4 ? 'Strong Bullish' : 'Mixed';
  } else if (bearishCount >= 3) {
    alignedCount = bearishCount;
    overallAlignment = bearishCount === 4 ? 'Strong Bearish' : 'Mixed';
  } else {
    alignedCount = Math.max(bullishCount, bearishCount, 1);
    overallAlignment = 'Mixed';
  }

  return {
    tf5m,
    tf15m,
    tf1h,
    tf4h,
    alignedCount,
    totalCount: 4,
    alignmentFraction: `${alignedCount}/4`,
    overallAlignment,
  };
}

export function calculateScore(
  ind: TechnicalIndicators,
  mtf: MTFAnalysis,
  price: number,
  targetDirection: 'LONG' | 'SHORT'
): ScoreBreakdown {
  let trendScore = 0;
  let emaScore = 0;
  let vwapScore = 0;
  let volumeScore = 0;
  let rsiScore = 0;
  let momentumScore = 0;
  let mtfScore = 0;

  if (targetDirection === 'LONG') {
    // 1. Trend (max 20)
    if (price > ind.ema200) trendScore += 12;
    if (ind.emaTrend === 'bullish') trendScore += 8;

    // 2. EMA (max 20)
    if (ind.ema9 > ind.ema21) emaScore += 12;
    if (price > ind.ema9 && price > ind.ema21) emaScore += 8;

    // 3. VWAP (max 15)
    if (ind.priceVsVwap === 'above') {
      vwapScore += 15;
    }

    // 4. Volume (max 15)
    if (ind.volumeChangePercent > 20) volumeScore += 15;
    else if (ind.volumeChangePercent > 0) volumeScore += 10;
    else volumeScore += 4;

    // 5. RSI (max 10)
    if (ind.rsi >= 50 && ind.rsi <= 68) rsiScore = 10;
    else if (ind.rsi > 40 && ind.rsi < 50) rsiScore = 7;
    else if (ind.rsi < 35) rsiScore = 8; // oversold bounce potential
    else if (ind.rsi > 70) rsiScore = 3; // overbought risk

    // 6. Momentum / Stoch / MFI (max 10)
    if (ind.mfi > 50) momentumScore += 4;
    if (ind.stochSignal === 'bullish_cross' || ind.stochSignal === 'oversold') momentumScore += 6;
    else if (ind.stochK < 70) momentumScore += 4;

    // 7. MTF (max 10)
    mtfScore = Math.round((mtf.alignedCount / 4) * 10);
  } else {
    // SHORT Direction
    // 1. Trend (max 20)
    if (price < ind.ema200) trendScore += 12;
    if (ind.emaTrend === 'bearish') trendScore += 8;

    // 2. EMA (max 20)
    if (ind.ema9 < ind.ema21) emaScore += 12;
    if (price < ind.ema9 && price < ind.ema21) emaScore += 8;

    // 3. VWAP (max 15)
    if (ind.priceVsVwap === 'below') {
      vwapScore += 15;
    }

    // 4. Volume (max 15)
    if (ind.volumeChangePercent > 20) volumeScore += 15;
    else if (ind.volumeChangePercent > 0) volumeScore += 10;
    else volumeScore += 4;

    // 5. RSI (max 10)
    if (ind.rsi <= 50 && ind.rsi >= 32) rsiScore = 10;
    else if (ind.rsi > 50 && ind.rsi < 60) rsiScore = 7;
    else if (ind.rsi > 70) rsiScore = 8; // overbought top reversal
    else if (ind.rsi < 30) rsiScore = 3; // oversold bounce risk

    // 6. Momentum (max 10)
    if (ind.mfi < 50) momentumScore += 4;
    if (ind.stochSignal === 'bearish_cross' || ind.stochSignal === 'overbought') momentumScore += 6;
    else if (ind.stochK > 30) momentumScore += 4;

    // 7. MTF (max 10)
    mtfScore = Math.round((mtf.alignedCount / 4) * 10);
  }

  const totalScore = Math.min(100, trendScore + emaScore + vwapScore + volumeScore + rsiScore + momentumScore + mtfScore);

  let scoreLabel: 'Strong Setup' | 'Moderate Setup' | 'Developing' | 'Weak / No Setup' = 'Weak / No Setup';
  if (totalScore >= 75) scoreLabel = 'Strong Setup';
  else if (totalScore >= 60) scoreLabel = 'Moderate Setup';
  else if (totalScore >= 45) scoreLabel = 'Developing';

  return {
    trendScore,
    emaScore,
    vwapScore,
    volumeScore,
    rsiScore,
    momentumScore,
    mtfScore,
    totalScore,
    scoreLabel,
  };
}

export function evaluateTradingSetup(
  symbol: string,
  price: number,
  change24h: number,
  high24h: number,
  low24h: number,
  volume24h: number,
  quoteVolume24h: number,
  candles1h: Candle[],
  candles5m: Candle[],
  candles15m: Candle[],
  candles4h: Candle[]
): TradingSetup {
  const baseAsset = symbol.replace('USDT', '');
  const ind = computeTechnicalIndicators(candles1h);
  const mtf = buildMTFAnalysis(candles5m, candles15m, candles1h, candles4h);
  const sr = findSupportResistance(candles1h);

  // Check Long vs Short score
  const longScore = calculateScore(ind, mtf, price, 'LONG');
  const shortScore = calculateScore(ind, mtf, price, 'SHORT');

  const isLongCandidate = longScore.totalScore >= shortScore.totalScore;
  const chosenDirection = isLongCandidate ? 'LONG' : 'SHORT';
  const scoreBreakdown = isLongCandidate ? longScore : shortScore;
  const score = scoreBreakdown.totalScore;

  // Confirmations checklist
  const confirmations: ConfirmationItem[] = isLongCandidate
    ? [
        {
          id: 'price_above_ema200',
          label: 'Price > EMA 200',
          satisfied: price > ind.ema200,
          detail: `Price ($${formatPrice(price)}) vs EMA 200 ($${formatPrice(ind.ema200)})`,
        },
        {
          id: 'ema9_above_ema21',
          label: 'EMA 9 > EMA 21',
          satisfied: ind.ema9 > ind.ema21,
          detail: `EMA 9 ($${formatPrice(ind.ema9)}) vs EMA 21 ($${formatPrice(ind.ema21)})`,
        },
        {
          id: 'price_above_vwap',
          label: 'Price > VWAP',
          satisfied: price > ind.vwap,
          detail: `Price ($${formatPrice(price)}) vs VWAP ($${formatPrice(ind.vwap)})`,
        },
        {
          id: 'volume_expansion',
          label: 'Volume Confirmation',
          satisfied: ind.volumeChangePercent >= 0,
          detail: `Volume ${ind.volumeChangePercent >= 0 ? '+' : ''}${ind.volumeChangePercent.toFixed(1)}% vs 20-SMA`,
        },
        {
          id: 'candle_close',
          label: 'Candle Structure Hold',
          satisfied: price >= (candles1h[candles1h.length - 1]?.open || price),
          detail: 'Current hourly bar maintaining green body or bullish rejection wick',
        },
      ]
    : [
        {
          id: 'price_below_ema200',
          label: 'Price < EMA 200',
          satisfied: price < ind.ema200,
          detail: `Price ($${formatPrice(price)}) vs EMA 200 ($${formatPrice(ind.ema200)})`,
        },
        {
          id: 'ema9_below_ema21',
          label: 'EMA 9 < EMA 21',
          satisfied: ind.ema9 < ind.ema21,
          detail: `EMA 9 ($${formatPrice(ind.ema9)}) vs EMA 21 ($${formatPrice(ind.ema21)})`,
        },
        {
          id: 'price_below_vwap',
          label: 'Price < VWAP',
          satisfied: price < ind.vwap,
          detail: `Price ($${formatPrice(price)}) vs VWAP ($${formatPrice(ind.vwap)})`,
        },
        {
          id: 'volume_expansion',
          label: 'Volume Confirmation',
          satisfied: ind.volumeChangePercent >= 0,
          detail: `Volume ${ind.volumeChangePercent >= 0 ? '+' : ''}${ind.volumeChangePercent.toFixed(1)}% vs 20-SMA`,
        },
        {
          id: 'candle_close',
          label: 'Candle Structure Hold',
          satisfied: price <= (candles1h[candles1h.length - 1]?.open || price),
          detail: 'Current hourly bar maintaining red body or rejection high',
        },
      ];

  const satisfiedCount = confirmations.filter(c => c.satisfied).length;

  let state: SignalState = 'NO_SETUP';
  if (score >= 70 && satisfiedCount >= 4) {
    state = isLongCandidate ? 'CONFIRMED_LONG' : 'CONFIRMED_SHORT';
  } else if (score >= 50 || satisfiedCount >= 3) {
    state = 'WAIT_FOR_CONFIRMATION';
  } else {
    state = 'NO_SETUP';
  }

  // Whale / Relative Liquidity Flow Resilience
  const isWhaleResilience =
    ind.mfi > 55 &&
    ind.buyPressurePercent > 53 &&
    ind.volumeChangePercent > 15 &&
    price > ind.ema21;

  let setupType: SetupType = 'None';
  if (isWhaleResilience && isLongCandidate) {
    setupType = 'Whale Resilience';
  } else if (ind.volumeChangePercent > 35) {
    setupType = 'Liquidity Expansion';
  } else if (state === 'CONFIRMED_LONG') {
    setupType = 'Standard Long';
  } else if (state === 'CONFIRMED_SHORT') {
    setupType = 'Standard Short';
  } else if (state === 'WAIT_FOR_CONFIRMATION') {
    setupType = isLongCandidate ? 'Standard Long' : 'Standard Short';
  }

  // Dynamic Entry, TP1, TP2, SL
  const atrBuffer = Math.max(ind.atr * 1.5, price * 0.015);
  let entry = price;
  let sl = 0;
  let tp1 = 0;
  let tp2 = 0;
  let riskRewardRatio = 2.0;

  if (isLongCandidate) {
    entry = price;
    // SL below nearest support or ATR buffer
    sl = Math.min(price - atrBuffer, Math.max(sr.nearestSupport * 0.995, price - atrBuffer * 1.4));
    const risk = Math.max(entry - sl, price * 0.01);
    tp1 = Number((entry + risk * 1.5).toFixed(6));
    tp2 = Number((entry + risk * 2.5).toFixed(6));
    riskRewardRatio = Number(((tp1 - entry) / risk).toFixed(2));
  } else {
    entry = price;
    sl = Math.max(price + atrBuffer, Math.min(sr.nearestResistance * 1.005, price + atrBuffer * 1.4));
    const risk = Math.max(sl - entry, price * 0.01);
    tp1 = Number((entry - risk * 1.5).toFixed(6));
    tp2 = Number((entry - risk * 2.5).toFixed(6));
    riskRewardRatio = Number(((entry - tp1) / risk).toFixed(2));
  }

  // Reasons list (Why this setup?)
  const reasons: string[] = [];
  if (isLongCandidate) {
    if (price > ind.ema200) reasons.push('Price firmly holding above 200 EMA baseline');
    if (ind.ema9 > ind.ema21) reasons.push(`Bullish EMA alignment: 9 EMA ($${formatPrice(ind.ema9)}) > 21 EMA ($${formatPrice(ind.ema21)})`);
    if (ind.priceVsVwap === 'above') reasons.push('Trading above daily Volume Weighted Average Price (VWAP)');
    if (ind.rsi >= 50 && ind.rsi <= 68) reasons.push(`Constructive RSI momentum (${ind.rsi.toFixed(1)}) in sustained accumulation zone`);
    if (ind.mfi > 50) reasons.push(`Positive relative Money Flow Index (${ind.mfi.toFixed(1)})`);
    if (ind.volumeChangePercent > 10) reasons.push(`Volume expansion (+${ind.volumeChangePercent.toFixed(1)}% vs 20-period average)`);
    if (mtf.alignedCount >= 3) reasons.push(`Multi-timeframe synchronization (${mtf.alignmentFraction} TFs aligned bullish)`);
    if (isWhaleResilience) reasons.push('High taker buy pressure with positive liquidity resilience');
  } else {
    if (price < ind.ema200) reasons.push('Price suppressed beneath 200 EMA trend resistance');
    if (ind.ema9 < ind.ema21) reasons.push(`Bearish EMA alignment: 9 EMA ($${formatPrice(ind.ema9)}) < 21 EMA ($${formatPrice(ind.ema21)})`);
    if (ind.priceVsVwap === 'below') reasons.push('Price distributed below VWAP benchmark');
    if (ind.rsi <= 50) reasons.push(`Bearish RSI distribution (${ind.rsi.toFixed(1)})`);
    if (ind.mfi < 50) reasons.push(`Net capital outflow indicated by MFI (${ind.mfi.toFixed(1)})`);
    if (ind.volumeChangePercent > 10) reasons.push('Elevated seller participation on downward expansion');
    if (mtf.alignedCount >= 3) reasons.push(`Multi-timeframe synchronization (${mtf.alignmentFraction} TFs aligned bearish)`);
  }

  if (reasons.length === 0) {
    reasons.push('Neutral market structure with consolidating indicators');
  }

  // Risks list
  const risks: string[] = [];
  if (isLongCandidate) {
    if (ind.rsi > 68) risks.push(`RSI (${ind.rsi.toFixed(1)}) approaching overbought territory; pullback possible`);
    if (Math.abs(price - sr.nearestResistance) / price < 0.015) risks.push(`Major overhead resistance within 1.5% ($${formatPrice(sr.nearestResistance)})`);
    if (ind.volumeChangePercent < 0) risks.push('Volume currently below 20-period average');
    if (mtf.alignedCount < 3) risks.push('Higher timeframes not yet fully aligned with 1H structure');
  } else {
    if (ind.rsi < 32) risks.push(`RSI (${ind.rsi.toFixed(1)}) oversold; short-squeeze bounce possible`);
    if (Math.abs(price - sr.nearestSupport) / price < 0.015) risks.push(`Strong support cluster nearby at $${formatPrice(sr.nearestSupport)}`);
    if (mtf.alignedCount < 3) risks.push('Lower timeframe counter-trend volatility');
  }

  if (risks.length === 0) {
    risks.push('Execute strict risk discipline; market volatility can invalidate setup');
  }

  let relativeFlow: 'High Institutional Inflow' | 'Moderate Inflow' | 'Outflow / Distribution' | 'Balanced' = 'Balanced';
  if (ind.mfi > 65 && ind.buyPressurePercent > 55) relativeFlow = 'High Institutional Inflow';
  else if (ind.mfi > 52 && ind.buyPressurePercent >= 50) relativeFlow = 'Moderate Inflow';
  else if (ind.mfi < 40 || ind.buyPressurePercent < 45) relativeFlow = 'Outflow / Distribution';

  return {
    symbol,
    baseAsset,
    price,
    change24h,
    high24h,
    low24h,
    volume24h,
    quoteVolume24h,
    state,
    setupType,
    score,
    scoreBreakdown,
    entry,
    tp1,
    tp2,
    sl,
    riskRewardRatio,
    nearestSupport: sr.nearestSupport,
    majorSupport: sr.majorSupport,
    nearestResistance: sr.nearestResistance,
    majorResistance: sr.majorResistance,
    indicators: ind,
    mtf,
    confirmations,
    reasons,
    risks,
    liquidityFlow: {
      relativeFlow,
      moneyFlowScore: Math.round(ind.mfi),
      buyPressurePercent: Number(ind.buyPressurePercent.toFixed(1)),
      volumeExpansion: ind.volumeChangePercent > 0,
      whaleResilience: isWhaleResilience,
    },
    lastUpdated: Date.now(),
  };
}

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.001) return p.toFixed(6);
  return p.toFixed(8);
}
