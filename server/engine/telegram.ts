import { ScreenerSettings, SignalHistoryRecord, TradingSetup } from '../../src/types/crypto.ts';
import { estimateTradeDuration } from '../../src/utils/durationEstimator.ts';
import {
  addTelegramSubscriber,
  getSettings,
  getSignalsHistory,
  getTelegramSubscribers,
} from '../storage/store.ts';
import { getCurrentSetups } from './scanner.ts';

// Track sent alerts to prevent duplicate spam (symbol -> lastAlertState)
const alertCache = new Map<string, { state: string; timestamp: number }>();

export const TELEGRAM_MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '🔥 أفضل الفرص (/top)' }, { text: '🟢 صفقات الشراء (/long)' }],
    [{ text: '🔴 صفقات البيع (/short)' }, { text: '📊 متتبع الأرباح (/signals)' }],
    [{ text: '⚡ فحص فوري للماركت (/scan)' }, { text: '⚙️ حالة الماسح (/status)' }],
  ],
  resize_keyboard: true,
  persistent: true,
};

export function formatTelegramTargetHitMessage(record: SignalHistoryRecord): string {
  const isLong = record.signalType === 'CONFIRMED_LONG';
  const isTP2 = record.status === 'TP2 Hit';
  const isTP1 = record.status === 'TP1 Hit';

  const badge = isTP2
    ? '🏁 *تم تحقيق الهدف الثاني بالكامل (TP2 Full Target Hit!)* 🚀'
    : isTP1
    ? '🎯 *تم تحقيق الهدف الأول بنجاح (TP1 Hit!)* ⚡'
    : '🛑 *تم ضرب وقف الخسارة (Stop Loss Hit)*';

  const pnlSign = (record.pnlPercent ?? 0) >= 0 ? '+' : '';
  const pnlEmoji = (record.pnlPercent ?? 0) >= 0 ? '🟢' : '🔴';

  const advice = isTP1
    ? '💡 *إجراء موصى به:* تم حجز 50% من الأرباح. يرجى نقل وقف الخسارة فوراً إلى سعر الدخول (Breakeven).'
    : isTP2
    ? '💡 *إجراء موصى به:* تم الخروج الكامل بنجاح وتحقيق أرباح الصفقة كاملة!'
    : '💡 *إدارة المخاطر:* تم الخروج بحماية محكمة تحت الدعم.';

  return `🎯 *تحديث صفقة مباشر (Trade Result Alert)*

${badge}
💎 *الرمز:* #${record.symbol} (${isLong ? 'LONG 🟢' : 'SHORT 🔴'})
📊 *الربح المحقق:* *${pnlSign}${record.pnlPercent}%* ${pnlEmoji}

💵 *سعر الدخول الأساسي:* $${record.entry}
💵 *سعر الخروج / الإغلاق:* $${record.exitPrice || record.currentPrice}
🎯 *الهدف الأول:* $${record.tp1} | 🎯 *الهدف الثاني:* $${record.tp2}

${advice}

🔗 [فتح شارت Binance على TradingView](https://www.tradingview.com/chart/?symbol=BINANCE:${record.symbol})
*SOSSKA CRYPTO SCREENER V2*`;
}

export async function processTargetHitAlert(record: SignalHistoryRecord, settings: ScreenerSettings): Promise<boolean> {
  if (!settings.enableTelegram || !settings.telegramBotToken) {
    return false;
  }

  // Deduplicate target hits: only alert once per record per status
  const key = `${record.id}_${record.status}`;
  if (alertCache.has(key)) {
    return false;
  }
  alertCache.set(key, { state: record.status, timestamp: Date.now() });

  const text = formatTelegramTargetHitMessage(record);
  const subscribers = getTelegramSubscribers();
  if (subscribers.length === 0 && settings.telegramChatId) {
    subscribers.push(settings.telegramChatId);
  }

  for (const targetChatId of subscribers) {
    queueTelegramMessage(async () => {
      const res = await sendTelegramMessage(settings.telegramBotToken, targetChatId, text);
      if (res.success) {
        console.log(`[Telegram Target Alert Sent] ${record.symbol} (${record.status}) -> Chat ${targetChatId}`);
      }
    });
  }

  return true;
}

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
  text: string,
  replyMarkup?: any
): Promise<{ success: boolean; message: string; messageId?: number }> {
  if (!token || !chatId) {
    return {
      success: false,
      message: 'Telegram Bot Token or Chat ID is not configured in Settings.',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

// Sequential queue to strictly prevent Telegram rate-limit (429 Too Many Requests) drops
const messageQueue: Array<() => Promise<void>> = [];
let isQueueProcessing = false;

async function processQueue() {
  if (isQueueProcessing) return;
  isQueueProcessing = true;
  try {
    while (messageQueue.length > 0) {
      const job = messageQueue.shift();
      if (job) {
        try {
          await job();
        } catch (err: any) {
          console.error('[Telegram Queue] Error processing message:', err.message);
        }
        // Delay 1.1s between consecutive messages to comply with Telegram 1 msg/sec per chat limit
        await new Promise(r => setTimeout(r, 1100));
      }
    }
  } finally {
    isQueueProcessing = false;
  }
}

export function queueTelegramMessage(fn: () => Promise<void>) {
  messageQueue.push(fn);
  processQueue().catch(console.error);
}

export async function processSetupAlert(setup: TradingSetup, settings: ScreenerSettings): Promise<boolean> {
  if (!settings.enableTelegram || !settings.telegramBotToken) {
    return false;
  }

  // Only send high-conviction confirmed signals
  if (setup.state !== 'CONFIRMED_LONG' && setup.state !== 'CONFIRMED_SHORT') {
    return false;
  }

  // Honor Long/Short settings toggles
  if (setup.state === 'CONFIRMED_LONG' && settings.enableLong === false) {
    return false;
  }
  if (setup.state === 'CONFIRMED_SHORT' && settings.enableShort === false) {
    return false;
  }

  if (setup.score < settings.minScoreAlert) {
    return false;
  }

  const existing = alertCache.get(setup.symbol);
  const now = Date.now();

  // Deduplicate: Don't resend identical state for same symbol within 45 minutes
  if (existing && existing.state === setup.state && now - existing.timestamp < 45 * 60 * 1000) {
    return false;
  }

  // Broadcast to all active subscribers (owner + friends who joined)
  const subscribers = getTelegramSubscribers();
  if (subscribers.length === 0 && settings.telegramChatId) {
    subscribers.push(settings.telegramChatId);
  }

  const text = formatTelegramSignalMessage(setup);

  for (const targetChatId of subscribers) {
    queueTelegramMessage(async () => {
      const res = await sendTelegramMessage(settings.telegramBotToken, targetChatId, text);
      if (res.success) {
        alertCache.set(setup.symbol, { state: setup.state, timestamp: now });
        console.log(`[Telegram Alert Sent] ${setup.symbol} -> Chat ${targetChatId} (${setup.state}, Score: ${setup.score}/100, MsgID: ${res.messageId})`);
      } else {
        console.error(`[Telegram Alert Failed] ${setup.symbol} -> Chat ${targetChatId}: ${res.message}`);
      }
    });
  }

  return true;
}

export async function handleIncomingTelegramMessage(
  chatId: string,
  rawText: string,
  userName?: string
): Promise<void> {
  const settings = getSettings();
  if (!settings.telegramBotToken) return;

  // Automatically register and persist subscriber
  addTelegramSubscriber(chatId);

  const setups = getCurrentSetups();
  const text = (rawText || '').trim();

  let replyText = '';
  if (text === '/start' || text.startsWith('/start') || text === 'ابدأ' || text.toLowerCase() === 'start') {
    replyText = `👋 *أهلاً بك يا ${userName || 'المتداول'} في بوت إشارات SOSSKA V2!* 🚀

✅ *تم تفعيل اشتراكك بنجاح!*
ستصلك إشعارات الصفقات القوية فور صدورها من الماسح تلقائياً هنا في هذه المحادثة.

📊 *ما يقدمه البوت اللحظي:*
• 🟢 إشارات شراء مبكرة (Confirmed Longs)
• 🔴 إشارات بيع وتصحيح (Confirmed Shorts)
• 🐳 صفقات الحيتان وتوكنات P-Tokens وعقود ما قبل التداول
• 🎯 نقاط دخول دقيقة، أهداف TP1 (+1.5x) و TP2 (+2.5x)، ووقف خسارة محكم
• ⏳ حساب تقريبي للمدة الزمنية لانتهاء الصفقة

👇 *اضغط على الأزرار بالأسفل للاستعلام اللحظي، أو اكتب رمز أي عملة (مثل BTC أو SUI أو SOL):*`;
  } else {
    replyText = handleTelegramCommand(text, setups, settings);
  }

  await sendTelegramMessage(settings.telegramBotToken, chatId, replyText, TELEGRAM_MAIN_KEYBOARD);
}

export function handleTelegramCommand(command: string, setups: TradingSetup[], settings: ScreenerSettings): string {
  const raw = command.trim();
  let cleanCmd = raw.toLowerCase();

  // Normalize keyboard button titles with emojis
  if (cleanCmd.includes('/top') || cleanCmd.includes('أفضل الفرص')) cleanCmd = '/top';
  else if (cleanCmd.includes('/long') || cleanCmd.includes('صفقات الشراء')) cleanCmd = '/long';
  else if (cleanCmd.includes('/short') || cleanCmd.includes('صفقات البيع')) cleanCmd = '/short';
  else if (cleanCmd.includes('/signals') || cleanCmd.includes('/track') || cleanCmd.includes('متتبع الأرباح')) cleanCmd = '/signals';
  else if (cleanCmd.includes('/scan') || cleanCmd.includes('فحص فوري')) cleanCmd = '/scan';
  else if (cleanCmd.includes('/status') || cleanCmd.includes('حالة الماسح')) cleanCmd = '/status';
  else if (cleanCmd.includes('/settings') || cleanCmd.includes('الإعدادات')) cleanCmd = '/settings';

  if (cleanCmd.startsWith('/start')) {
    return `👋 *أهلاً بك في بوت SOSSKA V2!* 🚀

✅ اشتراكك مفعل لاستلام الإشارات والتوصيات فور تأكيدها.

*الأوامر المتاحة:*
/top - أفضل الفرص الحالية حسب التقييم الفني
/long - صفقات الشراء المؤكدة حالياً
/short - صفقات البيع المؤكدة حالياً
/scan - تشغيل فحص فوري للسوق
/signals - متتبع مسار الأرباح للصفقات الأخيرة
/status - حالة عمل الماسح ومصدر بيانات بينانس
/settings - إعدادات البوت والحد الأدنى للتقييم

💡 يمكنك أيضاً كتابة اسم أي عملة مباشرة (مثل SUI أو BTC أو SOL) للحصول على تحليلها الفوري.`;
  }

  if (cleanCmd.startsWith('/track') || cleanCmd.startsWith('/pnl') || cleanCmd.startsWith('/signals')) {
    const history = getSignalsHistory();
    const activeOrRecent = history.slice(0, 6);
    if (activeOrRecent.length === 0) return 'لا توجد توصيات مسجلة حالياً.';

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

        return `💎 *#${s.symbol}* (${isLong ? 'LONG 🟢' : 'SHORT 🔴'})\n` +
          `• سعر الدخول: $${s.entry} ➡️ السعر الحالي: $${s.currentPrice || s.exitPrice || s.entry}\n` +
          `• الربح/الخسارة: *${pnlSign}${pnl.toFixed(2)}%* ${pnlEmoji} (${s.status})\n` +
          `• المسار: *${trajText}* | دقة الدخول: *${accText}*\n` +
          `• ذروة الربح: +${(s.maxRunUpPercent ?? pnl).toFixed(2)}% | أقصى تراجع: -${(s.maxDrawdownPercent ?? 0).toFixed(2)}%`;
      }).join('\n\n');
  }

  if (cleanCmd.startsWith('/top')) {
    const top = [...setups].sort((a, b) => b.score - a.score).slice(0, 5);
    if (top.length === 0) return '🟡 جاري تحديث بيانات السوق... لا توجد فرص جاهزة حالياً.';
    return `🔥 *أعلى 5 فرص وفق التقييم الفني المؤسساتي:*\n\n` + top.map((s, i) => {
      const dur = estimateTradeDuration(s);
      const isLong = s.state === 'CONFIRMED_LONG';
      const badge = isLong ? '🟢 LONG' : s.state === 'CONFIRMED_SHORT' ? '🔴 SHORT' : '🟡 WAIT';
      return `${i + 1}. *#${s.symbol}* [${badge}] - تقييم: *${s.score}/100*\n   📍 دخول: $${s.entry} | 🎯 TP1: $${s.tp1} | 🛑 SL: $${s.sl}\n   ⏳ المدة التقديرية: ~${dur.tp1Text} (هدف 1) • ${dur.speedCategoryArabic}`;
    }).join('\n\n');
  }

  if (cleanCmd.startsWith('/long')) {
    const longs = setups.filter(s => s.state === 'CONFIRMED_LONG');
    if (longs.length === 0) return '🟡 لا توجد صفقات شراء مؤكدة في هذه اللحظة بالذات. مؤشرات السوق تخضع للتقييم.';
    return `🟢 *صفقات الشراء المؤكدة (Confirmed Longs):*\n\n` + longs.slice(0, 8).map(s => {
      const dur = estimateTradeDuration(s);
      return `• *#${s.symbol}* | تقييم: *${s.score}/100*\n  📍 دخول: $${s.entry} | 🎯 TP1: $${s.tp1} | 🛑 SL: $${s.sl}\n  ⏳ المدة: ~${dur.tp1Text} | توافق الفريمات MTF: ${s.mtf.alignmentFraction}`;
    }).join('\n\n');
  }

  if (cleanCmd.startsWith('/short')) {
    const shorts = setups.filter(s => s.state === 'CONFIRMED_SHORT');
    if (shorts.length === 0) return '🔴 لا توجد صفقات بيع مؤكدة حالياً في السوق.';
    return `🔴 *صفقات البيع المؤكدة (Confirmed Shorts):*\n\n` + shorts.slice(0, 8).map(s => {
      const dur = estimateTradeDuration(s);
      return `• *#${s.symbol}* | تقييم: *${s.score}/100*\n  📍 دخول: $${s.entry} | 🎯 TP1: $${s.tp1} | 🛑 SL: $${s.sl}\n  ⏳ المدة: ~${dur.tp1Text} | توافق الفريمات MTF: ${s.mtf.alignmentFraction}`;
    }).join('\n\n');
  }

  if (cleanCmd.startsWith('/scan') || cleanCmd.startsWith('/status')) {
    const confirmedLongs = setups.filter(s => s.state === 'CONFIRMED_LONG').length;
    const confirmedShorts = setups.filter(s => s.state === 'CONFIRMED_SHORT').length;
    const waiting = setups.filter(s => s.state === 'WAIT_FOR_CONFIRMATION').length;
    const subscribers = getTelegramSubscribers();

    return `📡 *حالة ماسح SOSSKA V2 اللحظية*
• حالة الخادم: 🟢 يعمل بنشاط
• عدد العملات المفحوصة: ${setups.length} عملة
• إشارات الشراء المؤكدة: ${confirmedLongs} 🟢
• إشارات البيع المؤكدة: ${confirmedShorts} 🔴
• في انتظار التأكيد: ${waiting} 🟡
• دورة الفحص التلقائي: كل ${settings.scanIntervalSeconds} ثانية (5 دقائق)
• الحد الأدنى للتنبيه: ${settings.minScoreAlert}/100
• عدد المشتركين في البوت: ${subscribers.length} مستخدم`;
  }

  if (cleanCmd.startsWith('/settings')) {
    return `⚙️ *إعدادات البوت والماسح الحالية*
• الحد الأدنى للتنبيه: ${settings.minScoreAlert}/100
• أدنى حجم تداول 24س: $${(settings.min24hVolumeUsd / 1e6).toFixed(1)}M
• نسبة المخاطرة للصفقة: ${settings.riskPercentage}%
• صفقات الشراء مفعلة: ${settings.enableLong ? 'نعم ✅' : 'معطلة ❌'}
• صفقات البيع مفعلة: ${settings.enableShort ? 'نعم ✅' : 'معطلة ❌'}
• رصد الحيتان: ${settings.enableWhaleFlow ? 'نعم 🐳' : 'لا'}`;
  }

  // Check if user queried a specific coin symbol (e.g. "sui", "btc", "eth", "pengu", "sndk")
  const cleanSym = cleanCmd.replace(/[^a-z0-9]/g, '').toUpperCase();
  if (cleanSym.length >= 2) {
    const coinSetup = setups.find(s =>
      s.symbol.toUpperCase() === cleanSym ||
      s.symbol.toUpperCase() === cleanSym + 'USDT' ||
      s.symbol.toUpperCase().replace(/USDT$/, '') === cleanSym ||
      s.symbol.toUpperCase().replace(/USDTP$/, '') === cleanSym
    );

    if (coinSetup) {
      const isLong = coinSetup.state === 'CONFIRMED_LONG';
      const stateBadge = isLong
        ? '🟢 صفقة شراء مؤكدة (Confirmed Long)'
        : coinSetup.state === 'CONFIRMED_SHORT'
        ? '🔴 صفقة بيع مؤكدة (Confirmed Short)'
        : '🟡 في انتظار اكتمال شروط الدخول (Wait for Confirmation)';
      const dur = estimateTradeDuration(coinSetup);

      return `💎 *تقرير وتحليل عملة #${coinSetup.symbol} اللحظي*

📊 *التقييم الفني:* ${coinSetup.score}/100 (${coinSetup.scoreBreakdown.scoreLabel})
⚡ *الحالة الفنية:* ${stateBadge}
💵 *السعر الحالي:* $${coinSetup.price} (${coinSetup.change24h >= 0 ? '+' : ''}${coinSetup.change24h}%)

🎯 *مستويات الصفقة المقترحة:*
• 📍 منطقة الدخول: $${coinSetup.entry}
• 🎯 الهدف الأول (TP1): $${coinSetup.tp1}
• 🎯 الهدف الثاني (TP2): $${coinSetup.tp2}
• 🛑 وقف الخسارة (SL): $${coinSetup.sl}
• ⚖️ نسبة العائد للمخاطرة: 1:${coinSetup.riskRewardRatio}
• ⏱️ المدة التقديرية: ~${dur.tp1Text} (هدف 1) • ${dur.speedCategoryArabic}

📈 *المؤشرات الفنية (15M):*
• RSI: ${coinSetup.indicators.rsi.toFixed(1)} | MFI: ${coinSetup.indicators.mfi.toFixed(1)}
• VWAP: $${coinSetup.indicators.vwap.toFixed(4)} (${coinSetup.indicators.priceVsVwap === 'above' ? 'فوق الفواب 🟢' : 'تحت الفواب 🔴'})
• توافق الفريمات MTF: ${coinSetup.mtf.alignmentFraction}

🔗 [فتح الشارت على TradingView](https://www.tradingview.com/chart/?symbol=BINANCE:${coinSetup.symbol})`;
    }
  }

  return `❓ *أمر غير معروف.*
يرجى استخدام الأزرار أدناه أو كتابة /start لعرض قائمة الأوامر، أو كتابة رمز أي عملة (مثل BTC أو SUI).`;
}

let isPollingActive = false;
let pollingOffset = 0;

export async function startTelegramPolling(): Promise<void> {
  if (isPollingActive) return;
  isPollingActive = true;
  console.log('[Telegram Bot] Long polling service started successfully.');

  (async () => {
    while (isPollingActive) {
      const settings = getSettings();
      if (!settings.enableTelegram || !settings.telegramBotToken) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      try {
        const url = `https://api.telegram.org/bot${settings.telegramBotToken}/getUpdates?offset=${pollingOffset}&timeout=15`;
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            pollingOffset = update.update_id + 1;
            const msg = update.message;
            if (msg && msg.text && msg.chat?.id) {
              const chatId = String(msg.chat.id);
              const text = msg.text.trim();
              const userName = msg.from?.first_name || msg.chat?.first_name || 'صديقي المتداول';
              await handleIncomingTelegramMessage(chatId, text, userName);
            }
          }
        }
      } catch (err: any) {
        // Network timeout / transient glitch is normal in long polling
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  })().catch(err => {
    console.error('[Telegram Bot] Polling fatal error:', err);
    isPollingActive = false;
  });
}

export function stopTelegramPolling(): void {
  isPollingActive = false;
}
