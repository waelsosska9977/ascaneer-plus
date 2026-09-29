import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchKlines, setDemoMode } from './server/data/binance.ts';
import { runBacktest } from './server/engine/backtest.ts';
import {
  getCurrentSetups,
  getLastScanTime,
  getMarketOverview,
  isScannerBusy,
  runScanner,
  startBackgroundScanner,
} from './server/engine/scanner.ts';
import {
  handleTelegramCommand,
  sendTelegramMessage,
} from './server/engine/telegram.ts';
import {
  computePerformanceStats,
  getSettings,
  getSignalsHistory,
  loadStore,
  updateSettings,
} from './server/storage/store.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  loadStore();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '0.0.0.0';

  // Enable CORS for all incoming client requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // API Endpoints
  app.get('/api/overview', (req, res) => {
    try {
      const overview = getMarketOverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/scan', async (req, res) => {
    try {
      const setups = getCurrentSetups();
      if (setups.length === 0 && !isScannerBusy()) {
        const fresh = await runScanner();
        return res.json(fresh);
      }
      res.json(setups);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/scan/refresh', async (req, res) => {
    try {
      const setups = await runScanner(true);
      res.json({ success: true, count: setups.length, setups });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/klines', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const interval = (req.query.interval as string) || '1h';
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const candles = await fetchKlines(symbol, interval, limit);
      res.json(candles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/history', (req, res) => {
    try {
      const history = getSignalsHistory();
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/performance', (req, res) => {
    try {
      const stats = computePerformanceStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/backtest', async (req, res) => {
    try {
      const { symbol = 'BTCUSDT', timeframe = '1h', candleLimit = 250, minScore = 70 } = req.body;
      const result = await runBacktest(symbol, timeframe, candleLimit, minScore);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/settings', (req, res) => {
    try {
      const settings = getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings', (req, res) => {
    try {
      const updated = updateSettings(req.body);
      if (typeof req.body.demoMode === 'boolean') {
        setDemoMode(req.body.demoMode);
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stock-tokens', (req, res) => {
    try {
      const settings = getSettings();
      const setups = getCurrentSetups();
      const stockTokens = settings.stockTokens || [
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
      const stockSetups = setups.filter(
        s => s.isPToken || s.isStockToken || s.category === 'PREMARKET_P' || s.category === 'STOCK_INDEX' || stockTokens.includes(s.symbol)
      );
      res.json({ stockTokens, setups: stockSetups });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/symbols/add', async (req, res) => {
    try {
      const { symbol, isStock = false } = req.body;
      if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
      const cleanSym = symbol.toUpperCase().trim();
      const settings = getSettings();
      const currentCustom = settings.customSymbols || [];
      const currentStock = settings.stockTokens || [];

      const isPToken =
        isStock ||
        cleanSym.endsWith('USDTP') ||
        cleanSym.endsWith('P') ||
        cleanSym.includes('SNDK') ||
        cleanSym.includes('NSDK') ||
        cleanSym.includes('SPX');

      const nextCustom = currentCustom.includes(cleanSym) ? currentCustom : [cleanSym, ...currentCustom];
      const nextStock = isPToken && !currentStock.includes(cleanSym) ? [cleanSym, ...currentStock] : currentStock;

      updateSettings({ customSymbols: nextCustom, stockTokens: nextStock });

      const setups = await runScanner(true);
      const setup = setups.find(
        s => s.symbol === cleanSym || s.symbol === cleanSym.replace(/USDTP$/, 'USDT') || s.symbol === cleanSym.replace(/P$/, 'USDTP')
      );
      res.json({ success: true, symbol: cleanSym, setup, setups, stockTokens: nextStock });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/symbols/remove', (req, res) => {
    try {
      const { symbol } = req.body;
      if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
      const cleanSym = symbol.toUpperCase().trim();
      const settings = getSettings();
      const currentCustom = (settings.customSymbols || []).filter(s => s !== cleanSym);
      const currentStock = (settings.stockTokens || []).filter(s => s !== cleanSym);

      const updated = updateSettings({ customSymbols: currentCustom, stockTokens: currentStock });
      res.json({ success: true, symbol: cleanSym, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/symbols/stock-presets', async (req, res) => {
    try {
      const { preset = 'stock' } = req.body;
      const settings = getSettings();

      let targetTokens: string[] = [];
      if (preset === 'stock' || preset === 'premarket') {
        targetTokens = [
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
      } else if (preset === 'new_listings') {
        targetTokens = [
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
      }

      const mergedCustom = Array.from(new Set([...targetTokens, ...(settings.customSymbols || [])]));
      const mergedStock = Array.from(new Set([...targetTokens, ...(settings.stockTokens || [])]));

      updateSettings({ customSymbols: mergedCustom, stockTokens: mergedStock });
      const setups = await runScanner(true);
      res.json({ success: true, count: targetTokens.length, stockTokens: mergedStock, setups });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/telegram/test', async (req, res) => {
    try {
      const { token, chatId } = req.body;
      const activeToken = token || getSettings().telegramBotToken;
      const activeChatId = chatId || getSettings().telegramChatId;

      if (!activeToken || !activeChatId) {
        return res.status(400).json({
          success: false,
          message: 'Both Telegram Bot Token and Chat ID are required.',
        });
      }

      const sampleMsg = `🤖 *SOSSKA CRYPTO SCREENER V2 - Test Alert*

✅ Telegram Bot connected successfully!
🕒 Timestamp: ${new Date().toISOString()}
⚡ Scanner is active and monitoring market setups in real-time.`;

      const result = await sendTelegramMessage(activeToken, activeChatId, sampleMsg);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/telegram/webhook', (req, res) => {
    try {
      const { command = '/start' } = req.body;
      const setups = getCurrentSetups();
      const settings = getSettings();
      const responseText = handleTelegramCommand(command, setups, settings);
      res.json({ reply: responseText });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`SOSSKA Crypto Screener V2 Server running on http://${HOST}:${PORT}`);
    // Start background scanner
    startBackgroundScanner();
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
