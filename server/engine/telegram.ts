import { ScreenerSettings, TradingSetup } from '../../src/types/crypto.ts';
import { estimateTradeDuration } from '../../src/utils/durationEstimator.ts';
import { getSignalsHistory } from '../storage/store.ts';

// Track sent alerts to prevent duplicate spam (symbol -> lastAlertState)
const alertCache = new Map<string, { state: string; timestamp: number }>();

export function formatTelegramSignalMessage(setup: TradingSetup): string {
  const isLong = setup.state === 'CONFIRMED_LONG';
  const stateEmoji = isLong ? '🟢 CONFIRMED LONG (صعود مؤكد)' : setup.state === 'CONFIRMED_SHORT' ? '🔴 CONFIRMED SHORT (هبوط مؤكد)' : '🟡 WAIT FOR CONFIRMATION';
  const typeEmoji = setup.setupType === 'Whale Resilience' ? '🐳' : setup.setupType === 'Early Breakout' ? '🚀' : setup.setupType === 'Pullback Retest' ? '⚡' : '🔥';
  const categoryBadge = setup.isPToken || setup.isStockToken || setup.category === 'PREMARKET_P' || setup.symbol.endsWith('USDTP') || setup.symbol.endsWith('P')
    ? '⚡ *الفئة:* توكن ما قبل التداول وعقود P في بينانس (Binance Pre-Market & P-Token)\n'
    : setup.category === 'NEW_LISTING'
    ? '🆕 *الفئة:* إدراج توكن جديد في بينانس (New Binance Listing)\n'
    : '';

  const mtfEmoji = (status: 'bullish' | 'bearish' | 'neutral') =>
    status === 'bullish' ? '🟢' : status === 'bearish' ? '🔴' : '⚪';

  const whyPoints = setup.reasons.slice(0, 4).map(r => `✓ ${r}`).join('\n');

  const entryZoneText = setup.entryZone
    ? `📍 *منطقة الدخول الموصى بها (Entry Zone):* $${setup.entryZone.min} - $${setup.entryZone.max}\n🎯 *نقطة الارتداد المفضلة (Pullback Limit):* $${setup.entryZone.optimalPullback}`
    : `📍 *سعر الدخول:* $${setup.entry}`;

  const tipText = setup.executionTip
    ? `\n💡 *نصيحة الدخول الرابح:*\n${setup.executionTip}\n`
    : '';

  // Calculate estimated trade duration & ETA
  const duration = estimateTradeDuration(setup);
  const tp1Pct = duration.targetGainTP1Percent;
  const tp2Pct = duration.targetGainTP2Percent;

  return `🚨 *SOSSKA EARLY SIGNAL ALERT* ⚡

${typeEmoji} *Setup:* ${setup.setupType}
💎 *الرمز:* #${setup.symbol}
${categoryBadge}📊 *التقييم الفني:* ${setup.score}/100 (${setup.scoreBreakdown.scoreLabel})
${stateEmoji}

💵 *السعر الحالي لحظة الإشارة:* $${setup.price}
${entryZoneText}

🎯 *الأهداف ووقف الخسارة المحسوبة:*
🎯 *الهدف الأول (TP1):* $${setup.tp1} (+${tp1Pct}%) (تأمين 50% ونقل الوقف لنقطة الدخول)
🎯 *الهدف الثاني (TP2):* $${setup.tp2} (+${tp2Pct}%) (تفريغ باقي العقد)
🛑 *وقف الخسارة (SL):* $${setup.sl} (مخاطرة محكمة تحت الدعم)
⚖️ *نسبة العائد للمخاطرة (R:R):* 1:${setup.riskRewardRatio}

⏳ *مدة الصفقة التقريبية للانتهاء (Trade ETA):*
• 🎯 الوصول للهدف الأول (TP1): ~${duration.tp1Text} (+${tp1Pct}%)
• 🏁 انتهاء الصفقة بالكامل (TP2): ~${duration.tp2Text} (+${tp2Pct}%)
• ⏱️ نوع وسرعة الصفقة: ${duration.speedCategoryArabic}

📈 *مؤشرات فريم 15 دقيقة (Fast Execution):*
• EMA 9: $${setup.indicators.ema9.toFixed(4)} | EMA 21: $${setup.indicators.ema21.toFixed(4)}
• VWAP: $${setup.indicators.vwap.toFixed(4)} (${setup.indicators.priceVsVwap === 'above' ? 'Above 🟢' : 'Below 🔴'})
• RSI: ${setup.indicators.rsi.toFixed(1)} | MFI: ${setup.indicators.mfi.toFixed(1)}
• Stoch: K ${setup.indicators.stochK.toFixed(1)} / D ${setup.indicators.stochD.toFixed(1)}
• Vol Change: ${setup.indicators.volumeChangePercent >= 0 ? '+' : ''}${setup.indicators.volumeChangePercent.toFixed(1)}%

⏳ *توافق الفريمات MTF (${setup.mtf.alignmentFraction}):*
5M: ${mtfEmoji(setup.mtf.tf5m.trend)} | 15M: ${mtfEmoji(setup.mtf.tf15m.trend)} | 1H: ${mtfEmoji(setup.mtf.tf1h.trend)} | 4H: ${mtfEmoji(setup.mtf.tf4h.trend)}
${tipText}
💡 *أسباب الإشارة المبكرة:*
${whyPoints}

🔗 [فتح شارت Binance على TradingView](https://www.tradingview.com/chart/?symbol=BINANCE:${setup.symbol})
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

  if (cleanCmd.startsWith('/track') || cleanCmd.startsWith('/pnl') || cleanCmd.startsWith('/signals')) {
    const history = getSignalsHistory();
    const activeOrRecent = history.slice(0, 6);
    if (activeOrRecent.length === 0) return 'No signals currently recorded.';

    return `📊 *متتبع مسار التوصيات والربح اللحظي (Signal Trajectory Tracker)*\n\n` +
      activeOrRecent.map(s => {
        const pnl = s.pnlPercent ?? 0;
        const pnlSign = pnl >= 0 ? '+' : '';
        const pnlEmoji = pnl >= 0 ? '🟢' : '🔴';
        const isLong = s.signalType === 'CONFIRMED_LONG';
        const trajText = s.trajectory === 'STRONG_CONTINUATION'
          ? 'استمرار قوي 🚀'
          : s.trajectory === 'CORRECT_DIRECTION'
          ? 'اتجاه صحيح ✅'
          : s.trajectory === 'TESTING_ENTRY'
          ? 'تذبذب دخول 🟡'
          : 'ارتداد عكسي 🔴';
        const accText = s.entryAccuracy === 'PERFECT_TIMING'
          ? 'توقيت مثالي 🎯'
          : s.entryAccuracy === 'SOUND_ENTRY'
          ? 'دخول سليم 100%'
          : s.entryAccuracy === 'FAILED_ENTRY'
          ? 'فشل التحليل ❌'
          : 'تحت الاختبار ⚠️';

        return `💎 *${s.symbol}* (${isLong ? 'LONG 🟢' : 'SHORT 🔴'})\n` +
          `• سعر الدخول: $${s.entry} ➡️ السعر: $${s.currentPrice || s.exitPrice || s.entry}\n` +
          `• الربح/الخسارة: *${pnlSign}${pnl.toFixed(2)}%* ${pnlEmoji} (${s.status})\n` +
          `• المسار: *${trajText}* | دقة الدخول: *${accText}*\n` +
          `• ذروة الربح: +${(s.maxRunUpPercent ?? pnl).toFixed(2)}% | أقصى تراجع: -${(s.maxDrawdownPercent ?? 0).toFixed(2)}%`;
      }).join('\n\n');
  }

  if (cleanCmd.startsWith('/top')) {
    const top = [...setups].sort((a, b) => b.score - a.score).slice(0, 5);
    if (top.length === 0) return 'No active setups currently scanned.';
    return `🔥 *Top Setups by Score:*\n\n` + top.map((s, i) => {
      const dur = estimateTradeDuration(s);
      return `${i + 1}. *${s.symbol}* - Score: *${s.score}/100* (${s.state.replace('_', ' ')})\n   Entry: $${s.entry} | TP1: $${s.tp1} | TP2: $${s.tp2}\n   ⏳ المدة المتوقعة: ~${dur.tp1Text} (هدف 1) • ~${dur.tp2Text} (انتهاء) • ${dur.speedCategoryArabic}`;
    }).join('\n\n');
  }

  if (cleanCmd.startsWith('/long')) {
    const longs = setups.filter(s => s.state === 'CONFIRMED_LONG');
    if (longs.length === 0) return '🟡 No CONFIRMED LONG setups at this exact moment. Market is currently evaluating confirmations.';
    return `🟢 *Confirmed Long Setups:*\n\n` + longs.map(s => {
      const dur = estimateTradeDuration(s);
      return `• *${s.symbol}* | Score: *${s.score}/100*\n  Entry: $${s.entry} | TP1: $${s.tp1} | TP2: $${s.tp2}\n  ⏳ المدة: ~${dur.tp1Text} (هدف 1) • ~${dur.tp2Text} (انتهاء) | ${dur.speedCategoryArabic}\n  MTF: ${s.mtf.alignmentFraction} | Type: ${s.setupType}`;
    }).join('\n\n');
  }

  if (cleanCmd.startsWith('/short')) {
    const shorts = setups.filter(s => s.state === 'CONFIRMED_SHORT');
    if (shorts.length === 0) return '🔴 No CONFIRMED SHORT setups at this exact moment.';
    return `🔴 *Confirmed Short Setups:*\n\n` + shorts.map(s => {
      const dur = estimateTradeDuration(s);
      return `• *${s.symbol}* | Score: *${s.score}/100*\n  Entry: $${s.entry} | TP1: $${s.tp1} | TP2: $${s.tp2}\n  ⏳ المدة: ~${dur.tp1Text} (هدف 1) • ~${dur.tp2Text} (انتهاء) | ${dur.speedCategoryArabic}\n  MTF: ${s.mtf.alignmentFraction}`;
    }).join('\n\n');
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
