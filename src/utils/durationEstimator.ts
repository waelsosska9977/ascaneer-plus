import { TradingSetup } from '../types/crypto.ts';

export interface TradeDurationEstimate {
  tp1HoursMin: number;
  tp1HoursMax: number;
  tp1HoursAvg: number;
  tp1Text: string; // e.g. "2 - 4 ساعات"
  tp2HoursMin: number;
  tp2HoursMax: number;
  tp2HoursAvg: number;
  tp2Text: string; // e.g. "5 - 8 ساعات"
  speedCategory: 'FAST' | 'MEDIUM' | 'SWING';
  speedCategoryArabic: string;
  speedBadgeColor: string;
  hourlyVelocityPercent: number;
  targetGainTP1Percent: number;
  targetGainTP2Percent: number;
}

/**
 * Calculates estimated realistic duration in hours for a setup to reach TP1 and TP2 / complete the trade.
 * Based on price distance %, ATR volatility, MTF alignment, volume expansion, and whale momentum.
 */
export function estimateTradeDuration(setup: TradingSetup): TradeDurationEstimate {
  const entry = setup.entry || setup.price;
  const isLong = setup.state === 'CONFIRMED_LONG';
  const isShort = setup.state === 'CONFIRMED_SHORT';

  // Calculate target distances in percentage
  let tp1Gain = 0;
  let tp2Gain = 0;

  if (entry > 0) {
    if (isLong) {
      tp1Gain = Math.max(0.5, ((setup.tp1 - entry) / entry) * 100);
      tp2Gain = Math.max(tp1Gain + 0.8, ((setup.tp2 - entry) / entry) * 100);
    } else if (isShort) {
      tp1Gain = Math.max(0.5, ((entry - setup.tp1) / entry) * 100);
      tp2Gain = Math.max(tp1Gain + 0.8, ((entry - setup.tp2) / entry) * 100);
    } else {
      tp1Gain = Math.abs((setup.tp1 - entry) / entry) * 100 || 1.4;
      tp2Gain = Math.abs((setup.tp2 - entry) / entry) * 100 || 2.4;
    }
  } else {
    tp1Gain = 1.4;
    tp2Gain = 2.4;
  }

  // Base hourly move rate from ATR or default 0.45%
  const atr = setup.indicators?.atr || 0;
  const atrPercent = setup.price > 0 && atr > 0 ? (atr / setup.price) * 100 : 0.6;

  // Hourly velocity rate (% moved per hour in the trade direction)
  let hourlyVelocity = Math.max(0.32, atrPercent * 0.58);

  // Score boost: high quality setups have stronger momentum
  if (setup.score >= 85) hourlyVelocity *= 1.25;
  else if (setup.score >= 78) hourlyVelocity *= 1.12;

  // Liquidity and volume acceleration
  if (setup.liquidityFlow?.volumeExpansion) hourlyVelocity *= 1.15;
  if (setup.setupType === 'Whale Resilience' || setup.liquidityFlow?.whaleResilience) {
    hourlyVelocity *= 1.2;
  }

  // Lead timeframe adjustments
  if (setup.leadTimeframe === '5m' || setup.leadTimeframe === '15m') {
    hourlyVelocity *= 1.15;
  }

  // Calculate hours for TP1
  const tp1Min = Math.max(1, Math.round(tp1Gain / (hourlyVelocity * 1.35)));
  const tp1Max = Math.max(tp1Min + 1, Math.round(tp1Gain / (hourlyVelocity * 0.72)));
  const tp1Avg = Number(((tp1Min + tp1Max) / 2).toFixed(1));

  // Calculate hours for TP2 (Full completion of the trade)
  const tp2Min = Math.max(tp1Min + 2, Math.round(tp2Gain / (hourlyVelocity * 1.3)));
  const tp2Max = Math.max(tp2Min + 2, Math.round(tp2Gain / (hourlyVelocity * 0.7)));
  const tp2Avg = Number(((tp2Min + tp2Max) / 2).toFixed(1));

  // Determine speed category
  let speedCategory: 'FAST' | 'MEDIUM' | 'SWING' = 'MEDIUM';
  let speedCategoryArabic = '⏱️ يومية (خلال ساعات)';
  let speedBadgeColor = 'text-cyan-400 bg-cyan-950/80 border-cyan-800';

  if (tp2Max <= 6) {
    speedCategory = 'FAST';
    speedCategoryArabic = '⚡ سريعة ومباشرة (1 - 4 س)';
    speedBadgeColor = 'text-amber-400 bg-amber-950/80 border-amber-800';
  } else if (tp2Max <= 14) {
    speedCategory = 'MEDIUM';
    speedCategoryArabic = '⏱️ صفقة يومية (~5 - 10 س)';
    speedBadgeColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
  } else {
    speedCategory = 'SWING';
    speedCategoryArabic = '📅 سوينغ ممتد (12 - 24+ س)';
    speedBadgeColor = 'text-purple-400 bg-purple-950/80 border-purple-800';
  }

  return {
    tp1HoursMin: tp1Min,
    tp1HoursMax: tp1Max,
    tp1HoursAvg: tp1Avg,
    tp1Text: `${tp1Min} - ${tp1Max} ساعات`,
    tp2HoursMin: tp2Min,
    tp2HoursMax: tp2Max,
    tp2HoursAvg: tp2Avg,
    tp2Text: `${tp2Min} - ${tp2Max} ساعات`,
    speedCategory,
    speedCategoryArabic,
    speedBadgeColor,
    hourlyVelocityPercent: Number(hourlyVelocity.toFixed(2)),
    targetGainTP1Percent: Number(tp1Gain.toFixed(2)),
    targetGainTP2Percent: Number(tp2Gain.toFixed(2)),
  };
}
