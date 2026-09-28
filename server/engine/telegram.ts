import { ScreenerSettings, TradingSetup } from '../../src/types/crypto.ts';

// Track sent alerts to prevent duplicate spam (symbol -> lastAlertState)
const alertCache = new Map<string, { state: string; timestamp: number }>();

export function formatTelegramSignalMessage(setup: TradingSetup): string {
  const isLong = setup.state === 'CONFIRMED_LONG';
  const stateEmoji = isLong ? '🟢 CONFIRMED LONG' : setup.state === 'CONFIRMED_SHORT' ? '🔴 CONFIRMED SHORT' : '🟡 WAIT FOR CONFIRMATION';
  const typeEmoji = setup.setupType === 'Whale Resilience' ? '🐳' : '⚡';

  const mtfEmoji = (status: 'bullish' | 'bearish' | 'neutral') =>
    status === 'bullish' ? '🟢' : status === 'bearish' ? '🔴' : '⚪';

  const whyPoints = setup.reasons.slice(0, 5).map(r => `✓ ${r}`).join('\n');

  return `🚨 *NEW SIGNAL ALERT*

${typeEmoji} *Setup Type:* ${setup.setupType}
💎 *${setup.symbol}*
💵 *Entry:* $${setup.entry}
📊 *Score:* ${setup.score}/100 (${setup.scoreBreakdown.scoreLabel})
${stateEmoji}

📈 *Technical Indicators:*
• EMA 9: $${setup.indicators.ema9.toFixed(4)}
• EMA 21: $${setup.indicators.ema21.toFixed(4)}
• EMA 200: $${setup.indicators.ema200.toFixed(4)}
• VWAP: $${setup.indicators.vwap.toFixed(4)} (${setup.indicators.priceVsVwap === 'above' ? 'Above 🟢' : 'Below 🔴'})
• RSI (14): ${setup.indicators.rsi.toFixed(1)}
• MFI (14): ${setup.indicators.mfi.toFixed(1)}
• Stoch: K ${setup.indicators.stochK.toFixed(1)} / D ${setup.indicators.stochD.toFixed(1)}
• Vol Change: ${setup.indicators.volumeChangePercent >= 0 ? '+' : ''}${setup.indicators.volumeChangePercent.toFixed(1)}%

⏳ *Multi-Timeframe Alignment (${setup.mtf.alignmentFraction}):*
5M: ${mtfEmoji(setup.mtf.tf5m.trend)} | 15M: ${mtfEmoji(setup.mtf.tf15m.trend)} | 1H: ${mtfEmoji(setup.mtf.tf1h.trend)} | 4H: ${mtfEmoji(setup.mtf.tf4h.trend)}

🎯 *Targets & Risk:*
🎯 *TP1:* $${setup.tp1}
🎯 *TP2:* $${setup.tp2}
🛑 *SL:* $${setup.sl}
⚖️ *R:R:* 1:${setup.riskRewardRatio}

💡 *Why this setup?*
${whyPoints}

🔗 [Open TradingView](https://www.tradingview.com/chart/?symbol=BINANCE:${setup.symbol})
*SOSSKA CRYPTO SCREENER V2*`;
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; message: string; messageId?: number }> {
  if (!token || !chatId) {
    return {
      success: false,
      message: 'Telegram Bot Token or Chat ID is not configured in Settings.',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return {
        success: true,
        message: 'Alert sent successfully via Telegram!',
        messageId: data.result?.message_id,
      };
    } else {
      return {
        success: false,
        message: `Telegram API error: ${data.description || 'Unknown error'}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Telegram: ${err.message}`,
    };
  }
}

export async function processSetupAlert(setup: TradingSetup, settings: ScreenerSettings): Promise<boolean> {
  if (!settings.enableTelegram || !settings.telegramBotToken || !settings.telegramChatId) {
    return false;
  }

  if (setup.score < settings.minScoreAlert) {
    return false;
  }

  if (setup.state === 'NO_SETUP') {
    return false;
  }

  const existing = alertCache.get(setup.symbol);
  const now = Date.now();

  // Deduplicate: Don't send same state within 4 hours
  if (existing && existing.state === setup.state && now - existing.timestamp < 4 * 3600 * 1000) {
    return false;
  }

  const text = formatTelegramSignalMessage(setup);
  const res = await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, text);

  if (res.success) {
    alertCache.set(setup.symbol, { state: setup.state, timestamp: now });
    return true;
  }
  return false;
}

export function handleTelegramCommand(command: string, setups: TradingSetup[], settings: ScreenerSettings): string {
  const cleanCmd = command.trim().toLowerCase();

  if (cleanCmd.startsWith('/start')) {
    return `👋 *Welcome to SOSSKA Crypto Screener V2 Bot!*

Use this bot to get real-time institutional-grade crypto trading alerts.

*Available Commands:*
/top - View highest score setups
/long - View active CONFIRMED LONG setups
/short - View active CONFIRMED SHORT setups
/scan - Run an on-demand screener check
/signals - View recent signal history summary
/status - Scanner health and Binance data provider status
/settings - View current bot thresholds

_Market analysis tool. Not financial advice._`;
  }

  if (cleanCmd.startsWith('/top')) {
    const top = [...setups].sort((a, b) => b.score - a.score).slice(0, 5);
    if (top.length === 0) return 'No active setups currently scanned.';
    return `🔥 *Top Setups by Score:*\n\n` + top.map((s, i) =>
      `${i + 1}. *${s.symbol}* - Score: *${s.score}/100* (${s.state.replace('_', ' ')})\n   Entry: $${s.entry} | TP1: $${s.tp1} | SL: $${s.sl}`
    ).join('\n\n');
  }

  if (cleanCmd.startsWith('/long')) {
    const longs = setups.filter(s => s.state === 'CONFIRMED_LONG');
    if (longs.length === 0) return '🟡 No CONFIRMED LONG setups at this exact moment. Market is currently evaluating confirmations.';
    return `🟢 *Confirmed Long Setups:*\n\n` + longs.map(s =>
      `• *${s.symbol}* | Score: *${s.score}/100*\n  Entry: $${s.entry} | TP1: $${s.tp1} | SL: $${s.sl}\n  MTF: ${s.mtf.alignmentFraction} | Type: ${s.setupType}`
    ).join('\n\n');
  }

  if (cleanCmd.startsWith('/short')) {
    const shorts = setups.filter(s => s.state === 'CONFIRMED_SHORT');
    if (shorts.length === 0) return '🔴 No CONFIRMED SHORT setups at this exact moment.';
    return `🔴 *Confirmed Short Setups:*\n\n` + shorts.map(s =>
      `• *${s.symbol}* | Score: *${s.score}/100*\n  Entry: $${s.entry} | TP1: $${s.tp1} | SL: $${s.sl}\n  MTF: ${s.mtf.alignmentFraction}`
    ).join('\n\n');
  }

  if (cleanCmd.startsWith('/scan') || cleanCmd.startsWith('/status')) {
    const confirmedLongs = setups.filter(s => s.state === 'CONFIRMED_LONG').length;
    const confirmedShorts = setups.filter(s => s.state === 'CONFIRMED_SHORT').length;
    const waiting = setups.filter(s => s.state === 'WAIT_FOR_CONFIRMATION').length;

    return `📡 *SOSSKA Screener Status*
• Status: 🟢 Running
• Pairs Scanned: ${setups.length}
• Confirmed Longs: ${confirmedLongs}
• Confirmed Shorts: ${confirmedShorts}
• Waiting Confirmation: ${waiting}
• Scan Interval: Every ${settings.scanIntervalSeconds}s
• Min Score Alert: ${settings.minScoreAlert}/100`;
  }

  if (cleanCmd.startsWith('/settings')) {
    return `⚙️ *Current Screener Settings*
• Min Alert Score: ${settings.minScoreAlert}/100
• Min 24h Vol: $${(settings.min24hVolumeUsd / 1e6).toFixed(1)}M
• Risk Per Trade: ${settings.riskPercentage}%
• Longs Enabled: ${settings.enableLong ? 'Yes' : 'No'}
• Shorts Enabled: ${settings.enableShort ? 'Yes' : 'No'}
• Whale Flow: ${settings.enableWhaleFlow ? 'Yes' : 'No'}`;
  }

  return `Unknown command. Type /start for list of commands.`;
}
