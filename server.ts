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
  const PORT = process.env.PORT || 3000;

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

  app.listen(PORT, () => {
    console.log(`SOSSKA Crypto Screener V2 Server running on http://localhost:${PORT}`);
    // Start background scanner
    startBackgroundScanner();
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
