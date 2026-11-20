import { describe, it, expect } from 'vitest';
import { getMenuContent, PROVIDER_DATA, WIFI_CODE_TO_SERVICE_ID } from '../maxbazarBot';
import { claimAvailableWifiCardAsync, getAllWifiCardsAsync } from '../wifiInventoryDb';

describe('Wi-Fi Bot Menus and Purchase Flow', () => {
  const mockUser: any = {
    id: 'usr_wifi_test',
    telegram_id: 99887766,
    username: 'tester',
    balance: 50.0,
    email: 'tester@autocash.app',
  };
  const mockSession: any = {
    selectedProvider: 'autocash',
    pendingOrder: null,
  };
  const mockConfig: any = {
    token: 'test_token',
    username: 'test_bot',
    brand: 'AUTO CASH',
  };

  it('renders shop:wifi with all 4 networks', () => {
    const res = getMenuContent('shop:wifi', mockUser, mockSession, 99887766, false, mockConfig);
    expect(res.text).toContain('Wi-Fi بېتاقە كارتىلىرى');
    const flatCallbacks = res.inline_keyboard.flat().map((b: any) => b.callback_data);
    expect(flatCallbacks).toContain('wifi:fursan_kafraya');
    expect(flatCallbacks).toContain('wifi:fursan_kafer_jalis');
    expect(flatCallbacks).toContain('wifi:azez_net');
    expect(flatCallbacks).toContain('wifi:almujahid_net');
  });

  const networks = [
    { menuId: 'wifi:fursan_kafraya', name: 'كەفەريا', serviceKey: 'fursan_kf' },
    { menuId: 'wifi:fursan_kafer_jalis', name: 'كەفەر جالىس', serviceKey: 'fursan_kj' },
    { menuId: 'wifi:azez_net', name: 'ئەزىز', serviceKey: 'azez' },
    { menuId: 'wifi:almujahid_net', name: 'مۇجاھىد', serviceKey: 'mujahid' },
  ];

  for (const net of networks) {
    it(`renders packages for ${net.menuId}`, () => {
      const res = getMenuContent(net.menuId, mockUser, mockSession, 99887766, false, mockConfig);
      expect(res.text).toContain('ھازىرقى قالدۇقىڭىز');
      const callbacks = res.inline_keyboard.flat().map((b: any) => b.callback_data);
      expect(callbacks.length).toBeGreaterThan(0);
      
      // Each package has a buy callback
      for (const cb of callbacks) {
        if (cb.startsWith('buy|')) {
          const parts = cb.split('|');
          expect(parts[1]).toBe(net.menuId);
          expect(parts[2]).toMatch(new RegExp(`^wifi:${net.serviceKey}:\\d+gb`));
        }
      }
    });

    it(`renders confirmation screen and claims inventory for ${net.menuId} 1gb package`, async () => {
      const pkgCode = `wifi:${net.serviceKey}:1gb:ac`;
      const buyMenuId = `buy|${net.menuId}|${pkgCode}`;
      const confRes = getMenuContent(buyMenuId, mockUser, mockSession, 99887766, false, mockConfig);
      
      expect(confRes.text).toContain('سېتىۋېلىشنى جەزملەشتۈرۈش');
      expect(confRes.text).toContain('Wi-Fi كارتىسى');
      
      // Test inventory claim logic matches maxbazarBot.ts:3772-3788
      const rawService = pkgCode.split(':')[1];
      const mappedService = WIFI_CODE_TO_SERVICE_ID[rawService] || rawService;
      const gbMatch = pkgCode.match(/(\d+gb)/i);
      const gb = gbMatch ? gbMatch[1].toLowerCase() : '';
      const normalizedPkg = rawService === 'fursan_kf' ? `fursan_kf_${gb}`
        : rawService === 'fursan_kj' ? `fursan_kj_${gb}`
        : rawService === 'azez' ? `azez_${gb}`
        : rawService === 'mujahid' ? `mujahid_${gb}`
        : (gb ? `${mappedService}_${gb}` : pkgCode);

      const claimed = await claimAvailableWifiCardAsync({
        serviceId: mappedService,
        packageId: normalizedPkg,
        orderId: 'TEST-ORD-' + Date.now(),
        userId: mockUser.id,
        userEmail: mockUser.email,
      });

      expect(claimed).not.toBeNull();
      expect(claimed?.username).toBeDefined();
      expect(claimed?.password).toBeDefined();
      expect(claimed?.cardNumber).toBeDefined();
    });
  }
});
