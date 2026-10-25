import { getSystemSettingsAsync } from '../db';

const TSA_API_BASE = 'https://tsa-api.com/api/v1';

export interface ShamcashTx {
  tranId: string;
  amount: number;
  currency: string;
  usdAmount: number;
  datetime: string;
  fromName: string;
  toName?: string;
  senderAccount?: string;
  note?: string;
}

export interface VerifyTxResult {
  success: boolean;
  found: boolean;
  transaction?: ShamcashTx;
  message?: string;
  error?: string;
}

/**
 * Normalizes user-entered Transaction ID:
 * - Converts Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to standard Latin (0-9)
 * - Trims whitespace and strips common prefixes like '#', 'TX:', 'ID:', etc.
 */
export function normalizeTxId(raw: string): string {
  if (!raw) return '';
  let normalized = String(raw).trim();
  // Convert Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to standard Latin (0-9)
  normalized = normalized
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');

  // Smart extraction: If customer pasted full text containing "رقم العملية: 84920183" or "عملية 84920183"
  const receiptMatch = normalized.match(
    /(?:رقم\s*العملية|رقم\s*الاشعار|العملية|الاشعار|tx(?:id)?|tran(?:s(?:action)?)?(?:id)?|ref(?:erence)?|no|num|#)[\s:#_-]*([0-9a-zA-Z]{5,32})/i
  );
  if (receiptMatch && receiptMatch[1]) {
    return receiptMatch[1].trim();
  }

  // If long text was pasted and contains a distinct 6-20 digit number
  if (normalized.length > 25) {
    const digitsMatch = normalized.match(/\b([0-9]{6,20})\b/);
    if (digitsMatch && digitsMatch[1]) {
      return digitsMatch[1].trim();
    }
  }

  normalized = normalized.replace(/^(tx|id|sc|num|no)[\s:#_-]*/i, '');
  normalized = normalized.replace(/^#+/, '');
  return normalized.trim();
}

/**
 * Retrieves TSA API configuration from DB system settings with environment variable fallback.
 */
export async function getTsaConfig(): Promise<{
  apiKey: string;
  shamcashAddress: string;
  autoDepositEnabled: boolean;
  exchangeRate: number;
}> {
  const settings = await getSystemSettingsAsync();
  const apiKey = (settings.tsaApiKey || process.env.TSA_API_KEY || '').trim();
  const shamcashAddress = (settings.shamcashAddress || process.env.SHAMCASH_ADDRESS || '').trim();
  const autoDepositEnabled =
    settings.tsaAutoDepositEnabled !== undefined
      ? Boolean(settings.tsaAutoDepositEnabled)
      : process.env.TSA_AUTO_DEPOSIT !== 'false';
  const exchangeRate = Number(settings.shamcashExchangeRate || process.env.SHAMCASH_EXCHANGE_RATE || 143);

  return {
    apiKey,
    shamcashAddress,
    autoDepositEnabled,
    exchangeRate: exchangeRate > 0 ? exchangeRate : 143,
  };
}

/**
 * Checks TSA API connection status using an API key.
 */

/**
 * Fetches all linked Sham Cash and Syriatel accounts from TSA API.
 */
export async function getLinkedAccounts(apiKey: string): Promise<{
  success: boolean;
  shamcash: { account_address: string; [key: string]: any }[];
  syriatel: any[];
  error?: string;
}> {
  try {
    const cleanKey = apiKey.trim();
    if (!cleanKey) return { success: false, shamcash: [], syriatel: [], error: 'TSA API Key كىرگۈزۈلمىگەن' };

    const res = await fetch(`${TSA_API_BASE}?resource=accounts&action=list`, {
      method: 'GET',
      headers: {
        'X-Api-Key': cleanKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return {
        success: false,
        shamcash: [],
        syriatel: [],
        error: data?.error || data?.message || `ھېساباتلارنى تەكشۈرۈش مەغلۇپ بولدى (${res.status})`,
      };
    }

    return {
      success: true,
      shamcash: Array.isArray(data?.data?.shamcash) ? data.data.shamcash : [],
      syriatel: Array.isArray(data?.data?.syriatel) ? data.data.syriatel : [],
    };
  } catch (err: any) {
    return { success: false, shamcash: [], syriatel: [], error: err?.message || 'TSA API ئۇلىنىش مەغلۇپ بولدى' };
  }
}

export async function checkTsaStatus(apiKey: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${TSA_API_BASE}?resource=status`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return {
        ok: false,
        message: data?.error || data?.message || `TSA API خاتالىقى (Status ${res.status})`,
      };
    }

    return { ok: true, message: 'TSA API مۇۋەپپەقىيەتلىك ئۇلاندى' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'TSA API غا ئۇلىنىش مەغلۇپ بولدى' };
  }
}

/**
 * Fetches the balances of the configured Shamcash account.
 */
export async function getShamcashBalance(
  apiKeyOverride?: string,
  accountAddressOverride?: string
): Promise<{
  success: boolean;
  balances?: { currency: string; balance: number }[];
  accountAddress?: string;
  error?: string;
}> {
  try {
    const config = await getTsaConfig();
    const apiKey = (apiKeyOverride || config.apiKey).trim();
    const accountAddress = (accountAddressOverride || config.shamcashAddress).trim();

    if (!apiKey) return { success: false, error: 'TSA API ئاچقۇچى تەڭشەلمىگەن' };
    if (!accountAddress) return { success: false, error: 'شامكەش ئادرېسى كىرگۈزۈلمىگەن' };

    const url = `${TSA_API_BASE}?resource=shamcash&action=balance&account_address=${encodeURIComponent(
      accountAddress
    )}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || `شامكەش قالدۇقىنى ئېلىش مەغلۇپ بولدى (${res.status})`,
      };
    }

    const balances = Array.isArray(data?.data?.balances)
      ? data.data.balances.map((b: any) => ({
          currency: String(b.currency || 'USD').toUpperCase(),
          balance: Number(b.balance || 0),
        }))
      : [];

    return {
      success: true,
      balances,
      accountAddress: data?.data?.account_address || accountAddress,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'شامكەش ئۇلىنىشى مەغلۇپ بولدى' };
  }
}

/**
 * Searches for an incoming Sham Cash transaction by its Transaction ID (رقم العملية).
 * If found, verifies the recipient, direction, and converts to USD using the configured exchange rate.
 */
export async function verifyShamcashTransaction(
  rawTxId: string,
  options?: {
    apiKey?: string;
    accountAddress?: string;
    exchangeRate?: number;
  }
): Promise<VerifyTxResult> {
  const normalizedTx = normalizeTxId(rawTxId);
  if (!normalizedTx) {
    return { success: false, found: false, message: 'تالون نومۇرى كىرگۈزۈلمىدى' };
  }

  const config = await getTsaConfig();
  const apiKey = (options?.apiKey || config.apiKey).trim();
  const accountAddress = (options?.accountAddress || config.shamcashAddress).trim();
  const exchangeRate = options?.exchangeRate || config.exchangeRate;

  if (!apiKey) {
    return { success: false, found: false, error: 'TSA API ئاچقۇچى تەڭشەلمىگەن' };
  }
  if (!accountAddress) {
    return { success: false, found: false, error: 'شامكەش ئادرېسى تەڭشەلمىگەن' };
  }

  try {
    // 1. First attempt: call find_tx
    const findUrl = `${TSA_API_BASE}?resource=shamcash&action=find_tx&tx=${encodeURIComponent(
      normalizedTx
    )}&account_address=${encodeURIComponent(accountAddress)}`;

    const res = await fetch(findUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        found: false,
        error: data?.error || data?.message || `TSA API خاتالىقى (${res.status})`,
      };
    }

    let txItem: any = null;

    if (data?.success && data?.data?.found && data?.data?.transaction) {
      txItem = data.data.transaction;
    } else {
      // 2. Fallback: check recent incoming logs in case find_tx has indexing latency
      const logsUrl = `${TSA_API_BASE}?resource=shamcash&action=logs&account_address=${encodeURIComponent(
        accountAddress
      )}`;
      const logsRes = await fetch(logsUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      const logsData = await logsRes.json().catch(() => null);
      if (logsData?.success && Array.isArray(logsData?.data?.items)) {
        const match = logsData.data.items.find(
          (item: any) =>
            normalizeTxId(String(item.tran_id || item.id || '')) === normalizedTx ||
            String(item.tran_id || item.id || '').includes(normalizedTx)
        );
        if (match) {
          txItem = match;
        }
      }
    }

    if (!txItem) {
      return {
        success: true,
        found: false,
        message: 'شامكەشتىن بۇ تالون تېپىلمىدى. تالون نومۇرىنىڭ توغرىلىقىنى جەزملەشتۈرۈڭ ياكى 10-30 سېكۇنتتىن كېيىن قايتا سىناڭ.',
      };
    }

    // Direction check: must be incoming
    if (txItem.direction && String(txItem.direction).toLowerCase() === 'outgoing') {
      return {
        success: false,
        found: false,
        error: 'بۇ چىقىم قىلىنغان تالون (Outgoing)، كىرىم قىلىنغان تالون ئەمەس!',
      };
    }

    const rawAmount = Number(txItem.amount || 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return {
        success: false,
        found: false,
        error: 'تالوندىكى سومما خاتا',
      };
    }

    const currency = String(txItem.currency || 'USD').toUpperCase();
    let usdAmount = rawAmount;

    if (currency === 'SYP') {
      // Syrian Pound to USD conversion
      usdAmount = Math.round((rawAmount / exchangeRate) * 100) / 100;
    } else if (currency === 'USD') {
      usdAmount = Math.round(rawAmount * 100) / 100;
    } else {
      // Default to 1:1 if not SYP
      usdAmount = Math.round(rawAmount * 100) / 100;
    }

    if (usdAmount <= 0) {
      return {
        success: false,
        found: false,
        error: 'ئايلاندۇرۇلغان سومما بەك تۆۋەن بولۇپ كەتتى',
      };
    }

    const tx: ShamcashTx = {
      tranId: String(txItem.tran_id || normalizedTx),
      amount: rawAmount,
      currency,
      usdAmount,
      datetime: String(txItem.datetime || new Date().toISOString()),
      fromName: String(txItem.from_name || ''),
      toName: String(txItem.to_name || ''),
      senderAccount: String(txItem.account || ''),
      note: String(txItem.note || ''),
    };

    return {
      success: true,
      found: true,
      transaction: tx,
      message: 'تالون مۇۋەپپەقىيەتلىك دەلىللەندى',
    };
  } catch (err: any) {
    return {
      success: false,
      found: false,
      error: err?.message || 'شامكەش دەلىللەش جەريانىدا خاتالىق كۆرۈلدى',
    };
  }
}
