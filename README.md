# SOSSKA CRYPTO SCREENER V2

A professional real-time Crypto Trading Terminal & Algorithmic Screener for cryptocurrency market scanning, multi-timeframe confirmation, explainable score breakdown, liquidity flow tracking, dynamic TP/SL target generation, signal history tracking, backtesting, and Telegram alerts.

---

## 1. System Architecture & Folder Structure

```
├── .env.example                 # Environment configuration template
├── package.json                 # Scripts and dependencies
├── server.ts                    # Express + Vite backend server & background worker
├── index.html                   # HTML entry point with JetBrains Mono / Plus Jakarta Sans
├── data/
│   └── store.json               # Persistent file-backed store for settings & signal history
├── server/
│   ├── data/
│   │   └── binance.ts           # Binance REST API client with cache & live fallback
│   ├── engine/
│   │   ├── indicators.ts        # Pure math for EMA (9/21/200), VWAP, RSI, MFI, Stoch, ATR
│   │   ├── signalEngine.ts      # Multi-timeframe synthesis, scoring (0-100), checklist, TP/SL
│   │   ├── scanner.ts           # Background scanner running every 60s, state change detection
│   │   ├── telegram.ts          # Telegram bot alert formatter, dispatch & command simulator
│   │   └── backtest.ts          # Historical backtesting engine over actual Binance klines
│   └── storage/
│       └── store.ts             # Persistent store, signal lifecycle tracker & performance metrics
└── src/
    ├── types/
    │   └── crypto.ts            # Complete TypeScript domain interfaces
    ├── components/
    │   ├── Header.tsx           # 3-Zone top navigation with live data status & quick actions
    │   ├── MarketOverviewBar.tsx# Market regime banner, BTC metrics & scan countdown
    │   ├── TopSetupsBanner.tsx  # Highest score setups showcase cards
    │   ├── CryptoTable.tsx      # Desktop terminal grid with exact indicator values & sorting
    │   ├── MobileCardView.tsx   # Mobile-optimized high-density cards
    │   ├── CandlestickChart.tsx # SVG Candlestick chart with EMA/VWAP/Support/Resistance
    │   ├── ChartModal.tsx       # Full trade analysis modal with checklist, reasons, & risks
    │   ├── ScoreBreakdownModal.tsx # 7-factor score breakdown (0-100)
    │   ├── RiskCalculatorModal.tsx # Position sizer ($ risk, units, leverage)
    │   ├── TelegramSimulatorModal.tsx # Interactive Telegram bot simulator & test alert tool
    │   ├── WhaleFlowView.tsx    # Relative liquidity & taker buy flow dashboard
    │   ├── HistoryView.tsx      # Immutable recorded signals journal & lifecycle status
    │   ├── PerformanceView.tsx  # Empirical performance analytics & win rates by score range
    │   ├── BacktestView.tsx     # Strategy backtesting studio with simulated trade log
    │   ├── SettingsView.tsx     # Screener interval, alert score, & parameter configuration
    │   └── Footer.tsx           # Anti-slop regulatory disclaimer
    ├── App.tsx                  # Primary React orchestrator
    ├── main.tsx                 # React entry point
    └── index.css                # Tailwind CSS v4 styling
```

---

## 2. Technical Indicators Engine

All indicators are calculated dynamically from actual market candles without hardcoding:

- **EMA 9, EMA 21, EMA 200:** $EMA_t = Close_t \times k + EMA_{t-1} \times (1 - k)$ where $k = 2 / (period + 1)$. Bullish when EMA 9 > EMA 21 and Price > EMA 200.
- **VWAP:** Session volume-weighted average price: $\sum (TypicalPrice \times Volume) / \sum Volume$.
- **RSI (14):** Wilder's smoothed Relative Strength Index.
- **MFI (14):** Money Flow Index measuring volume-weighted positive vs. negative money flow.
- **Stochastic Oscillator:** Fast and slow %K and %D with oversold/overbought and crossover detection.
- **ATR (14):** Average True Range used for dynamic stop loss placement.
- **Volume vs. 20-SMA:** Percentage difference against the 20-period moving average of volume.

---

## 3. Transparent Scoring System (0 → 100)

The score reflects technical condition confluence. **It is not a win probability or guarantee of financial profit.**

| Component | Maximum Points | Criteria |
| :--- | :--- | :--- |
| **Trend Baseline** | 20 pts | Price > EMA 200 (12 pts) + Trend Alignment (8 pts) |
| **EMA Cross & Hold** | 20 pts | EMA 9 > EMA 21 (12 pts) + Price > EMA 9 & 21 (8 pts) |
| **VWAP Confluence** | 15 pts | Price holding above VWAP |
| **Volume Expansion** | 15 pts | Volume > 20% above 20-SMA (15 pts) / positive (10 pts) |
| **RSI Zone** | 10 pts | Healthy momentum (50-68) or oversold recovery |
| **Momentum & MFI** | 10 pts | MFI > 50 (4 pts) + Stochastic bullish signal (6 pts) |
| **MTF Alignment** | 10 pts | Proportional to aligned timeframes (e.g. 4/4 = 10 pts) |
| **Total** | **100 pts** | Strong Setup ($\ge 75$), Moderate ($\ge 60$), Developing ($\ge 45$) |

---

## 4. Signal States & Confirmation Checklists

- 🟢 **CONFIRMED LONG:** Score $\ge 70$, $\ge 4$ confirmations satisfied, bullish EMA and VWAP.
- 🔴 **CONFIRMED SHORT:** Score $\ge 70$, $\ge 4$ confirmations satisfied, bearish EMA and VWAP.
- 🟡 **WAIT FOR CONFIRMATION:** Pending confirmation items:
  - $\square$ Candle Close structure hold
  - $\square$ Volume Confirmation vs. 20-SMA
  - $\square$ Price > VWAP
  - $\square$ Price > EMA 200
  - $\square$ EMA 9 > EMA 21
- ⚪ **NO SETUP:** Sub-threshold consolidation.
- ⚠️ **SETUP INVALIDATED:** Break of key invalidation baseline.

---

## 5. Automated Target & Risk Engine

- **Entry:** Current market execution price.
- **Stop Loss (SL):** Positioned beyond the nearest support or $1.5 \times ATR$ volatility buffer.
- **Take Profit 1 (TP1):** $Entry + 1.5 \times (Entry - SL)$.
- **Take Profit 2 (TP2):** $Entry + 2.5 \times (Entry - SL)$.
- **Risk/Reward Ratio (R:R):** Computed dynamically (typically 1:1.5 to 1:2.5).

---

## 6. Telegram Bot Integration & Commands

Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` via Settings or `.env`.

### Supported Commands:
- `/start` - Bot introduction and help.
- `/scan` - Execute an on-demand market scan.
- `/long` - List active CONFIRMED LONG setups.
- `/short` - List active CONFIRMED SHORT setups.
- `/top` - Top 5 setups ranked by score.
- `/signals` - Summary of recent signal activity.
- `/status` - Background scanner health and Binance provider status.
- `/settings` - Current threshold parameters.

---

## 7. Deployment Instructions (Vercel / Cloud Run / Node)

### Step 1: Environment Variables
Create a `.env` file from `.env.example`:
```bash
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
SCAN_INTERVAL_SECONDS="60"
MIN_SCORE_ALERT="70"
PORT="3000"
```

### Step 2: Build & Start
```bash
# Install dependencies
npm install

# Build client bundle
npm run build

# Start production server with background scanner
npm start
```

### Step 3: Vercel Deployment
For full-stack deployment on Vercel:
1. Push repository to GitHub.
2. Import project into Vercel.
3. In Project Settings, set Framework Preset to **Vite** or **Other**.
4. Set Environment Variables: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
5. For continuous background scanning on serverless, set up a Vercel Cron Job in `vercel.json` pointing to `/api/scan/refresh` every 1 minute.
