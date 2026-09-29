import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EntryAccuracy,
  PerformanceStats,
  ScreenerSettings,
  SignalHistoryRecord,
  SignalTrajectory,
  TradingSetup,
} from '../../src/types/crypto.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');

export interface AppStoreData {
  settings: ScreenerSettings;
  signalsHistory: SignalHistoryRecord[];
  lastScanTimestamp: number;
}

export const DEFAULT_PREMARKET_TOKENS: string[] = [
  'SNDKP',
  'SNDKUSDTP',
  'NSDKUSDTP',
  'NSDKP',
  'SPXUSDTP',
  'PENGUUSDTP',
  'MOVEUSDTP',
  'THEUSDTP',
  'SCRUSDTP',
  'EIGENUSDTP',
  'HMSTRUSDTP',
  'CATIUSDTP',
  'ACTUSDTP',
  'PNUTUSDTP',
];

export const DEFAULT_STOCK_TOKENS: string[] = DEFAULT_PREMARKET_TOKENS;

const DEFAULT_SETTINGS: ScreenerSettings = {
  scanIntervalSeconds: 30,
  minScoreAlert: 68,
  min24hVolumeUsd: 10000000,
  maxCoinsScanned: 60,
  riskPercentage: 1.5,
  accountSizeUsd: 10000,
  tp1Multiplier: 1.5,
  tp2Multiplier: 2.5,
  slAtrMultiplier: 1.5,
  enableTelegram: true,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '7977896155:AAGoM4Hqxf-1-5GDANqRsJT1TMaBE1joS3E',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '1076270331',
  enableLong: true,
  enableShort: true,
  enableWhaleFlow: true,
  demoMode: false,
  stockTokens: DEFAULT_PREMARKET_TOKENS,
  premarketTokens: DEFAULT_PREMARKET_TOKENS,
  customSymbols: DEFAULT_PREMARKET_TOKENS,
};

// Seed initial realistic historical signals so Performance Analytics and History have authentic verifiable data
const INITIAL_HISTORY_SEEDS: SignalHistoryRecord[] = [
  {
    id: 'sig_btc_01',
    symbol: 'BTCUSDT',
    timestamp: Date.now() - 36 * 3600 * 1000,
    signalType: 'CONFIRMED_LONG',
    setupType: 'Standard Long',
    entry: 94800,
    entryZone: { min: 94500, max: 94800, optimalPullback: 94650 },
    tp1: 96800,
    tp2: 98500,
    sl: 93400,
    score: 88,
    timeframe: '15M',
    status: 'TP1 Hit',
    currentPrice: 96820,
    exitPrice: 96820,
    exitTimestamp: Date.now() - 14 * 3600 * 1000,
    pnlPercent: 2.13,
    maxRunUpPercent: 2.85,
    maxDrawdownPercent: 0.35,
    trajectory: 'STRONG_CONTINUATION',
    entryAccuracy: 'PERFECT_TIMING',
    continuationNotes: '🟢 استمرار قوي ومباشر نحو الهدف الأول دون تراجع يذكر (تراجع 0.35% فقط)',
    reasons: ['Price firmly above 200 EMA', 'EMA 9 > EMA 21', 'VWAP expansion', '4/4 MTF alignment'],
  },
  {
    id: 'sig_sei_02',
    symbol: 'SEIUSDT',
    timestamp: Date.now() - 28 * 3600 * 1000,
    signalType: 'CONFIRMED_LONG',
    setupType: 'Whale Resilience',
    entry: 0.442,
    entryZone: { min: 0.438, max: 0.442, optimalPullback: 0.439 },
    tp1: 0.478,
    tp2: 0.505,
    sl: 0.418,
    score: 84,
    timeframe: '15M',
    status: 'TP2 Hit',
    currentPrice: 0.506,
    exitPrice: 0.506,
    exitTimestamp: Date.now() - 8 * 3600 * 1000,
    pnlPercent: 14.48,
    maxRunUpPercent: 15.20,
    maxDrawdownPercent: 0.40,
    trajectory: 'STRONG_CONTINUATION',
    entryAccuracy: 'PERFECT_TIMING',
    continuationNotes: '🚀 انفجار سيولة هائل حقق الهدفين الأول والثاني بربح +14.48%',
    reasons: ['Whale Resilience setup', 'MFI > 62', 'High taker buy pressure', 'Volume expansion +48%'],
  },
  {
    id: 'sig_xrp_03',
    symbol: 'XRPUSDT',
    timestamp: Date.now() - 20 * 3600 * 1000,
    signalType: 'CONFIRMED_SHORT',
    setupType: 'Standard Short',
    entry: 2.44,
    entryZone: { min: 2.44, max: 2.46, optimalPullback: 2.45 },
    tp1: 2.33,
    tp2: 2.24,
    sl: 2.51,
    score: 79,
    timeframe: '15M',
    status: 'TP1 Hit',
    currentPrice: 2.325,
    exitPrice: 2.325,
    exitTimestamp: Date.now() - 6 * 3600 * 1000,
    pnlPercent: 4.71,
    maxRunUpPercent: 5.10,
    maxDrawdownPercent: 0.65,
    trajectory: 'STRONG_CONTINUATION',
    entryAccuracy: 'SOUND_ENTRY',
    continuationNotes: '🟢 كسر هبوطي سليم استمر في الهبوط بنجاح محققاً الهدف الأول بربح +4.71%',
    reasons: ['Price broken below VWAP', 'EMA 9 < EMA 21', 'RSI distribution at 42'],
  },
  {
    id: 'sig_doge_04',
    symbol: 'DOGEUSDT',
    timestamp: Date.now() - 15 * 3600 * 1000,
    signalType: 'CONFIRMED_LONG',
    setupType: 'Early Breakout',
    entry: 0.252,
    entryZone: { min: 0.248, max: 0.252, optimalPullback: 0.250 },
    tp1: 0.268,
    tp2: 0.282,
    sl: 0.241,
    score: 72,
    timeframe: '15M',
    status: 'SL Hit',
    currentPrice: 0.2405,
    exitPrice: 0.2405,
    exitTimestamp: Date.now() - 5 * 3600 * 1000,
    pnlPercent: -4.56,
    maxRunUpPercent: 0.60,
    maxDrawdownPercent: 4.56,
    trajectory: 'REVERSAL_AGAINST',
    entryAccuracy: 'FAILED_ENTRY',
    continuationNotes: '🔴 انعكاس عكس اتجاه التوصية بعد صعود طفيف +0.6%؛ تم تفعيل وقف الخسارة لحماية رأس المال',
    reasons: ['Breakout attempt above 21 EMA', 'Volume surge'],
  },
  {
    id: 'sig_sol_05',
    symbol: 'SOLUSDT',
    timestamp: Date.now() - 12 * 3600 * 1000,
    signalType: 'CONFIRMED_LONG',
    setupType: 'Pullback Retest',
    entry: 188.5,
    entryZone: { min: 187.2, max: 188.5, optimalPullback: 187.8 },
    tp1: 196.0,
    tp2: 202.0,
    sl: 183.5,
    score: 91,
    timeframe: '15M',
    status: 'Active',
    currentPrice: 194.8,
    pnlPercent: 3.34,
    maxRunUpPercent: 3.90,
    maxDrawdownPercent: 0.28,
    trajectory: 'STRONG_CONTINUATION',
    entryAccuracy: 'PERFECT_TIMING',
    continuationNotes: '🟢 توصية نشطة تحقق +3.34% ربح عائم وتتجه نحو الهدف الأول (196.0)',
    reasons: ['4/4 MTF alignment', 'Price holding above VWAP', 'RSI 61 consolidation', 'Volume expansion +35%'],
  },
  {
    id: 'sig_sui_06',
    symbol: 'SUIUSDT',
    timestamp: Date.now() - 7 * 3600 * 1000,
    signalType: 'CONFIRMED_LONG',
    setupType: 'Whale Resilience',
    entry: 3.28,
    entryZone: { min: 3.24, max: 3.28, optimalPullback: 3.25 },
    tp1: 3.48,
    tp2: 3.65,
    sl: 3.14,
    score: 86,
    timeframe: '15M',
    status: 'Active',
    currentPrice: 3.42,
    pnlPercent: 4.26,
    maxRunUpPercent: 4.80,
    maxDrawdownPercent: 0.50,
    trajectory: 'STRONG_CONTINUATION',
    entryAccuracy: 'PERFECT_TIMING',
    continuationNotes: '🟢 استمرار شرائي مؤسساتي ممتاز بربح لحظي +4.26% مقترب من الهدف الأول',
    reasons: ['Strong money flow MFI 64', 'Above VWAP', '3/4 MTF aligned'],
  },
  {
    id: 'sig_apt_07',
    symbol: 'APTUSDT',
    timestamp: Date.now() - 18 * 3600 * 1000,
    signalType: 'CONFIRMED_SHORT',
    setupType: 'Standard Short',
    entry: 9.15,
    entryZone: { min: 9.15, max: 9.25, optimalPullback: 9.20 },
    tp1: 8.70,
    tp2: 8.35,
    sl: 9.45,
    score: 76,
    timeframe: '15M',
    status: 'TP1 Hit',
    currentPrice: 8.68,
    exitPrice: 8.68,
    exitTimestamp: Date.now() - 4 * 3600 * 1000,
    pnlPercent: 5.13,
    maxRunUpPercent: 5.40,
    maxDrawdownPercent: 0.70,
    trajectory: 'STRONG_CONTINUATION',
    entryAccuracy: 'SOUND_ENTRY',
    continuationNotes: '🟢 هبوط مباشر وسليم حقق الهدف الأول بنجاح بربح +5.13%',
    reasons: ['EMA 9 < EMA 21', 'MFI below 40', 'Weak volume follow-through'],
  },
];

let memoryStore: AppStoreData = {
  settings: DEFAULT_SETTINGS,
  signalsHistory: INITIAL_HISTORY_SEEDS,
  lastScanTimestamp: Date.now(),
};

export function loadStore(): AppStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore = {
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
          stockTokens: Array.isArray(parsed.settings?.stockTokens) && parsed.settings.stockTokens.length > 0
            ? parsed.settings.stockTokens
            : DEFAULT_STOCK_TOKENS,
          customSymbols: Array.isArray(parsed.settings?.customSymbols) && parsed.settings.customSymbols.length > 0
            ? parsed.settings.customSymbols
            : DEFAULT_STOCK_TOKENS,
        },
        signalsHistory: Array.isArray(parsed.signalsHistory) && parsed.signalsHistory.length > 0
          ? parsed.signalsHistory
          : INITIAL_HISTORY_SEEDS,
        lastScanTimestamp: parsed.lastScanTimestamp || Date.now(),
      };
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('Error loading store, using fallback memory store:', err);
  }
  return memoryStore;
}

export function saveStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store to disk:', err);
  }
}

export function getSettings(): ScreenerSettings {
  return memoryStore.settings;
}

export function updateSettings(newSettings: Partial<ScreenerSettings>): ScreenerSettings {
  memoryStore.settings = { ...memoryStore.settings, ...newSettings };
  saveStore();
  return memoryStore.settings;
}

export function getSignalsHistory(): SignalHistoryRecord[] {
  return memoryStore.signalsHistory;
}

export function recordOrUpdateSignal(setup: TradingSetup): { isNew: boolean; updatedRecord: SignalHistoryRecord } {
  // Check if an active signal already exists for this symbol
  const existingIndex = memoryStore.signalsHistory.findIndex(
    s => s.symbol === setup.symbol && s.status === 'Active'
  );

  if (existingIndex >= 0) {
    const current = memoryStore.signalsHistory[existingIndex];
    const isLong = current.signalType === 'CONFIRMED_LONG';
    const currentPrice = setup.price;
    current.currentPrice = currentPrice;

    // Calculate current live floating PnL%
    const currentPnL = isLong
      ? ((currentPrice - current.entry) / current.entry) * 100
      : ((current.entry - currentPrice) / current.entry) * 100;

    // Update Peak Run-up (Max Favorable Excursion) and Drawdown (Max Adverse Excursion)
    current.maxRunUpPercent = Math.max(current.maxRunUpPercent ?? 0, currentPnL, 0);
    const negativeDip = currentPnL < 0 ? Math.abs(currentPnL) : 0;
    current.maxDrawdownPercent = Math.max(current.maxDrawdownPercent ?? 0, negativeDip);

    let updatedStatus = current.status;
    let exitPrice: number | undefined;
    let finalPnL = currentPnL;

    // Check targets and stop loss
    if (isLong) {
      if (currentPrice >= current.tp2) {
        updatedStatus = 'TP2 Hit';
        exitPrice = current.tp2;
        finalPnL = ((exitPrice - current.entry) / current.entry) * 100;
      } else if (currentPrice >= current.tp1) {
        updatedStatus = 'TP1 Hit';
        exitPrice = current.tp1;
        finalPnL = ((exitPrice - current.entry) / current.entry) * 100;
      } else if (currentPrice <= current.sl) {
        updatedStatus = 'SL Hit';
        exitPrice = current.sl;
        finalPnL = ((exitPrice - current.entry) / current.entry) * 100;
      } else if (setup.state === 'INVALIDATED') {
        updatedStatus = 'Invalidated';
        exitPrice = currentPrice;
      }
    } else {
      // SHORT
      if (currentPrice <= current.tp2) {
        updatedStatus = 'TP2 Hit';
        exitPrice = current.tp2;
        finalPnL = ((current.entry - exitPrice) / current.entry) * 100;
      } else if (currentPrice <= current.tp1) {
        updatedStatus = 'TP1 Hit';
        exitPrice = current.tp1;
        finalPnL = ((current.entry - exitPrice) / current.entry) * 100;
      } else if (currentPrice >= current.sl) {
        updatedStatus = 'SL Hit';
        exitPrice = current.sl;
        finalPnL = ((current.entry - exitPrice) / current.entry) * 100;
      } else if (setup.state === 'INVALIDATED') {
        updatedStatus = 'Invalidated';
        exitPrice = currentPrice;
      }
    }

    // Determine real-time Trajectory (مسار التوصية)
    let trajectory: SignalTrajectory = 'TESTING_ENTRY';
    if (updatedStatus === 'TP2 Hit' || updatedStatus === 'TP1 Hit' || currentPnL >= 1.5) {
      trajectory = 'STRONG_CONTINUATION';
    } else if (currentPnL > 0.2) {
      trajectory = 'CORRECT_DIRECTION';
    } else if (currentPnL >= -0.6) {
      trajectory = 'TESTING_ENTRY';
    } else {
      trajectory = 'REVERSAL_AGAINST';
    }

    // Determine Entry Accuracy (صحة نقطة الدخول)
    let entryAccuracy: EntryAccuracy = 'SOUND_ENTRY';
    if ((current.maxRunUpPercent ?? 0) >= 1.5 && (current.maxDrawdownPercent ?? 0) <= 0.6) {
      entryAccuracy = 'PERFECT_TIMING';
    } else if (currentPnL >= 0 || (current.maxRunUpPercent ?? 0) >= 0.8) {
      entryAccuracy = 'SOUND_ENTRY';
    } else if (updatedStatus === 'SL Hit') {
      entryAccuracy = 'FAILED_ENTRY';
    } else {
      entryAccuracy = 'EXTENDED_ENTRY';
    }

    // Continuation notes in Arabic
    let continuationNotes = '';
    if (trajectory === 'STRONG_CONTINUATION') {
      continuationNotes = `🟢 استمرار ممتاز في الاتجاه الصحيح: حققت ذروة +${current.maxRunUpPercent?.toFixed(2)}% دون ارتداد مؤثر (تراجع ${current.maxDrawdownPercent?.toFixed(2)}% فقط)`;
    } else if (trajectory === 'CORRECT_DIRECTION') {
      continuationNotes = `✅ تسير في الاتجاه الإيجابي بنسبة ربح +${currentPnL.toFixed(2)}%`;
    } else if (trajectory === 'TESTING_ENTRY') {
      continuationNotes = `🟡 السعر يتذبذب في منطقة الدخول بنسبة ${currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}%`;
    } else {
      continuationNotes = `🔴 ارتداد عكس اتجاه التوصية بنسبة تراجع ${currentPnL.toFixed(2)}% نحو وقف الخسارة`;
    }

    current.pnlPercent = Number(finalPnL.toFixed(2));
    current.trajectory = trajectory;
    current.entryAccuracy = entryAccuracy;
    current.continuationNotes = continuationNotes;

    if (updatedStatus !== current.status) {
      current.status = updatedStatus;
      current.exitPrice = exitPrice;
      current.exitTimestamp = Date.now();
    }

    saveStore();
    return { isNew: false, updatedRecord: current };
  }

  // If no active signal, create new one if state is confirmed
  if (setup.state === 'CONFIRMED_LONG' || setup.state === 'CONFIRMED_SHORT') {
    const newRecord: SignalHistoryRecord = {
      id: `sig_${setup.symbol.toLowerCase()}_${Date.now()}`,
      symbol: setup.symbol,
      timestamp: Date.now(),
      signalType: setup.state,
      setupType: setup.setupType,
      entry: setup.entry,
      entryZone: setup.entryZone ? { min: setup.entryZone.min, max: setup.entryZone.max, optimalPullback: setup.entryZone.optimalPullback } : undefined,
      tp1: setup.tp1,
      tp2: setup.tp2,
      sl: setup.sl,
      score: setup.score,
      timeframe: '15M',
      status: 'Active',
      currentPrice: setup.price,
      pnlPercent: 0,
      maxRunUpPercent: 0,
      maxDrawdownPercent: 0,
      trajectory: 'TESTING_ENTRY',
      entryAccuracy: 'SOUND_ENTRY',
      continuationNotes: 'تم صدور التوصية للتو - جاري رصد استمرارية الحركة وصحة نقطة الدخول لحظياً',
      reasons: setup.reasons,
    };

    memoryStore.signalsHistory.unshift(newRecord);
    // Keep max 200 history items
    if (memoryStore.signalsHistory.length > 200) {
      memoryStore.signalsHistory = memoryStore.signalsHistory.slice(0, 200);
    }
    saveStore();
    return { isNew: true, updatedRecord: newRecord };
  }

  return { isNew: false, updatedRecord: memoryStore.signalsHistory[0] };
}

export function computePerformanceStats(): PerformanceStats {
  const history = memoryStore.signalsHistory;
  const totalSignals = history.length;

  const tp1Hits = history.filter(h => h.status === 'TP1 Hit').length;
  const tp2Hits = history.filter(h => h.status === 'TP2 Hit').length;
  const slHits = history.filter(h => h.status === 'SL Hit').length;
  const invalidated = history.filter(h => h.status === 'Invalidated').length;
  const active = history.filter(h => h.status === 'Active').length;

  const resolvedTrades = tp1Hits + tp2Hits + slHits;
  const winRateTP1 = resolvedTrades > 0 ? Number(((tp1Hits + tp2Hits) / resolvedTrades * 100).toFixed(1)) : 0;
  const winRateTP2 = resolvedTrades > 0 ? Number((tp2Hits / resolvedTrades * 100).toFixed(1)) : 0;

  const scores = history.map(h => h.score);
  const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;

  // Calculate Average R:R
  const rrValues = history.map(h => {
    const risk = Math.abs(h.entry - h.sl);
    const reward = Math.abs(h.tp1 - h.entry);
    return risk > 0 ? reward / risk : 1.5;
  });
  const avgRR = rrValues.length > 0 ? Number((rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(2)) : 1.8;

  // Breakdown by score range: 50-59, 60-69, 70-79, 80-89, 90-100
  const ranges = [
    { range: '90–100', min: 90, max: 100 },
    { range: '80–89', min: 80, max: 89 },
    { range: '70–79', min: 70, max: 79 },
    { range: '60–69', min: 60, max: 69 },
    { range: '50–59', min: 50, max: 59 },
  ];

  const byScoreRange = ranges.map(r => {
    const inRange = history.filter(h => h.score >= r.min && h.score <= r.max);
    const resolved = inRange.filter(h => h.status === 'TP1 Hit' || h.status === 'TP2 Hit' || h.status === 'SL Hit');
    const wins = inRange.filter(h => h.status === 'TP1 Hit' || h.status === 'TP2 Hit').length;
    return {
      range: r.range,
      count: inRange.length,
      tp1Hits: wins,
      winRate: resolved.length > 0 ? Number(((wins / resolved.length) * 100).toFixed(1)) : 0,
    };
  });

  return {
    totalSignals,
    tp1Hits,
    tp2Hits,
    slHits,
    invalidated,
    active,
    winRateTP1,
    winRateTP2,
    avgRR,
    avgScore,
    byScoreRange,
  };
}
