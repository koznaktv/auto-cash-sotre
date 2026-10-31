import { getSystemSettingsAsync, updateSystemSettingsAsync } from './db';
import { sendAdminAlert } from './telegram';

export interface ExchangeRateConfig {
  baseRate: number;
  margin: number;
  effectiveRate: number;
  lastChecked?: string;
  source?: string;
}

const DEFAULT_BASE_RATE = 14375; // Idlib Market Selling Rate (سعر البيع في إدلب)
const DEFAULT_MARGIN = 15;       // Added margin (+15 SYP per 1 USD)

/**
 * Attempts to fetch live Syrian Pound exchange rate for Idlib from multiple reliable sources.
 * If external sources are unreachable or blocked, safely returns the latest confirmed base rate.
 */
export async function fetchLiveIdlibMarketRate(): Promise<{ rate: number; source: string; raw?: any }> {
  const sources = [
    {
      name: 'Syria Markets Live Feed',
      url: 'https://sp-today.com/api/cur/rates',
    },
    {
      name: 'SyriaTV Live Currency Tracker',
      url: 'https://www.syria.tv/api/currency/rates',
    },
  ];

  for (const src of sources) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(src.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        // Look for Idlib selling rate (around 14,000 - 15,500)
        const match = text.match(/(?:idlib|ادلب)[^}]*?(?:sell|بيع|price)[\s":]+([1-2][0-9]{4})/i);
        if (match && match[1]) {
          const parsed = Number(match[1]);
          if (parsed >= 12000 && parsed <= 25000) {
            return { rate: parsed, source: src.name };
          }
        }
      }
    } catch {
      // Continue to next source or fallback
    }
  }

  // Fallback to configured or verified current market rate for Idlib
  const settings = await getSystemSettingsAsync();
  const fallback = Number(settings.shamcashBaseRate || DEFAULT_BASE_RATE);
  return { rate: fallback > 0 ? fallback : DEFAULT_BASE_RATE, source: 'Idlib Confirmed Benchmark (14,375)' };
}

/**
 * Retrieves the current rate configuration.
 */
export async function getExchangeRateConfig(): Promise<ExchangeRateConfig> {
  const settings = await getSystemSettingsAsync();
  const baseRate = Number(settings.shamcashBaseRate || DEFAULT_BASE_RATE);
  const margin = settings.shamcashRateMargin !== undefined ? Number(settings.shamcashRateMargin) : DEFAULT_MARGIN;
  const effectiveRate = Number(settings.shamcashExchangeRate || (baseRate + margin));
  const lastChecked = settings.shamcashRateLastChecked || new Date().toISOString();

  return {
    baseRate,
    margin,
    effectiveRate,
    lastChecked,
  };
}

/**
 * Sets the rate margin (e.g. +15 or +10 SYP).
 * Immediately recalculates effective exchange rate: effectiveRate = baseRate + margin.
 * Saves to DB & sends an alert to Admin on Telegram.
 */
export async function setRateMargin(margin: number, triggeredBy: string = 'Admin'): Promise<ExchangeRateConfig> {
  const cleanMargin = Math.max(0, Math.min(1000, Number(margin)));
  const current = await getExchangeRateConfig();
  const newEffective = current.baseRate + cleanMargin;
  const now = new Date().toISOString();

  await updateSystemSettingsAsync({
    shamcashRateMargin: cleanMargin,
    shamcashExchangeRate: newEffective,
    shamcashRateLastChecked: now,
  });

  const notifyText = `
⚡️ <b>شامكەش كۇرس پەرقى (Margin) يېڭىلاندى!</b> 🚀

👤 <b>بۇيرۇق بەرگۈچى:</b> ${triggeredBy}
🏛 <b>ئىدلىپ سېتىش باھاسى (بيع):</b> <code>${current.baseRate.toLocaleString()}</code> سۈرىيە لىراسى
➕ <b>قوشۇلغان پايدا پەرقى:</b> <b>+${cleanMargin} سۈرىيە لىراسى</b>
💰 <b>يېڭى ئۈنۈملۈك كۇرس:</b> <b>1 USD = ${newEffective.toLocaleString()} SYP</b>

⚡️ <i>ھازىردىن باشلاپ خېرىدارلار شامكەش ئارقىلىق پۇل سالغاندا بارلىق ھېسابلاشلار 1 USD = ${newEffective.toLocaleString()} SYP بويىچە ئېلىپ بېرىلىدۇ!</i>
`.trim();

  sendAdminAlert(notifyText).catch(() => {});

  return {
    baseRate: current.baseRate,
    margin: cleanMargin,
    effectiveRate: newEffective,
    lastChecked: now,
  };
}

/**
 * Sets the base market selling rate manually (e.g. 14375).
 * Immediately recalculates effective rate: effectiveRate = baseRate + margin.
 */
export async function setBaseMarketRate(baseRate: number, triggeredBy: string = 'Admin'): Promise<ExchangeRateConfig> {
  const cleanBase = Math.max(5000, Math.min(50000, Number(baseRate)));
  const current = await getExchangeRateConfig();
  const newEffective = cleanBase + current.margin;
  const now = new Date().toISOString();

  await updateSystemSettingsAsync({
    shamcashBaseRate: cleanBase,
    shamcashExchangeRate: newEffective,
    shamcashRateLastChecked: now,
  });

  const notifyText = `
🏛 <b>ئىدلىپ ئاساسىي سېتىش باھاسى (بيع) يېڭىلاندى!</b> 📈

👤 <b>تەڭشىگۈچى:</b> ${triggeredBy}
🏛 <b>يېڭى ئاساسىي باھا:</b> <code>${cleanBase.toLocaleString()}</code> سۈرىيە لىراسى
➕ <b>قوشۇلغان پايدا پەرقى:</b> <b>+${current.margin} سۈرىيە لىراسى</b>
💰 <b>سۇپىدىكى يېڭى كۇرس:</b> <b>1 USD = ${newEffective.toLocaleString()} SYP</b>
`.trim();

  sendAdminAlert(notifyText).catch(() => {});

  return {
    baseRate: cleanBase,
    margin: current.margin,
    effectiveRate: newEffective,
    lastChecked: now,
  };
}

/**
 * Performs the twice-daily automated rate check.
 * - Fetches Idlib market rate
 * - Adds current margin (e.g. +15)
 * - Updates DB if rate changed or if forceNotify is true
 * - Sends instant Telegram notification to Admin
 */
export async function runScheduledRateCheck(forceNotify: boolean = false): Promise<{
  updated: boolean;
  config: ExchangeRateConfig;
  message: string;
}> {
  const current = await getExchangeRateConfig();
  const fetched = await fetchLiveIdlibMarketRate();
  const newBaseRate = fetched.rate;
  const newEffective = newBaseRate + current.margin;
  const now = new Date().toISOString();

  const rateChanged = newBaseRate !== current.baseRate || newEffective !== current.effectiveRate;

  if (rateChanged || forceNotify) {
    await updateSystemSettingsAsync({
      shamcashBaseRate: newBaseRate,
      shamcashExchangeRate: newEffective,
      shamcashRateLastChecked: now,
    });

    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Damascus',
    });

    const alertCard = `
📊🔔 <b>[كۈنلۈك پېرېۋوت باھاسى تەكشۈرۈلدى — ئىدلىپ]</b> 🇸🇾

🏛 <b>ئىدلىپ سېتىش باھاسى (بيع):</b> <code>${newBaseRate.toLocaleString()}</code> سۈرىيە لىراسى
➕ <b>قوشۇلغان پايدا پەرقى (Margin):</b> <b>+${current.margin} سۈرىيە لىراسى</b>
💰 <b>بېكىتىلگەن ھەميان كۇرسى:</b> <b>1 USD = ${newEffective.toLocaleString()} SYP</b>
⏰ <b>تەكشۈرۈلگەن ۋاقىت:</b> <code>${timeStr} (دەمەشقى ۋاقتى)</code>
📡 <b>مەنبە:</b> ${fetched.source}

💡 <i>پەرقىنى ئۆزگەرتمەكچى بولسىڭىز، ماڭا «<b>15 لىرا قات</b>» ياكى «<b>10 لىرا قات</b>» دەپ ئەۋەتسىڭىز بولىدۇ.</i>
`.trim();

    await sendAdminAlert(alertCard).catch(() => {});

    return {
      updated: true,
      config: {
        baseRate: newBaseRate,
        margin: current.margin,
        effectiveRate: newEffective,
        lastChecked: now,
        source: fetched.source,
      },
      message: 'كۇرس يېڭىلاندى ۋە باشقۇرغۇچىغا ئۇچۇر يوللاندى',
    };
  }

  return {
    updated: false,
    config: current,
    message: 'باھادا ئۆزگىرىش بولمىدى',
  };
}
