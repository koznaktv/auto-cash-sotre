import { NextResponse } from 'next/server';
import { getServicesListAsync } from '@/lib/servicesDb';
import { getWifiStockSummaryAsync } from '@/lib/wifiInventoryDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const allServices = (await getServicesListAsync()) || [];
    const stockSummary = (await getWifiStockSummaryAsync()) || {};

    // 1. Filter Wi-Fi Services strictly
    const wifiServices = allServices
      .filter((s) => {
        if (s.id.includes('netflix') || s.id.includes('nord') || s.id.includes('vpn')) return false;
        return (
          s.category === 'wifi' ||
          s.id === 'azez_net' ||
          s.id.startsWith('fursan_') ||
          s.id === 'almujahid_net' ||
          (s.name || '').includes('Wi-Fi') ||
          (s.name || '').includes('واي فاي')
        );
      })
      .map((s) => {
        const pkgs = (s.packages || []).map((p) => {
          const key = `${s.id}:${p.id}`;
          const fallbackKey = `fursan_net:${p.id}`;
          const stock = Number(stockSummary[key]?.available ?? stockSummary[fallbackKey]?.available ?? 0);

          // Extract clean duration and GB for pristine Uyghur typography
          let duration = p.duration || '7 كۈن';
          let gb = '';
          const gbMatch = (p.title || '').match(/(\d+(?:\.\d+)?)\s*(?:جيجا|GB|gb)/i);
          if (gbMatch) {
            gb = `${gbMatch[1]} GB`;
          }
          const durMatch = (p.title || '').match(/(\d+)\s*كۈن/);
          if (durMatch) {
            duration = `${durMatch[1]} كۈن`;
          }

          // Clean Uyghur title: format cleanly e.g. "4 جيجا 7 كۈنلۈك"
          let cleanTitle = p.title || '';
          // Remove messy repetitions in parentheses like (4GB 7 Days) or (1 أجهزة)
          cleanTitle = cleanTitle.replace(/\s*\([^)]*(?:Days|أجهزة)[^)]*\)/gi, '').trim();

          return {
            id: p.id,
            title: cleanTitle,
            rawTitle: p.title,
            price: Number(p.price) || 0,
            originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
            duration: duration,
            gb: gb,
            stock: stock,
            isAvailable: stock > 0,
            popular: (p as any).popular || (p as any).badge === 'popular' || false,
          };
        });

        // Human-friendly network names
        let nameAr = s.name;
        let nameEn = s.id.toUpperCase();
        if (s.id === 'azez_net') {
          nameAr = 'شبكة عزيز نت';
          nameEn = 'AZEZ . NET';
        } else if (s.id === 'fursan_kafraya') {
          nameAr = 'شبكة الفرسان (كفريا)';
          nameEn = 'FURSAN NET KAFRAYA';
        } else if (s.id === 'fursan_kafer_jalis') {
          nameAr = 'شبكة الفرسان (كفر جالس)';
          nameEn = 'FURSAN NET KAFER JALIS';
        } else if (s.id === 'almujahid_net') {
          nameAr = 'شبكة المجاهد نت';
          nameEn = 'AL MUJAHID NET';
        }

        return {
          id: s.id,
          name: s.name,
          nameAr: nameAr,
          nameEn: nameEn,
          packages: pkgs,
          totalStock: pkgs.reduce((acc, curr) => acc + curr.stock, 0),
        };
      });

    // 2. Telecom Services (Syriatel & MTN) - Powered directly by MaxStore Provider API (+30% Margin)
    let maxStoreProducts: any[] = [];
    try {
      const { getMaxStoreProducts, getMaxStoreCatalogCached } = await import('@/lib/providers/maxstoreProvider');
      const res = await getMaxStoreProducts().catch(() => ({ ok: false, products: [] }));
      if (res.ok && Array.isArray(res.products) && res.products.length > 0) {
        maxStoreProducts = res.products;
      } else {
        maxStoreProducts = getMaxStoreCatalogCached() || [];
      }
    } catch (e: any) {
      console.warn('[Telecom MaxStore fetch error]:', e?.message);
    }

    const calcSellPrice = (cost: number): number => {
      const raw = cost * 1.30;
      return Number(Math.max(0.02, raw).toFixed(2));
    };

    let telecom: any = null;

    if (maxStoreProducts.length > 0) {
      // Syriatel Products from MaxStore
      const syrCredit = maxStoreProducts
        .filter((p: any) => (p.category_name || '').includes('SyriaTel') && !(p.category_name || '').includes('شهرية'))
        .sort((a: any, b: any) => a.price - b.price)
        .map((p: any) => ({
          id: 'maxstore_' + p.id,
          productId: p.id,
          provider: 'maxstore',
          name: p.name.replace(/\s*-\s*SyriaTel\s*1️⃣/i, '').trim(),
          rawName: p.name,
          cost: Number(p.price.toFixed(4)),
          price: calcSellPrice(p.price),
          isAvailable: p.available !== false,
          isBundle: false,
        }));

      const syrBundle = maxStoreProducts
        .filter((p: any) => (p.category_name || '').includes('باقات شهرية SyriaTel'))
        .sort((a: any, b: any) => a.price - b.price)
        .map((p: any) => ({
          id: 'maxstore_' + p.id,
          productId: p.id,
          provider: 'maxstore',
          name: p.name.replace(/\s*-\s*باقات شهرية SyriaTel/i, '').trim(),
          rawName: p.name,
          cost: Number(p.price.toFixed(4)),
          price: calcSellPrice(p.price),
          isAvailable: p.available !== false,
          isBundle: true,
        }));

      // MTN Products from MaxStore
      const mtnCredit = maxStoreProducts
        .filter((p: any) => (p.category_name || '').includes('رصيد MTN') && !p.name.includes('فواتير'))
        .sort((a: any, b: any) => a.price - b.price)
        .map((p: any) => ({
          id: 'maxstore_' + p.id,
          productId: p.id,
          provider: 'maxstore',
          name: p.name.replace(/\s*-\s*1️⃣\s*رصيد\s*MTN/i, '').trim(),
          rawName: p.name,
          cost: Number(p.price.toFixed(4)),
          price: calcSellPrice(p.price),
          isAvailable: p.available !== false,
          isBundle: false,
        }));

      const mtnBundle = maxStoreProducts
        .filter((p: any) => (p.category_name || '').includes('باقات شهرية MTN'))
        .sort((a: any, b: any) => a.price - b.price)
        .map((p: any) => ({
          id: 'maxstore_' + p.id,
          productId: p.id,
          provider: 'maxstore',
          name: p.name.replace(/\s*-\s*باقات شهرية MTN/i, '').trim(),
          rawName: p.name,
          cost: Number(p.price.toFixed(4)),
          price: calcSellPrice(p.price),
          isAvailable: p.available !== false,
          isBundle: true,
        }));

      telecom = {
        syriatel: {
          serviceId: 'maxstore_syriatel',
          serviceName: 'Syriatel سۈريەتىل (MaxStore)',
          provider: 'maxstore',
          creditPackages: syrCredit,
          bundlePackages: syrBundle,
        },
        mtn: {
          serviceId: 'maxstore_mtn',
          serviceName: 'MTN سۈرىيە (MaxStore)',
          provider: 'maxstore',
          creditPackages: mtnCredit,
          bundlePackages: mtnBundle,
        },
      };
    } else {
      // Fallback to local DB if MaxStore is unreachable
      const syriatelService = allServices.find(
        (s) => s.id === 'othman_syriatel' || (s.id || '').includes('syriatel')
      );
      const mtnService = allServices.find(
        (s) => s.id === 'othman_mtn' || (s.id || '').includes('mtn')
      );

      const formatTelecomPackages = (serv: any, defaultName: string) => {
        if (!serv || !serv.packages) return { serviceId: '', serviceName: defaultName, creditPackages: [], bundlePackages: [] };

        const allPkgs = serv.packages.map((p: any) => {
          let cleanName = p.title || '';
          const isBundle = /GB|جيجا|باقة|ئايلىق|تور/i.test(cleanName) && !/وحدة|بىرلىك|رصيد/i.test(cleanName);

          return {
            id: p.id,
            name: cleanName,
            price: Number(p.price) || 0,
            originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
            isAvailable: p.available !== false,
            isBundle: isBundle,
            providerProductId: p.providerProductId,
            providerQty: p.providerQty,
            instructions: p.instructions || '',
          };
        });

        return {
          serviceId: serv.id,
          serviceName: serv.name || defaultName,
          creditPackages: allPkgs.filter((p: any) => !p.isBundle),
          bundlePackages: allPkgs.filter((p: any) => p.isBundle),
        };
      };

      telecom = {
        syriatel: formatTelecomPackages(syriatelService, 'Syriatel سۈريەتىل'),
        mtn: formatTelecomPackages(mtnService, 'MTN سۈرىيە'),
      };
    }

    return NextResponse.json(
      {
        success: true,
        wifiServices,
        telecom,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('Error in /api/wifi/catalog:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
