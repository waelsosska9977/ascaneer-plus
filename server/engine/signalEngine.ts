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

  // Responsive alignment: Fast EMA cross or price breaking above/below EMA 9 & VWAP
  const emaFastBullish = ind.ema9 >= ind.ema21;
  const emaFastBearish = ind.ema9 <= ind.ema21;
  const vwapBullish = ind.priceVsVwap === 'above';
  const volumeBullish = ind.volumeChangePercent > 5;

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let score = 0;

  // On fast timeframes (5m, 15m), early momentum triggers before 200 EMA
  if (tf === '5m' || tf === '15m') {
    if (lastClose >= ind.ema9 && (emaFastBullish || vwapBullish)) {
      trend = 'bullish';
      score += 50;
    } else if (lastClose <= ind.ema9 && (emaFastBearish || !vwapBullish)) {
      trend = 'bearish';
      score -= 50;
    }
  } else {
    // 1h, 4h macro trend
    if (emaFastBullish && lastClose > ind.ema21) {
      trend = 'bullish';
      score += 40;
    } else if (emaFastBearish && lastClose < ind.ema21) {
      trend = 'bearish';
      score -= 40;
    }
  }

  if (ind.rsi >= 46 && ind.rsi <= 68) score += 25;
  else if (ind.rsi <= 46 && ind.rsi >= 30) score -= 25;

  if (volumeBullish) score += (trend === 'bullish' ? 15 : -15);
  if (ind.stochSignal === 'bullish_cross') score += 10;
  if (ind.stochSignal === 'bearish_cross') score -= 10;

  return {
    timeframe: tf,
    trend,
    emaBullish: emaFastBullish,
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
  targetDirection: 'LONG' | 'SHORT',
  fastInd?: TechnicalIndicators,
  ultraFastInd?: TechnicalIndicators
): ScoreBreakdown {
  const fInd = fastInd || ind;
  const uInd = ultraFastInd || fInd;

  let trendScore = 0;
  let emaScore = 0;
  let vwapScore = 0;
  let volumeScore = 0;
  let rsiScore = 0;
  let momentumScore = 0;
  let mtfScore = 0;

  if (targetDirection === 'LONG') {
    // 1. Trend & Early Momentum Baseline (max 20)
    if (price > ind.ema200 || price > fInd.ema200) trendScore += 10;
    else if (fInd.priceVsVwap === 'above' && price > fInd.ema9) trendScore += 8; // Reversal bounce
    if (fInd.emaTrend === 'bullish' || fInd.ema9 >= fInd.ema21) trendScore += 10;
    else if (uInd.ema9 > uInd.ema21) trendScore += 6;

    // 2. Fast EMA Alignment & Early Trigger (max 20)
    if (fInd.ema9 > fInd.ema21) emaScore += 10;
    if (uInd.ema9 > uInd.ema21) emaScore += 5;
    if (price >= fInd.ema9 * 0.997) emaScore += 5;

    // 3. VWAP Status (max 15)
    if (fInd.priceVsVwap === 'above') {
      vwapScore += 15;
    } else if (price >= fInd.vwap * 0.996) {
      vwapScore += 10;
    }

    // 4. Volume Surge & Expansion (max 15)
    const maxVolExpansion = Math.max(fInd.volumeChangePercent, uInd.volumeChangePercent);
    if (maxVolExpansion > 25) volumeScore += 15;
    else if (maxVolExpansion > 10) volumeScore += 12;
    else if (maxVolExpansion >= 0) volumeScore += 8;
    else volumeScore += 4;

    // 5. RSI Sweet Spot - Early Entry Zone (max 10)
    // Best entry is when RSI has just started expanding (46 - 65)
    // Penalize when RSI > 72 (chasing the top of the pump!)
    if (fInd.rsi >= 46 && fInd.rsi <= 65) rsiScore = 10;
    else if (fInd.rsi > 65 && fInd.rsi <= 72) rsiScore = 7;
    else if (fInd.rsi > 72) rsiScore = 3; // Overbought risk
    else if (fInd.rsi < 38) rsiScore = 8; // Oversold bounce opportunity
    else rsiScore = 5;

    // 6. Fast Momentum / Stoch / MFI (max 10)
    if (fInd.stochSignal === 'bullish_cross' || uInd.stochSignal === 'bullish_cross') momentumScore += 6;
    else if (fInd.stochK < 65 && fInd.stochK > fInd.stochD) momentumScore += 5;
    else if (fInd.stochK < 30) momentumScore += 4;
    if (fInd.mfi > 50 || uInd.mfi > 52) momentumScore += 4;

    // 7. MTF Alignment (max 10)
    mtfScore = Math.round((mtf.alignedCount / 4) * 10);
  } else {
    // SHORT Direction
    // 1. Trend Baseline (max 20)
    if (price < ind.ema200 || price < fInd.ema200) trendScore += 10;
    else if (fInd.priceVsVwap === 'below' && price < fInd.ema9) trendScore += 8;
    if (fInd.emaTrend === 'bearish' || fInd.ema9 <= fInd.ema21) trendScore += 10;
    else if (uInd.ema9 < uInd.ema21) trendScore += 6;

    // 2. Fast EMA Alignment (max 20)
    if (fInd.ema9 < fInd.ema21) emaScore += 10;
    if (uInd.ema9 < uInd.ema21) emaScore += 5;
    if (price <= fInd.ema9 * 1.003) emaScore += 5;

    // 3. VWAP Status (max 15)
    if (fInd.priceVsVwap === 'below') {
      vwapScore += 15;
    } else if (price <= fInd.vwap * 1.004) {
      vwapScore += 10;
    }

    // 4. Volume Surge on Sell Impulses (max 15)
    const maxVolExpansion = Math.max(fInd.volumeChangePercent, uInd.volumeChangePercent);
    if (maxVolExpansion > 25) volumeScore += 15;
    else if (maxVolExpansion > 10) volumeScore += 12;
    else if (maxVolExpansion >= 0) volumeScore += 8;
    else volumeScore += 4;

    // 5. RSI Sweet Spot for Shorts (max 10)
    if (fInd.rsi <= 54 && fInd.rsi >= 35) rsiScore = 10;
    else if (fInd.rsi < 35 && fInd.rsi >= 28) rsiScore = 7;
    else if (fInd.rsi < 28) rsiScore = 3; // Oversold - short bounce risk
    else if (fInd.rsi > 65) rsiScore = 8;
    else rsiScore = 5;

    // 6. Fast Momentum (max 10)
    if (fInd.stochSignal === 'bearish_cross' || uInd.stochSignal === 'bearish_cross') momentumScore += 6;
    else if (fInd.stochK > 35 && fInd.stochK < fInd.stochD) momentumScore += 5;
    else if (fInd.stochK > 70) momentumScore += 4;
    if (fInd.mfi < 50 || uInd.mfi < 48) momentumScore += 4;

    // 7. MTF Alignment (max 10)
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
  
  // Fast execution indicators (15m is primary lead timeframe, 5m for early impulse trigger)
  const ind15m = computeTechnicalIndicators(candles15m.length >= 15 ? candles15m : candles1h);
  const ind5m = computeTechnicalIndicators(candles5m.length >= 15 ? candles5m : candles15m);
  const ind1h = computeTechnicalIndicators(candles1h);
  
  // Multi-Timeframe Alignment
  const mtf = buildMTFAnalysis(candles5m, candles15m, candles1h, candles4h);
  
  // Support & Resistance (computed on 15m/1h structure for tight, accurate levels)
  const sr = findSupportResistance(candles15m.length >= 25 ? candles15m : candles1h);

  // Check Long vs Short score using fast indicators so we catch the move early
  const longScore = calculateScore(ind1h, mtf, price, 'LONG', ind15m, ind5m);
  const shortScore = calculateScore(ind1h, mtf, price, 'SHORT', ind15m, ind5m);

  const isLongCandidate = longScore.totalScore >= shortScore.totalScore;
  const chosenDirection = isLongCandidate ? 'LONG' : 'SHORT';
  const scoreBreakdown = isLongCandidate ? longScore : shortScore;
  const score = scoreBreakdown.totalScore;

  // Confirmations checklist tailored to early, accurate entries
  const maxVolChange = Math.max(ind15m.volumeChangePercent, ind5m.volumeChangePercent);
  
  const confirmations: ConfirmationItem[] = isLongCandidate
    ? [
        {
          id: 'early_momentum',
          label: 'Fast Momentum Alignment',
          satisfied: ind15m.ema9 >= ind15m.ema21 || ind5m.ema9 > ind5m.ema21,
          detail: `15M EMA9 ($${formatPrice(ind15m.ema9)}) vs EMA21 ($${formatPrice(ind15m.ema21)})`,
        },
        {
          id: 'vwap_support',
          label: 'Price Above / Reclaiming VWAP',
          satisfied: price >= ind15m.vwap * 0.997,
          detail: `Price ($${formatPrice(price)}) vs 15M VWAP ($${formatPrice(ind15m.vwap)})`,
        },
        {
          id: 'volume_surge',
          label: 'Volume Surge Inflow',
          satisfied: maxVolChange >= 0,
          detail: `Volume ${maxVolChange >= 0 ? '+' : ''}${maxVolChange.toFixed(1)}% vs 20-period average`,
        },
        {
          id: 'rsi_acceleration',
          label: 'RSI Accumulation Sweet Spot',
          satisfied: ind15m.rsi >= 45 && ind15m.rsi <= 70,
          detail: `RSI (${ind15m.rsi.toFixed(1)}) in early breakout phase (not overbought)`,
        },
        {
          id: 'structure_support',
          label: 'Structure Holding Support',
          satisfied: price >= sr.nearestSupport * 0.995,
          detail: `Holding above immediate key support ($${formatPrice(sr.nearestSupport)})`,
        },
      ]
    : [
        {
          id: 'early_momentum_short',
          label: 'Fast Momentum Breakdown',
          satisfied: ind15m.ema9 <= ind15m.ema21 || ind5m.ema9 < ind5m.ema21,
          detail: `15M EMA9 ($${formatPrice(ind15m.ema9)}) vs EMA21 ($${formatPrice(ind15m.ema21)})`,
        },
        {
          id: 'vwap_resistance',
          label: 'Price Below VWAP Benchmark',
          satisfied: price <= ind15m.vwap * 1.003,
          detail: `Price ($${formatPrice(price)}) vs 15M VWAP ($${formatPrice(ind15m.vwap)})`,
        },
        {
          id: 'volume_surge_short',
          label: 'Volume Surge Outflow',
          satisfied: maxVolChange >= 0,
          detail: `Volume ${maxVolChange >= 0 ? '+' : ''}${maxVolChange.toFixed(1)}% vs 20-period average`,
        },
        {
          id: 'rsi_distribution',
          label: 'RSI Distribution Sweet Spot',
          satisfied: ind15m.rsi <= 55 && ind15m.rsi >= 30,
          detail: `RSI (${ind15m.rsi.toFixed(1)}) in active breakdown phase (not oversold)`,
        },
        {
          id: 'structure_resistance',
          label: 'Structure Below Resistance',
          satisfied: price <= sr.nearestResistance * 1.005,
          detail: `Trading below immediate resistance ($${formatPrice(sr.nearestResistance)})`,
        },
      ];

  const satisfiedCount = confirmations.filter(c => c.satisfied).length;

  let state: SignalState = 'NO_SETUP';
  if (score >= 68 && satisfiedCount >= 4) {
    state = isLongCandidate ? 'CONFIRMED_LONG' : 'CONFIRMED_SHORT';
  } else if (score >= 50 || satisfiedCount >= 3) {
    state = 'WAIT_FOR_CONFIRMATION';
  } else {
    state = 'NO_SETUP';
  }

  // Whale / Relative Liquidity Flow Resilience
  const isWhaleResilience =
    ind15m.mfi > 55 &&
    ind15m.buyPressurePercent > 53 &&
    maxVolChange > 15 &&
    price > ind15m.ema21;

  // Precise Entry, Pullback Zone, Target & Tight Stop-Loss calculations
  let entry = price;
  let sl = 0;
  let tp1 = 0;
  let tp2 = 0;
  let riskRewardRatio = 2.0;

  let entryZone: {
    min: number;
    max: number;
    optimalPullback: number;
    recommendedOrderType: 'LIMIT_PULLBACK' | 'MARKET_BREAKOUT';
  };
  let executionTip = '';
  let timingSignal: 'EARLY_TRIGGER' | 'PULLBACK_CONFIRMED' | 'BREAKOUT_MOMENTUM' = 'EARLY_TRIGGER';

  if (isLongCandidate) {
    // Optimal support zone (15m EMA 9 / VWAP / nearestSupport)
    const pullbackSupport = Math.max(ind15m.ema9, ind15m.vwap, sr.nearestSupport);
    const isOverextended = price > pullbackSupport * 1.015;

    const entryMin = Number(Math.min(pullbackSupport, price * 0.996).toFixed(6));
    const entryMax = Number(price.toFixed(6));
    const optimalPullback = Number(pullbackSupport.toFixed(6));

    if (isOverextended) {
      timingSignal = 'BREAKOUT_MOMENTUM';
      entryZone = {
        min: entryMin,
        max: Number((price * 0.998).toFixed(6)),
        optimalPullback,
        recommendedOrderType: 'LIMIT_PULLBACK',
      };
      executionTip = `⚠️ تنبيه توقيت الدخول: السعر صاعد حالياً عن نقطة الانطلاق بنسبة +${(((price - pullbackSupport) / pullbackSupport) * 100).toFixed(1)}%! لتجنب الانعكاس، ضع أمر شراء معلق (Limit Order) في منطقة إعادة الاختبار $${formatPrice(entryMin)} - $${formatPrice(price * 0.998)} لضمان أعلى نسبة نجاح وأفضل عائد إلى مخاطرة.`;
    } else if (Math.abs(price - pullbackSupport) / price < 0.005) {
      timingSignal = 'PULLBACK_CONFIRMED';
      entryZone = {
        min: entryMin,
        max: entryMax,
        optimalPullback,
        recommendedOrderType: 'MARKET_BREAKOUT',
      };
      executionTip = `⚡ دخول فوري مثالي: السعر يعيد اختبار دعم EMA9/VWAP عند $${formatPrice(price)}. توقيت دخول مباشر وممتاز مع مخاطرة منخفضة.`;
    } else {
      timingSignal = 'EARLY_TRIGGER';
      entryZone = {
        min: entryMin,
        max: entryMax,
        optimalPullback,
        recommendedOrderType: 'LIMIT_PULLBACK',
      };
      executionTip = `🚀 انطلاق اختراق مبكر: زخم الحركة بدأ للتو عند $${formatPrice(price)}. نطاق الدخول الموصى به: $${formatPrice(entryMin)} إلى $${formatPrice(entryMax)}.`;
    }

    // Tight Stop Loss placed under 15m swing low or ATR buffer (risk ~1.0% to 1.8% max)
    const tightAtr = Math.max(ind15m.atr * 1.2, price * 0.009);
    sl = Number(Math.min(price * 0.993, Math.max(sr.nearestSupport * 0.995, price - tightAtr)).toFixed(6));
    const risk = Math.max(price - sl, price * 0.008);
    tp1 = Number((price + risk * 1.5).toFixed(6));
    tp2 = Number((price + risk * 2.5).toFixed(6));
    riskRewardRatio = Number(((tp1 - price) / risk).toFixed(2));
  } else {
    // SHORT Candidate
    const pullbackResistance = Math.min(ind15m.ema9, ind15m.vwap, sr.nearestResistance);
    const isOverextendedShort = price < pullbackResistance * 0.985;

    const entryMin = Number(price.toFixed(6));
    const entryMax = Number(Math.max(pullbackResistance, price * 1.004).toFixed(6));
    const optimalPullback = Number(pullbackResistance.toFixed(6));

    if (isOverextendedShort) {
      timingSignal = 'BREAKOUT_MOMENTUM';
      entryZone = {
        min: Number((price * 1.002).toFixed(6)),
        max: entryMax,
        optimalPullback,
        recommendedOrderType: 'LIMIT_PULLBACK',
      };
      executionTip = `⚠️ تنبيه توقيت الدخول: السعر هابط حالياً عن نقطة الكسر! لتفادي ارتداد التصحيح، ضع أمر بيع معلق (Limit Short) بين $${formatPrice(price * 1.002)} و $${formatPrice(entryMax)}.`;
    } else if (Math.abs(pullbackResistance - price) / price < 0.005) {
      timingSignal = 'PULLBACK_CONFIRMED';
      entryZone = {
        min: entryMin,
        max: entryMax,
        optimalPullback,
        recommendedOrderType: 'MARKET_BREAKOUT',
      };
      executionTip = `⚡ دخول هبوطي مثالي: السعر يعيد اختبار مقاومة الكسر عند $${formatPrice(price)}. دخول مباشر مع وقف خسارة محكم.`;
    } else {
      timingSignal = 'EARLY_TRIGGER';
      entryZone = {
        min: entryMin,
        max: entryMax,
        optimalPullback,
        recommendedOrderType: 'LIMIT_PULLBACK',
      };
      executionTip = `🔻 كسر هبوطي مبكر: الزخم الهابط بدأ للتو عند $${formatPrice(price)}. نطاق الدخول المقترح: $${formatPrice(entryMin)} - $${formatPrice(entryMax)}.`;
    }

    const tightAtr = Math.max(ind15m.atr * 1.2, price * 0.009);
    sl = Number(Math.max(price * 1.007, Math.min(sr.nearestResistance * 1.005, price + tightAtr)).toFixed(6));
    const risk = Math.max(sl - price, price * 0.008);
    tp1 = Number((price - risk * 1.5).toFixed(6));
    tp2 = Number((price - risk * 2.5).toFixed(6));
    riskRewardRatio = Number(((price - tp1) / risk).toFixed(2));
  }

  // Setup Type classification
  let setupType: SetupType = 'None';
  if (isWhaleResilience && isLongCandidate) {
    setupType = 'Whale Resilience';
  } else if (timingSignal === 'PULLBACK_CONFIRMED') {
    setupType = 'Pullback Retest';
  } else if (timingSignal === 'EARLY_TRIGGER' || timingSignal === 'BREAKOUT_MOMENTUM') {
    setupType = 'Early Breakout';
  } else if (maxVolChange > 30) {
    setupType = 'Liquidity Expansion';
  } else {
    setupType = isLongCandidate ? 'Standard Long' : 'Standard Short';
  }

  // Reasons list (Why this setup?)
  const reasons: string[] = [];
  if (isLongCandidate) {
    reasons.push(`🚀 Early momentum: 15M EMA9 ($${formatPrice(ind15m.ema9)}) holding above EMA21 ($${formatPrice(ind15m.ema21)})`);
    if (price >= ind15m.vwap) reasons.push('Price consolidating above intraday Volume Weighted Average Price (VWAP)');
    if (maxVolChange > 10) reasons.push(`Volume surge (+${maxVolChange.toFixed(1)}% vs 20-period average) signalling early capital entry`);
    if (ind15m.rsi >= 45 && ind15m.rsi <= 68) reasons.push(`Healthy RSI momentum (${ind15m.rsi.toFixed(1)}) with substantial headroom before overbought levels`);
    if (mtf.alignedCount >= 3) reasons.push(`Multi-timeframe synchronization (${mtf.alignmentFraction} TFs aligned bullish)`);
    if (isWhaleResilience) reasons.push('High taker buy flow with strong institutional liquidity resilience');
  } else {
    reasons.push(`🔻 Bearish momentum shift: 15M EMA9 ($${formatPrice(ind15m.ema9)}) suppressed beneath EMA21 ($${formatPrice(ind15m.ema21)})`);
    if (price <= ind15m.vwap) reasons.push('Price trading beneath daily VWAP distribution line');
    if (maxVolChange > 10) reasons.push('Elevated seller participation expanding volume on down-ticks');
    if (ind15m.rsi <= 55) reasons.push(`Bearish RSI distribution (${ind15m.rsi.toFixed(1)}) with room to decline`);
    if (mtf.alignedCount >= 3) reasons.push(`Multi-timeframe synchronization (${mtf.alignmentFraction} TFs aligned bearish)`);
  }

  // Risks list
  const risks: string[] = [];
  if (isLongCandidate) {
    if (ind15m.rsi > 68) risks.push(`RSI (${ind15m.rsi.toFixed(1)}) approaching overbought; wait for pullback to $${formatPrice(entryZone.optimalPullback)}`);
    if (Math.abs(price - sr.nearestResistance) / price < 0.012) risks.push(`Immediate resistance zone within 1.2% ($${formatPrice(sr.nearestResistance)})`);
    if (mtf.alignedCount < 3) risks.push('Higher timeframes (1H/4H) not yet fully synchronized with 15M impulse');
  } else {
    if (ind15m.rsi < 32) risks.push(`RSI (${ind15m.rsi.toFixed(1)}) oversold; short-squeeze bounce possible`);
    if (Math.abs(price - sr.nearestSupport) / price < 0.012) risks.push(`Support cluster close at $${formatPrice(sr.nearestSupport)}`);
    if (mtf.alignedCount < 3) risks.push('Lower timeframe counter-trend volatility');
  }

  if (risks.length === 0) {
    risks.push('Execute strict stop-loss discipline; avoid market chasing if price moves past entry zone');
  }

  let relativeFlow: 'High Institutional Inflow' | 'Moderate Inflow' | 'Outflow / Distribution' | 'Balanced' = 'Balanced';
  if (ind15m.mfi > 65 && ind15m.buyPressurePercent > 55) relativeFlow = 'High Institutional Inflow';
  else if (ind15m.mfi > 52 && ind15m.buyPressurePercent >= 50) relativeFlow = 'Moderate Inflow';
  else if (ind15m.mfi < 40 || ind15m.buyPressurePercent < 45) relativeFlow = 'Outflow / Distribution';

  let category: 'PREMARKET_P' | 'STOCK_INDEX' | 'NEW_LISTING' | 'STANDARD_CRYPTO' = 'STANDARD_CRYPTO';
  const upper = symbol.toUpperCase();
  if (
    upper.endsWith('USDTP') ||
    upper.endsWith('P') ||
    upper.includes('NSDK') ||
    upper.includes('SNDK') ||
    upper.includes('SPX')
  ) {
    category = 'PREMARKET_P';
  } else if (
    [
      'PENGUUSDT', 'MOVEUSDT', 'THEUSDT', 'ACXUSDT', 'ORCAUSDT',
      'PNUTUSDT', 'ACTUSDT', 'MEUSDT', 'VIRTUALUSDT', 'AIUSDT',
      'COWUSDT', 'CETUSUSDT', 'KAIAUSDT', 'SCRUSDT', 'EIGENUSDT',
      'HMSTRUSDT', 'NEIROUSDT', 'TURBOUSDT', '1MBABYDOGEUSDT', 'CATIUSDT'
    ].includes(upper)
  ) {
    category = 'NEW_LISTING';
  }

  const isPToken = category === 'PREMARKET_P';
  const isStockToken = isPToken;

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
    category,
    isPToken,
    isStockToken,
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
    indicators: ind15m,
    mtf,
    confirmations,
    reasons,
    risks,
    liquidityFlow: {
      relativeFlow,
      moneyFlowScore: Math.round(ind15m.mfi),
      buyPressurePercent: Number(ind15m.buyPressurePercent.toFixed(1)),
      volumeExpansion: maxVolChange > 0,
      whaleResilience: isWhaleResilience,
    },
    entryZone,
    executionTip,
    timingSignal,
    leadTimeframe: '15m',
    lastUpdated: Date.now(),
  };
}

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.001) return p.toFixed(6);
  return p.toFixed(8);
}
