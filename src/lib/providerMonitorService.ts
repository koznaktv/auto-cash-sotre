/**
 * AUTO CASH - Automated Provider Price & Stock Monitor Service
 *
 * 1. Real-time scanner for Othman Store API (wholesale price & stock availability)
 * 2. Auto-detects price increases/decreases and auto-recalculates retail prices preserving margins:
 *    - Social media follower/like services: 30% profit
 *    - Telecom, Syriatel Cash & Turkey cards: 15% profit
 *    - Other services: preserves package's existing margin ratio
 * 3. Auto-detects paused/out-of-stock items and marks `available: false` to protect orders
 * 4. Auto-restores items when back in stock (`available: true`)
 * 5. Sends Telegram notifications to admin for price changes and paused items
 * 6. Records monitoring state and logs for admin dashboard
 */

import fs from 'fs';
import path from 'path';
import { getServicesListAsync, saveServicesListAsync, invalidateServicesCache } from './servicesDb';
import { loadStoredProviderConfig } from './provider/providerConfigStore';
import { getSystemSettingsAsync } from './db';
import { sendAdminAlert } from './telegram';

export interface ProviderChangeRecord {
  type: 'price_up' | 'price_down' | 'paused' | 'restored';
  serviceId: string;
  serviceName: string;
  pkgId: string;
  pkgTitle: string;
  oldCost?: number;
  newCost?: number;
  oldPrice?: number;
  newPrice?: number;
  time: string;
}

export interface ProviderMonitorState {
  lastSyncAt: string | null;
  lastSyncStatus: 'success' | 'failed' | 'idle';
  lastError: string | null;
  providerBalance: number | null;
  providerCurrency: string;
  stats: {
    totalScanned: number;
    matchedPackages: number;
    priceChangedCount: number;
    pausedCount: number;
    restoredCount: number;
    durationMs: number;
  };
  recentChanges: ProviderChangeRecord[];
}

const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'provider_monitor_state.json');

const DEFAULT_STATE: ProviderMonitorState = {
  lastSyncAt: null,
  lastSyncStatus: 'idle',
  lastError: null,
  providerBalance: null,
  providerCurrency: 'USD',
  stats: {
    totalScanned: 0,
    matchedPackages: 0,
    priceChangedCount: 0,
    pausedCount: 0,
    restoredCount: 0,
    durationMs: 0,
  },
  recentChanges: [],
};

export function getProviderMonitorState(): ProviderMonitorState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not read provider_monitor_state.json:', err);
  }
  return DEFAULT_STATE;
}

function saveProviderMonitorState(state: ProviderMonitorState): void {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save provider_monitor_state.json:', err);
  }
}

/**
 * Determine profit margin target based on category and service
 */
function getTargetProfitMargin(service: any, pkg: any): number {
  const sId = service.id || '';
  const cat = service.category || '';

  // 1. Social media services (followers, likes, members, reactions) -> 30%
  if (cat === 'social' || sId.startsWith('othman_social_')) {
    return 0.30;
  }

  // 2. Telecom, Syriatel Cash & Turkey cards -> 15%
  const telecomIds = ['othman_turk_telekom', 'othman_turkcell', 'othman_mtn', 'othman_syriatel', 'othman_vodafone_cash'];
  if (telecomIds.includes(sId)) {
    return 0.15;
  }

  // 3. Other cards -> 15%
  if (cat === 'cards') {
    return 0.15;
  }

  // 4. Other services: preserve existing package margin ratio (minimum 12%, default 15%)
  if (pkg.costPrice && pkg.costPrice > 0 && pkg.price > pkg.costPrice) {
    const existingMargin = (pkg.price - pkg.costPrice) / pkg.costPrice;
    return Math.max(0.12, Math.min(0.40, existingMargin));
  }

  return 0.15;
}

/**
 * Scan Othman Store API in real-time, recalculate prices, update availability, and notify admin
 */
export async function runProviderAutoMonitor(options?: {
  notifyAdmin?: boolean;
  forceNotify?: boolean;
}): Promise<{
  success: boolean;
  state: ProviderMonitorState;
  changes: ProviderChangeRecord[];
  message: string;
}> {
  const startedAt = Date.now();
  const notifyAdmin = options?.notifyAdmin !== false;
  const forceNotify = Boolean(options?.forceNotify);

  // 1. Resolve Provider Credentials
  const storedConfig = loadStoredProviderConfig();
  const settings = await getSystemSettingsAsync().catch(() => null);

  const baseUrl = (storedConfig.othmanApiUrl || storedConfig.providerApiUrl || 'https://api.othman-storee.com').trim().replace(/\/+$/, '');
  const apiToken = (storedConfig.othmanApiKey || storedConfig.providerApiKey || process.env.OTHMAN_STORE_API_TOKEN || '').trim();

  if (!apiToken) {
    const err = 'Othman Store API Token تېپىلمىدى';
    return {
      success: false,
      state: getProviderMonitorState(),
      changes: [],
      message: err,
    };
  }

  try {
    // 2. Fetch live products and profile in parallel
    const [productsRes, profileRes] = await Promise.all([
      fetch(`${baseUrl}/client/api/products`, {
        headers: { 'api-token': apiToken },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/client/api/profile`, {
        headers: { 'api-token': apiToken },
        cache: 'no-store',
      }).catch(() => null),
    ]);

    if (!productsRes.ok) {
      if (productsRes.status === 503) {
        throw new Error('تەمىنلىگۈچى مۇلازىمېتىرى ھازىر رېمونت ھالىتىدە (الموقع قيد الصيانة). بارلىق مەھسۇلات باھالىرى بىخەتەر قوغدالدى.');
      }
      throw new Error(`تەمىنلىگۈچى API جاۋاب قايتۇرمىدى (HTTP ${productsRes.status})`);
    }

    const rawProducts = await productsRes.json();
    const liveProducts: any[] = Array.isArray(rawProducts) ? rawProducts : (rawProducts.data || rawProducts.products || []);

    let providerBalance: number | null = null;
    if (profileRes && profileRes.ok) {
      try {
        const profileData = await profileRes.json();
        if (profileData && profileData.balance !== undefined) {
          providerBalance = Number(parseFloat(profileData.balance).toFixed(2));
        }
      } catch {}
    }

    // 3. Map live products by ID
    const liveProductMap = new Map<number, any>();
    for (const p of liveProducts) {
      if (p && p.id !== undefined) {
        liveProductMap.set(Number(p.id), p);
      }
    }

    // 4. Load catalog services
    const services = await getServicesListAsync();
    let matchedPackages = 0;
    let priceChangedCount = 0;
    let pausedCount = 0;
    let restoredCount = 0;
    let anyCatalogUpdated = false;

    const changesThisRun: ProviderChangeRecord[] = [];
    const nowIso = new Date().toISOString();

    for (const service of services) {
      if (!service.packages || !Array.isArray(service.packages)) continue;

      for (const pkg of service.packages) {
        if (!pkg.providerProductId || !liveProductMap.has(pkg.providerProductId)) continue;

        matchedPackages++;
        const live = liveProductMap.get(pkg.providerProductId);

        // A. Calculate live wholesale cost price
        const baseCost = Number(live.price);
        const pkgQty = (pkg as any).providerQty;
        const liveCost = (pkgQty && (live.product_type === 'amount' || !live.product_type))
          ? Number((baseCost * pkgQty).toFixed(4))
          : Number(baseCost.toFixed(4));

        // B. Check availability status in live provider
        const isProviderAvailable =
          live.available !== false &&
          live.status !== 0 &&
          live.status !== '0' &&
          !String(live.status || '').toLowerCase().includes('غير متوفر') &&
          !String(live.available || '').toLowerCase().includes('غير متوفر') &&
          !String(live.name || '').toLowerCase().includes('غير متوفر') &&
          !String(live.title || '').toLowerCase().includes('غير متوفر');

        // Check if stock / availability changed
        if (!isProviderAvailable && pkg.available !== false) {
          pkg.available = false;
          pausedCount++;
          anyCatalogUpdated = true;
          changesThisRun.push({
            type: 'paused',
            serviceId: service.id,
            serviceName: service.name,
            pkgId: pkg.id,
            pkgTitle: pkg.title,
            time: nowIso,
          });
        } else if (isProviderAvailable && pkg.available === false) {
          pkg.available = true;
          restoredCount++;
          anyCatalogUpdated = true;
          changesThisRun.push({
            type: 'restored',
            serviceId: service.id,
            serviceName: service.name,
            pkgId: pkg.id,
            pkgTitle: pkg.title,
            time: nowIso,
          });
        }

        // C. Check wholesale price changes (difference > $0.002)
        const oldCost = pkg.costPrice !== undefined ? Number(pkg.costPrice) : undefined;
        const costDiff = oldCost !== undefined ? liveCost - oldCost : 0;

        if (oldCost === undefined || Math.abs(costDiff) >= 0.002) {
          const targetMargin = getTargetProfitMargin(service, pkg);
          const rawNewPrice = liveCost * (1 + targetMargin);
          const newPrice = liveCost < 0.05
            ? Number(rawNewPrice.toFixed(3))
            : Number(rawNewPrice.toFixed(2));

          const oldPrice = Number(pkg.price);

          if (Math.abs(newPrice - oldPrice) >= 0.005 || oldCost === undefined) {
            priceChangedCount++;
            anyCatalogUpdated = true;

            const changeType = (oldPrice && newPrice > oldPrice) ? 'price_up' : 'price_down';
            changesThisRun.push({
              type: changeType,
              serviceId: service.id,
              serviceName: service.name,
              pkgId: pkg.id,
              pkgTitle: pkg.title,
              oldCost: oldCost !== undefined ? oldCost : liveCost,
              newCost: liveCost,
              oldPrice,
              newPrice,
              time: nowIso,
            });

            pkg.costPrice = liveCost;
            pkg.price = newPrice;
            pkg.originalPrice = Number((newPrice * 1.15).toFixed(2));
          }
        }
      }
    }

    // 5. Save updated catalog if changes occurred
    if (anyCatalogUpdated) {
      await saveServicesListAsync(services);
      invalidateServicesCache();
    }

    // 6. Update monitoring state
    const currentState = getProviderMonitorState();
    const updatedState: ProviderMonitorState = {
      lastSyncAt: nowIso,
      lastSyncStatus: 'success',
      lastError: null,
      providerBalance: providerBalance ?? currentState.providerBalance,
      providerCurrency: 'USD',
      stats: {
        totalScanned: liveProducts.length,
        matchedPackages,
        priceChangedCount,
        pausedCount,
        restoredCount,
        durationMs: Date.now() - startedAt,
      },
      recentChanges: [...changesThisRun, ...currentState.recentChanges].slice(0, 50),
    };

    saveProviderMonitorState(updatedState);

    // 7. Send Telegram Alert to Admin if changes occurred or if force requested
    if (notifyAdmin && (changesThisRun.length > 0 || forceNotify)) {
      await sendProviderMonitoringAlert(updatedState, changesThisRun, forceNotify);
    }

    const summaryMsg = `تەكشۈرۈش تاماملاندى: ${liveProducts.length} مەھسۇلات تەكشۈرۈلدى، ${priceChangedCount} باھا يېڭىلاندى، ${pausedCount} توختىتىلدى، ${restoredCount} ئەسلىگە كۈچكە كىردى.`;

    return {
      success: true,
      state: updatedState,
      changes: changesThisRun,
      message: summaryMsg,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'تەمىنلىگۈچىنى تەكشۈرۈش مەغلۇپ بولدى';
    console.error('runProviderAutoMonitor error:', err);

    const currentState = getProviderMonitorState();
    const failedState: ProviderMonitorState = {
      ...currentState,
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: 'failed',
      lastError: errorMsg,
      stats: {
        ...currentState.stats,
        durationMs: Date.now() - startedAt,
      },
    };
    saveProviderMonitorState(failedState);

    return {
      success: false,
      state: failedState,
      changes: [],
      message: errorMsg,
    };
  }
}

/**
 * Format and send an interactive Telegram report to the admin
 */
async function sendProviderMonitoringAlert(
  state: ProviderMonitorState,
  changes: ProviderChangeRecord[],
  force: boolean
): Promise<void> {
  try {
    const balanceText = state.providerBalance !== null ? `$${state.providerBalance}` : 'نامەلۇم';

    let detailsHtml = '';

    if (changes.length > 0) {
      const priceChanges = changes.filter((c) => c.type === 'price_up' || c.type === 'price_down');
      const pausedChanges = changes.filter((c) => c.type === 'paused');
      const restoredChanges = changes.filter((c) => c.type === 'restored');

      if (priceChanges.length > 0) {
        detailsHtml += `\n\n<b>📊 باھاسى ئۆزگەرگەنلەر (${priceChanges.length}):</b>`;
        priceChanges.slice(0, 10).forEach((c) => {
          const icon = c.type === 'price_up' ? '🔺 ئۆرلەش' : '🔻 چۈشۈش';
          detailsHtml += `\n• <b>${c.pkgTitle}</b> (${c.serviceName}): $${c.oldPrice} ➔ <b>$${c.newPrice}</b> (${icon})`;
        });
        if (priceChanges.length > 10) {
          detailsHtml += `\n<i>... ۋە باشقا ${priceChanges.length - 10} تۈر</i>`;
        }
      }

      if (pausedChanges.length > 0) {
        detailsHtml += `\n\n<b>⏸️ تەمىنلىگۈچىدە توختاپ قالغانلار (${pausedChanges.length}):</b>`;
        pausedChanges.slice(0, 5).forEach((c) => {
          detailsHtml += `\n• ❌ <b>${c.pkgTitle}</b> (${c.serviceName}) <i>(توربەتتە توختىتىلدى)</i>`;
        });
      }

      if (restoredChanges.length > 0) {
        detailsHtml += `\n\n<b>✅ قايتا سېتىلىشقا باشلىغانلار (${restoredChanges.length}):</b>`;
        restoredChanges.slice(0, 5).forEach((c) => {
          detailsHtml += `\n• 🟢 <b>${c.pkgTitle}</b> (${c.serviceName}) <i>(توربەتتە ئېچىلدى)</i>`;
        });
      }
    } else if (force) {
      detailsHtml += '\n\n✅ <i>ھازىر بارلىق تۈرلەرنىڭ باھاسى ۋە زاپاس ھالىتى ئەسلىدىكىدەك پۈتۈنلەي نورمال، ھېچقانداق ئۆزگىرىش بايقالمىدى.</i>';
    }

    const msg = `
⚡ <b>باش تەمىنلىگۈچى (Othman Store) تەكشۈرۈش دوكلاتى</b>

💰 <b>تەمىنلىگۈچى قالدۇق سوممىسى:</b> <code>${balanceText}</code>
📦 <b>تەكشۈرۈلگەن مەھسۇلات:</b> ${state.stats.totalScanned} دانە (${state.stats.matchedPackages} بولاق)
📈 <b>باھاسى يېڭىلانغان:</b> ${state.stats.priceChangedCount} دانە
⏸️ <b>ۋاقىتلىق توختىغان:</b> ${state.stats.pausedCount} دانە
⏱️ <b>سۈرئىتى:</b> ${(state.stats.durationMs / 1000).toFixed(1)} سېكۇنت${detailsHtml}
`.trim();

    await sendAdminAlert(msg);
  } catch (err) {
    console.warn('sendProviderMonitoringAlert warning:', err);
  }
}
