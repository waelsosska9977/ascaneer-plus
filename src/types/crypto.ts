export type SignalState = 
  | 'CONFIRMED_LONG'
  | 'CONFIRMED_SHORT'
  | 'WAIT_FOR_CONFIRMATION'
  | 'NO_SETUP'
  | 'INVALIDATED';

export type SetupType =
  | 'Standard Long'
  | 'Standard Short'
  | 'Whale Resilience'
  | 'Liquidity Expansion'
  | 'Mean Reversion'
  | 'None';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades?: number;
  quoteVolume?: number;
  takerBuyBaseVolume?: number;
}

export interface TechnicalIndicators {
  ema9: number;
  ema21: number;
  ema200: number;
  vwap: number;
  rsi: number;
  mfi: number;
  stochK: number;
  stochD: number;
  atr: number;
  currentVolume: number;
  avgVolume20: number;
  volumeChangePercent: number;
  priceVsVwap: 'above' | 'below';
  emaTrend: 'bullish' | 'bearish' | 'neutral';
  stochSignal: 'oversold' | 'overbought' | 'bullish_cross' | 'bearish_cross' | 'neutral';
  buyPressurePercent: number; // Taker buy volume ratio
}

export interface TimeframeSignal {
  timeframe: '5m' | '15m' | '1h' | '4h';
  trend: 'bullish' | 'bearish' | 'neutral';
  emaBullish: boolean;
  vwapBullish: boolean;
  rsi: number;
  volumeBullish: boolean;
  score: number;
}

export interface MTFAnalysis {
  tf5m: TimeframeSignal;
  tf15m: TimeframeSignal;
  tf1h: TimeframeSignal;
  tf4h: TimeframeSignal;
  alignedCount: number; // e.g. 4
  totalCount: 4;
  alignmentFraction: string; // "4/4"
  overallAlignment: 'Strong Bullish' | 'Strong Bearish' | 'Mixed' | 'Neutral';
}

export interface ScoreBreakdown {
  trendScore: number;     // max 20
  emaScore: number;       // max 20
  vwapScore: number;      // max 15
  volumeScore: number;    // max 15
  rsiScore: number;       // max 10
  momentumScore: number;  // max 10
  mtfScore: number;       // max 10
  totalScore: number;     // 0 - 100
  scoreLabel: 'Strong Setup' | 'Moderate Setup' | 'Developing' | 'Weak / No Setup';
}

export interface ConfirmationItem {
  id: string;
  label: string;
  satisfied: boolean;
  detail: string;
}

export interface TradingSetup {
  symbol: string;
  baseAsset: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  state: SignalState;
  setupType: SetupType;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  riskRewardRatio: number;
  nearestSupport: number;
  majorSupport: number;
  nearestResistance: number;
  majorResistance: number;
  indicators: TechnicalIndicators;
  mtf: MTFAnalysis;
  confirmations: ConfirmationItem[];
  reasons: string[];
  risks: string[];
  liquidityFlow: {
    relativeFlow: 'High Institutional Inflow' | 'Moderate Inflow' | 'Outflow / Distribution' | 'Balanced';
    moneyFlowScore: number;
    buyPressurePercent: number;
    volumeExpansion: boolean;
    whaleResilience: boolean;
  };
  lastUpdated: number;
}

export interface MarketOverview {
  status: 'Market Bullish' | 'Market Bearish' | 'Mixed Market';
  totalCoinsScanned: number;
  longSetupsCount: number;
  shortSetupsCount: number;
  waitingCount: number;
  highVolumeCount: number;
  whaleSetupsCount: number;
  btcDominance: number;
  btcPrice: number;
  lastScanTimestamp: number;
  nextScanTimestamp: number;
  scannerActive: boolean;
  dataProviderStatus: 'LIVE' | 'DELAYED' | 'DEMO';
}

export interface SignalHistoryRecord {
  id: string;
  symbol: string;
  timestamp: number;
  signalType: SignalState;
  setupType: SetupType;
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  score: number;
  timeframe: string;
  status: 'Active' | 'TP1 Hit' | 'TP2 Hit' | 'SL Hit' | 'Invalidated';
  currentPrice?: number;
  exitPrice?: number;
  exitTimestamp?: number;
  pnlPercent?: number;
  reasons: string[];
}

export interface PerformanceStats {
  totalSignals: number;
  tp1Hits: number;
  tp2Hits: number;
  slHits: number;
  invalidated: number;
  active: number;
  winRateTP1: number;
  winRateTP2: number;
  avgRR: number;
  avgScore: number;
  byScoreRange: {
    range: string;
    count: number;
    tp1Hits: number;
    winRate: number;
  }[];
}

export interface BacktestTrade {
  id: string;
  entryTimestamp: number;
  exitTimestamp: number;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  tp1: number;
  tp2: number;
  sl: number;
  score: number;
  outcome: 'TP1 Hit' | 'TP2 Hit' | 'SL Hit' | 'Timed Out';
  pnlPercent: number;
  rMultiple: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: string;
  candleCount: number;
  totalSetups: number;
  tp1Hits: number;
  tp2Hits: number;
  slHits: number;
  winRateTP1: number;
  winRateTP2: number;
  averageR: number;
  totalPnL: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
}

export interface ScreenerSettings {
  scanIntervalSeconds: number;
  minScoreAlert: number;
  min24hVolumeUsd: number;
  riskPercentage: number;
  accountSizeUsd: number;
  tp1Multiplier: number; // e.g. 1.5
  tp2Multiplier: number; // e.g. 2.5
  slAtrMultiplier: number; // e.g. 1.5
  enableTelegram: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  enableLong: boolean;
  enableShort: boolean;
  enableWhaleFlow: boolean;
  demoMode: boolean;
}

export interface TelegramTestResult {
  success: boolean;
  message: string;
  messageId?: number;
}
