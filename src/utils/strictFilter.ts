import { StrictEntryEvaluation, StrictFilterSettings, TradingSetup } from '../types/crypto.ts';

export const STRICT_PRESETS: Record<
  'elite' | 'sniper' | 'explosive',
  Omit<StrictFilterSettings, 'enabled' | 'preset' | 'direction'>
> = {
  elite: {
    minScore: 75,
    minRiskReward: 2.0,
    minTp1ProfitPercent: 1.4,
    minTp2ProfitPercent: 2.4,
    maxSlRiskPercent: 3.5,
    max24hChangePercent: 5.0, // لا تزيد نسبة الارتفاع عن 5% لمنع الشراء في القمة
    min24hVolumeUsd: 10_000_000, // أدنى سيولة 10 مليون دولار
    requireConfirmedState: true,
    requireInsideEntryZone: true,
    requirePositiveFlow: true,
  },
  sniper: {
    minScore: 82,
    minRiskReward: 2.5,
    minTp1ProfitPercent: 1.8,
    minTp2ProfitPercent: 3.2,
    maxSlRiskPercent: 2.8,
    max24hChangePercent: 4.0, // قناص مبكر أقصى ارتفاع 4%
    min24hVolumeUsd: 15_000_000, // أدنى سيولة 15 مليون دولار
    requireConfirmedState: true,
    requireInsideEntryZone: true,
    requirePositiveFlow: true,
  },
  explosive: {
    minScore: 75,
    minRiskReward: 2.4,
    minTp1ProfitPercent: 2.2,
    minTp2ProfitPercent: 4.5,
    maxSlRiskPercent: 4.0,
    max24hChangePercent: 6.0,
    min24hVolumeUsd: 10_000_000,
    requireConfirmedState: true,
    requireInsideEntryZone: false,
    requirePositiveFlow: false,
  },
};

export const DEFAULT_STRICT_SETTINGS: StrictFilterSettings = {
  enabled: true,
  preset: 'elite',
  direction: 'ALL',
  ...STRICT_PRESETS.elite,
};

const STORAGE_KEY = 'sosska_strict_filter_settings';

export function loadStrictFilterSettings(): StrictFilterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STRICT_SETTINGS, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_STRICT_SETTINGS;
}

export function saveStrictFilterSettings(settings: StrictFilterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // quiet
  }
}

/**
 * Computes deep algorithmic entry evaluation for a setup based on strict profit & risk rules.
 */
export function evaluateStrictEntry(
  setup: TradingSetup,
  settings: StrictFilterSettings
): StrictEntryEvaluation {
  const isLong = setup.state === 'CONFIRMED_LONG';
  const isShort = setup.state === 'CONFIRMED_SHORT';
  const isConfirmed = isLong || isShort;

  const entry = setup.entry || setup.price;
  const tp1 = setup.tp1;
  const tp2 = setup.tp2;
  const sl = setup.sl;

  // Percentage calculations
  let tp1GainPercent = 0;
  let tp2GainPercent = 0;
  let slRiskPercent = 0;

  if (entry > 0) {
    if (isLong) {
      tp1GainPercent = ((tp1 - entry) / entry) * 100;
      tp2GainPercent = ((tp2 - entry) / entry) * 100;
      slRiskPercent = ((entry - sl) / entry) * 100;
    } else if (isShort) {
      tp1GainPercent = ((entry - tp1) / entry) * 100;
      tp2GainPercent = ((entry - tp2) / entry) * 100;
      slRiskPercent = ((sl - entry) / entry) * 100;
    } else {
      // Waiting / neutral estimation
      tp1GainPercent = Math.abs((tp1 - entry) / entry) * 100;
      tp2GainPercent = Math.abs((tp2 - entry) / entry) * 100;
      slRiskPercent = Math.abs((entry - sl) / entry) * 100;
    }
  }

  // Realized R:R (TP2 to SL)
  const realizedRR =
    slRiskPercent > 0
      ? Number((tp2GainPercent / slRiskPercent).toFixed(2))
      : setup.riskRewardRatio || 2.0;

  // Entry Zone status check
  let entryStatus: StrictEntryEvaluation['entryStatus'] = 'PERFECT_ZONE';
  const price = setup.price;

  if (setup.entryZone) {
    const { min, max } = setup.entryZone;
    if (isLong) {
      if (price <= max && price >= min * 0.995) {
        entryStatus = 'PERFECT_ZONE';
      } else if (price < min * 0.995) {
        entryStatus = 'PULLBACK_RETEST';
      } else if (price > max && price <= tp1 * 0.8) {
        entryStatus = 'MOMENTUM_BREAKOUT';
      } else {
        entryStatus = 'OUTSIDE_ZONE';
      }
    } else if (isShort) {
      if (price >= min && price <= max * 1.005) {
        entryStatus = 'PERFECT_ZONE';
      } else if (price > max * 1.005) {
        entryStatus = 'PULLBACK_RETEST';
      } else if (price < min && price >= tp1 * 1.2) {
        entryStatus = 'MOMENTUM_BREAKOUT';
      } else {
        entryStatus = 'OUTSIDE_ZONE';
      }
    }
  } else {
    // If no entryZone defined, estimate based on entry proximity
    const diffPercent = Math.abs((price - entry) / entry) * 100;
    if (diffPercent < 0.8) entryStatus = 'PERFECT_ZONE';
    else if (diffPercent < 1.8) entryStatus = 'PULLBACK_RETEST';
    else entryStatus = 'MOMENTUM_BREAKOUT';
  }

  // Reasons list for UI transparency
  const reasons: string[] = [];

  // Qualification checks
  let isQualified = true;

  // 1. Confirmed State
  if (settings.requireConfirmedState && !isConfirmed) {
    isQualified = false;
  } else if (isConfirmed) {
    reasons.push(isLong ? '🟢 اتجاه صاعد مؤكد (Long Confirmed)' : '🔴 اتجاه هابط مؤكد (Short Confirmed)');
  }

  // 2. Direction filter
  if (settings.direction === 'LONG_ONLY' && !isLong) isQualified = false;
  if (settings.direction === 'SHORT_ONLY' && !isShort) isQualified = false;

  // 3. Score
  if (setup.score < settings.minScore) {
    isQualified = false;
  } else {
    reasons.push(`⭐ سكور ممتاز (${setup.score}/100)`);
  }

  // 4. Profitability
  if (tp1GainPercent < settings.minTp1ProfitPercent || tp2GainPercent < settings.minTp2ProfitPercent) {
    isQualified = false;
  } else {
    reasons.push(`🎯 ربح مستهدف قوي (+${tp1GainPercent.toFixed(1)}% TP1 / +${tp2GainPercent.toFixed(1)}% TP2)`);
  }

  // 5. Risk:Reward
  if (realizedRR < settings.minRiskReward) {
    isQualified = false;
  } else {
    reasons.push(`⚖️ نسبة عائد لمخاطرة ممتازة (${realizedRR.toFixed(1)}:1 R:R)`);
  }

  // 6. Stop loss risk control
  if (slRiskPercent > settings.maxSlRiskPercent) {
    isQualified = false;
  } else if (slRiskPercent > 0) {
    reasons.push(`🛡️ وقف خسارة محكم وصارم (-${slRiskPercent.toFixed(1)}%)`);
  }

  // 7. Inside Entry Zone
  if (settings.requireInsideEntryZone && entryStatus === 'OUTSIDE_ZONE') {
    isQualified = false;
  }

  // 8. Positive Whale Flow / Money Flow
  if (settings.requirePositiveFlow) {
    const flow = setup.liquidityFlow;
    const hasFlow =
      (isLong && (flow.moneyFlowScore >= 48 || flow.whaleResilience || setup.indicators.mfi >= 48)) ||
      (isShort && (flow.moneyFlowScore <= 52 || setup.indicators.mfi <= 52));
    if (!hasFlow) {
      isQualified = false;
    } else {
      reasons.push('🐳 تدفق سيولة حيتان وزخم مؤكد');
    }
  }

  // 9. Anti-FOMO: Max 24h Change Ceiling (تحديد نسبة الارتفاع لا تزيد عن 5% منعاً للشراء بعد الارتفاع)
  const current24hChange = setup.change24h;
  let isWithinPumpLimit = true;

  if (isLong) {
    // For Long setups, price shouldn't have already pumped more than max24hChangePercent (e.g. 5%)
    if (current24hChange > settings.max24hChangePercent) {
      isWithinPumpLimit = false;
      isQualified = false;
    } else {
      reasons.push(
        `🚀 ارتفاع مبكر آمن (${current24hChange >= 0 ? '+' : ''}${current24hChange.toFixed(1)}% ≤ ${settings.max24hChangePercent}%) منعاً للشراء في القمة`
      );
    }
  } else if (isShort) {
    // For Short setups, avoid chasing a coin that already dumped deeply beyond the limit
    if (current24hChange < -settings.max24hChangePercent) {
      isWithinPumpLimit = false;
      isQualified = false;
    } else {
      reasons.push(
        `📉 هبوط مبكر آمن (${current24hChange >= 0 ? '+' : ''}${current24hChange.toFixed(1)}% ≥ -${settings.max24hChangePercent}%) منعاً للبيع في القاع`
      );
    }
  } else {
    if (Math.abs(current24hChange) > settings.max24hChangePercent) {
      isWithinPumpLimit = false;
      isQualified = false;
    }
  }

  // 10. Liquidity Threshold (تحديد السيولة الكافية لمنع العملات الميتة أو عالية الانزلاق)
  const volumeUsd = setup.quoteVolume24h || 0;
  let hasSufficientLiquidity = true;
  if (settings.min24hVolumeUsd && settings.min24hVolumeUsd > 0) {
    if (volumeUsd < settings.min24hVolumeUsd) {
      hasSufficientLiquidity = false;
      isQualified = false;
    } else {
      const volM = (volumeUsd / 1_000_000).toFixed(1);
      const reqM = (settings.min24hVolumeUsd / 1_000_000).toFixed(0);
      reasons.push(`💧 سيولة تداول كافية وعالية ($${volM}M ≥ $${reqM}M)`);
    }
  }

  // Strict Grade
  let strictGrade: StrictEntryEvaluation['strictGrade'] = 'A_STANDARD';
  if (setup.score >= 85 && realizedRR >= 2.4 && tp2GainPercent >= 3.0 && isWithinPumpLimit) {
    strictGrade = 'AAA_ELITE';
  } else if (setup.score >= 78 && realizedRR >= 2.0) {
    strictGrade = 'AA_STRONG';
  }

  return {
    isQualified,
    tp1GainPercent: Number(tp1GainPercent.toFixed(2)),
    tp2GainPercent: Number(tp2GainPercent.toFixed(2)),
    slRiskPercent: Number(slRiskPercent.toFixed(2)),
    realizedRR,
    current24hChange,
    volumeUsd,
    isWithinPumpLimit,
    hasSufficientLiquidity,
    entryStatus,
    strictGrade,
    reasons,
  };
}
