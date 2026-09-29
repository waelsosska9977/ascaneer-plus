import { Candle } from '../../src/types/crypto.ts';

// Cache structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const klinesCache = new Map<string, CacheItem<Candle[]>>();
let tickerCache: CacheItem<any[]> | null = null;
let dataProviderStatus: 'LIVE' | 'DELAYED' | 'DEMO' = 'LIVE';

export const PREMARKET_AND_P_SYMBOLS = [
  'SNDKP',
  'SNDKUSDTP',
  'NSDKUSDTP',
  'NSDKP',
  'SPXUSDTP',
  'SPXUSDT',
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

export const STOCK_AND_INDEX_SYMBOLS = PREMARKET_AND_P_SYMBOLS;

export const NEW_LISTING_SYMBOLS = [
  'PENGUUSDT',
  'MOVEUSDT',
  'THEUSDT',
  'ACXUSDT',
  'ORCAUSDT',
  'PNUTUSDT',
  'ACTUSDT',
  'MEUSDT',
  'VIRTUALUSDT',
  'AIUSDT',
  'COWUSDT',
  'CETUSUSDT',
];

export const PRIMARY_SYMBOLS = [
  ...STOCK_AND_INDEX_SYMBOLS,
  ...NEW_LISTING_SYMBOLS,
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'SUIUSDT',
  'NEARUSDT',
  'LINKUSDT',
  'SEIUSDT',
  'PEPEUSDT',
  'SHIBUSDT',
  'APTUSDT',
  'ARBUSDT',
  'OPUSDT',
  'INJUSDT',
  'TIAUSDT',
  'FETUSDT',
  'RENDERUSDT',
  'DOTUSDT',
  'LTCUSDT',
  'WIFUSDT',
  'ICPUSDT',
  'FILUSDT',
  'KASUSDT',
  'TAOUSDT',
  'AAVEUSDT',
  'UNIUSDT',
  'ATOMUSDT',
  'RUNEUSDT',
  'FTMUSDT',
  'GALAUSDT',
  'SANDUSDT',
  'MANAUSDT',
  'ALGOUSDT',
  'STXUSDT',
  'IMXUSDT',
  'FLOKIUSDT',
  'BONKUSDT',
  'JUPUSDT',
  'PYTHUSDT',
  'PENDLEUSDT',
  'ENAUSDT',
  'WLDUSDT',
  'DYDXUSDT',
  'ONDOUSDT',
  'BLURUSDT',
  'BEAMUSDT',
  'AXSUSDT',
  'CHZUSDT',
  'CRVUSDT',
  'MKRUSDT',
  'LDOUSDT',
  'SNXUSDT',
  'GRTUSDT',
  'THETAUSDT',
  'MATICUSDT',
  'TRXUSDT',
];

export function getDataProviderStatus(): 'LIVE' | 'DELAYED' | 'DEMO' {
  return dataProviderStatus;
}

export function setDemoMode(isDemo: boolean) {
  if (isDemo) dataProviderStatus = 'DEMO';
  else dataProviderStatus = 'LIVE';
}

export async function fetch24hTickers(): Promise<any[]> {
  const now = Date.now();
  // Cache ticker data for 10 seconds
  if (tickerCache && now - tickerCache.timestamp < 10000) {
    return tickerCache.data;
  }

  const endpoints = [
    'https://api.binance.com/api/v3/ticker/24hr',
    'https://data-api.binance.vision/api/v3/ticker/24hr',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const raw = await response.json();
        const filtered = raw.filter((t: any) =>
          PRIMARY_SYMBOLS.includes(t.symbol) ||
          (t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 10000000)
        );
        tickerCache = { data: filtered, timestamp: now };
        dataProviderStatus = 'LIVE';
        return filtered;
      }
    } catch {
      // Try next endpoint or fallback
    }
  }

  // If live network call fails, check stale cache
  if (tickerCache) {
    dataProviderStatus = 'DELAYED';
    return tickerCache.data;
  }

  // Graceful fallback seed for development / offline sandbox
  dataProviderStatus = 'DEMO';
  return getFallbackTickers();
}

export async function fetchKlines(
  symbol: string,
  interval: string = '1h',
  limit: number = 100
): Promise<Candle[]> {
  const normSymbol = symbol.toUpperCase().trim();
  const cleanSymbol = normSymbol.replace(/USDTP$/, 'USDT');
  const cacheKey = `${normSymbol}_${interval}_${limit}`;
  const now = Date.now();
  const cached = klinesCache.get(cacheKey);

  // 15-second cache for klines
  if (cached && now - cached.timestamp < 15000) {
    return cached.data;
  }

  const endpoints = [
    // Binance Spot
    `https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${interval}&limit=${limit}`,
    `https://data-api.binance.vision/api/v3/klines?symbol=${cleanSymbol}&interval=${interval}&limit=${limit}`,
    // Binance Futures (for SPX, stock tokens, indices, perpetuals)
    `https://fapi.binance.com/fapi/v1/klines?symbol=${cleanSymbol}&interval=${interval}&limit=${limit}`,
    `https://fapi.binance.com/fapi/v1/klines?symbol=${normSymbol}&interval=${interval}&limit=${limit}`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const raw = await response.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const candles: Candle[] = raw.map((k: any[]) => ({
            timestamp: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            quoteVolume: parseFloat(k[7]),
            trades: parseInt(k[8], 10),
            takerBuyBaseVolume: parseFloat(k[9]),
          }));

          klinesCache.set(cacheKey, { data: candles, timestamp: now });
          return candles;
        }
      }
    } catch {
      // Try next endpoint or fallback
    }
  }

  if (cached) {
    return cached.data;
  }

  // Generate deterministic synthetic candles based on current symbol benchmark
  return generateDeterministicCandles(normSymbol, interval, limit);
}

function getFallbackTickers(): any[] {
  const seeds = [
    { symbol: 'NSDKUSDTP', lastPrice: '21480.50', priceChangePercent: '1.85', quoteVolume: '185000000', highPrice: '21650.00', lowPrice: '21220.00' },
    { symbol: 'SPXUSDT', lastPrice: '0.4180', priceChangePercent: '3.40', quoteVolume: '15000000', highPrice: '0.4350', lowPrice: '0.3950' },
    { symbol: 'SNDKUSDT', lastPrice: '48.50', priceChangePercent: '2.10', quoteVolume: '28000000', highPrice: '49.80', lowPrice: '47.20' },
    { symbol: 'BTCUSDT', lastPrice: '96450.00', priceChangePercent: '2.45', quoteVolume: '2450000000', highPrice: '97100.00', lowPrice: '94200.00' },
    { symbol: 'ETHUSDT', lastPrice: '2780.50', priceChangePercent: '3.12', quoteVolume: '1350000000', highPrice: '2810.00', lowPrice: '2690.00' },
    { symbol: 'SOLUSDT', lastPrice: '194.80', priceChangePercent: '5.60', quoteVolume: '980000000', highPrice: '198.50', lowPrice: '184.20' },
    { symbol: 'SEIUSDT', lastPrice: '0.4850', priceChangePercent: '7.85', quoteVolume: '145000000', highPrice: '0.4990', lowPrice: '0.4420' },
    { symbol: 'BNBUSDT', lastPrice: '645.20', priceChangePercent: '1.20', quoteVolume: '320000000', highPrice: '652.00', lowPrice: '638.00' },
    { symbol: 'XRPUSDT', lastPrice: '2.3500', priceChangePercent: '-1.40', quoteVolume: '620000000', highPrice: '2.4400', lowPrice: '2.3100' },
    { symbol: 'DOGEUSDT', lastPrice: '0.2450', priceChangePercent: '-2.10', quoteVolume: '410000000', highPrice: '0.2580', lowPrice: '0.2390' },
    { symbol: 'SUIUSDT', lastPrice: '3.4200', priceChangePercent: '6.40', quoteVolume: '380000000', highPrice: '3.5100', lowPrice: '3.1900' },
    { symbol: 'NEARUSDT', lastPrice: '5.8500', priceChangePercent: '4.20', quoteVolume: '210000000', highPrice: '5.9800', lowPrice: '5.5800' },
    { symbol: 'LINKUSDT', lastPrice: '19.4000', priceChangePercent: '2.80', quoteVolume: '195000000', highPrice: '19.8500', lowPrice: '18.8000' },
    { symbol: 'AVAXUSDT', lastPrice: '28.9000', priceChangePercent: '-0.85', quoteVolume: '175000000', highPrice: '29.6000', lowPrice: '28.4000' },
    { symbol: 'ADAUSDT', lastPrice: '0.7850', priceChangePercent: '1.15', quoteVolume: '160000000', highPrice: '0.8050', lowPrice: '0.7720' },
    { symbol: 'PEPEUSDT', lastPrice: '0.00001850', priceChangePercent: '8.40', quoteVolume: '450000000', highPrice: '0.00001920', lowPrice: '0.00001690' },
    { symbol: 'APTUSDT', lastPrice: '8.7500', priceChangePercent: '-3.20', quoteVolume: '95000000', highPrice: '9.1500', lowPrice: '8.6000' },
    { symbol: 'INJUSDT', lastPrice: '22.8000', priceChangePercent: '4.75', quoteVolume: '88000000', highPrice: '23.4000', lowPrice: '21.7000' },
  ];

  return seeds.map(s => ({
    ...s,
    volume: (parseFloat(s.quoteVolume) / parseFloat(s.lastPrice)).toString(),
  }));
}

function generateDeterministicCandles(symbol: string, interval: string, limit: number): Candle[] {
  let basePrice = 1.0;
  const upper = symbol.toUpperCase();
  if (upper.includes('NSDK') || upper.includes('NDX')) basePrice = 21450.0;
  else if (upper.includes('SNDK')) basePrice = 48.5;
  else if (upper.includes('SPX')) basePrice = 0.418;
  else if (upper.includes('PENGU')) basePrice = 0.0385;
  else if (upper.includes('MOVE')) basePrice = 0.852;
  else if (upper.includes('THE')) basePrice = 2.45;
  else if (upper.includes('SCR')) basePrice = 0.72;
  else if (upper.includes('EIGEN')) basePrice = 3.15;
  else if (upper.includes('HMSTR')) basePrice = 0.00325;
  else if (upper.includes('CATI')) basePrice = 0.54;
  else if (upper.includes('ACT')) basePrice = 0.485;
  else if (upper.includes('PNUT')) basePrice = 1.15;
  else if (upper.startsWith('BTC')) basePrice = 96000;
  else if (upper.startsWith('ETH')) basePrice = 2750;
  else if (upper.startsWith('SOL')) basePrice = 190;
  else if (upper.startsWith('SEI')) basePrice = 0.48;
  else if (upper.startsWith('BNB')) basePrice = 640;
  else if (upper.startsWith('XRP')) basePrice = 2.3;
  else if (upper.startsWith('DOGE')) basePrice = 0.24;
  else if (upper.startsWith('SUI')) basePrice = 3.4;
  else if (upper.startsWith('NEAR')) basePrice = 5.8;
  else if (upper.startsWith('LINK')) basePrice = 19.2;
  else if (upper.startsWith('PEPE')) basePrice = 0.000018;

  const now = Date.now();
  let intervalMs = 3600000;
  if (interval === '5m') intervalMs = 5 * 60000;
  if (interval === '15m') intervalMs = 15 * 60000;
  if (interval === '4h') intervalMs = 4 * 3600000;

  const candles: Candle[] = [];
  let currentPrice = basePrice * 0.95;

  for (let i = limit; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    // create mild upward or downward oscillation
    const noise = Math.sin(i * 0.3) * 0.015 + (limit - i) * 0.0008;
    const open = currentPrice;
    const change = open * (noise + (Math.cos(i * 0.5) * 0.008));
    const close = Math.max(open * 0.5, open + change);
    const high = Math.max(open, close) * (1 + Math.abs(Math.sin(i)) * 0.008);
    const low = Math.min(open, close) * (1 - Math.abs(Math.cos(i)) * 0.008);
    const volume = (basePrice * 1000) / (close || 1) * (1 + Math.sin(i * 0.7) * 0.4);
    const takerBuyBaseVolume = volume * (close > open ? 0.58 : 0.44);

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      quoteVolume: volume * close,
      takerBuyBaseVolume,
    });

    currentPrice = close;
  }

  return candles;
}
