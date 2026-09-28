import { MarketOverview, TradingSetup } from '../../src/types/crypto.ts';
import { fetch24hTickers, fetchKlines, getDataProviderStatus } from '../data/binance.ts';
import { getSettings, loadStore, recordOrUpdateSignal } from '../storage/store.ts';
import { evaluateTradingSetup } from './signalEngine.ts';
import { processSetupAlert } from './telegram.ts';

let currentSetups: TradingSetup[] = [];
let lastScanTimestamp = Date.now();
let isScanning = false;
let scannerTimer: NodeJS.Timeout | null = null;

export function getCurrentSetups(): TradingSetup[] {
  return currentSetups;
}

export function getLastScanTime(): number {
  return lastScanTimestamp;
}

export function isScannerBusy(): boolean {
  return isScanning;
}

export async function runScanner(force: boolean = false): Promise<TradingSetup[]> {
  if (isScanning && !force) {
    return currentSetups;
  }

  isScanning = true;
  const startTime = Date.now();
  const settings = getSettings();

  try {
    const tickers = await fetch24hTickers();
    // Filter and sort by volume
    const validTickers = tickers
      .filter((t: any) => {
        const vol = parseFloat(t.quoteVolume || '0');
        return vol >= (settings.demoMode ? 1000000 : settings.min24hVolumeUsd);
      })
      .sort((a: any, b: any) => parseFloat(b.quoteVolume || '0') - parseFloat(a.quoteVolume || '0'))
      .slice(0, 26);

    const evaluated: TradingSetup[] = [];

    // Evaluate in bounded concurrency batches of 4
    for (let i = 0; i < validTickers.length; i += 4) {
      const batch = validTickers.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async (ticker: any) => {
          try {
            const symbol = ticker.symbol;
            const price = parseFloat(ticker.lastPrice);
            const change24h = parseFloat(ticker.priceChangePercent);
            const high24h = parseFloat(ticker.highPrice || price * 1.02);
            const low24h = parseFloat(ticker.lowPrice || price * 0.98);
            const volume24h = parseFloat(ticker.volume || '0');
            const quoteVolume24h = parseFloat(ticker.quoteVolume || '0');

            // Fetch MTF candles
            const [c1h, c5m, c15m, c4h] = await Promise.all([
              fetchKlines(symbol, '1h', 70),
              fetchKlines(symbol, '5m', 40),
              fetchKlines(symbol, '15m', 40),
              fetchKlines(symbol, '4h', 40),
            ]);

            const setup = evaluateTradingSetup(
              symbol,
              price,
              change24h,
              high24h,
              low24h,
              volume24h,
              quoteVolume24h,
              c1h,
              c5m,
              c15m,
              c4h
            );

            // Record into persistent history & check resolution of previous signals
            recordOrUpdateSignal(setup);

            // Trigger telegram if setup is high conviction
            if (settings.enableTelegram) {
              processSetupAlert(setup, settings).catch(() => {});
            }

            return setup;
          } catch (err) {
            console.error(`Error scanning ${ticker.symbol}:`, err);
            return null;
          }
        })
      );

      for (const res of batchResults) {
        if (res) evaluated.push(res);
      }
    }

    if (evaluated.length > 0) {
      currentSetups = evaluated;
    }
    lastScanTimestamp = Date.now();
    console.log(`Scanner completed in ${Date.now() - startTime}ms. Evaluated ${evaluated.length} coins.`);
  } catch (err) {
    console.error('Fatal scanner error:', err);
  } finally {
    isScanning = false;
  }

  return currentSetups;
}

export function getMarketOverview(): MarketOverview {
  const settings = getSettings();
  const setups = currentSetups;

  const longSetups = setups.filter(s => s.state === 'CONFIRMED_LONG');
  const shortSetups = setups.filter(s => s.state === 'CONFIRMED_SHORT');
  const waitingSetups = setups.filter(s => s.state === 'WAIT_FOR_CONFIRMATION');
  const highVolume = setups.filter(s => s.indicators.volumeChangePercent > 20);
  const whaleSetups = setups.filter(s => s.setupType === 'Whale Resilience');

  let status: 'Market Bullish' | 'Market Bearish' | 'Mixed Market' = 'Mixed Market';
  if (longSetups.length > shortSetups.length * 1.6 && longSetups.length >= 4) {
    status = 'Market Bullish';
  } else if (shortSetups.length > longSetups.length * 1.6 && shortSetups.length >= 4) {
    status = 'Market Bearish';
  }

  const btc = setups.find(s => s.symbol === 'BTCUSDT');
  const btcPrice = btc ? btc.price : 96500;

  const nextScanTimestamp = lastScanTimestamp + settings.scanIntervalSeconds * 1000;

  return {
    status,
    totalCoinsScanned: setups.length,
    longSetupsCount: longSetups.length,
    shortSetupsCount: shortSetups.length,
    waitingCount: waitingSetups.length,
    highVolumeCount: highVolume.length,
    whaleSetupsCount: whaleSetups.length,
    btcDominance: 58.4,
    btcPrice,
    lastScanTimestamp,
    nextScanTimestamp,
    scannerActive: true,
    dataProviderStatus: getDataProviderStatus(),
  };
}

export function startBackgroundScanner(): void {
  loadStore();
  const settings = getSettings();

  // Run immediate initial scan
  runScanner().catch(console.error);

  if (scannerTimer) clearInterval(scannerTimer);

  const intervalMs = Math.max(30, settings.scanIntervalSeconds) * 1000;
  scannerTimer = setInterval(() => {
    runScanner().catch(console.error);
  }, intervalMs);

  console.log(`Background scanner scheduled every ${settings.scanIntervalSeconds}s`);
}
