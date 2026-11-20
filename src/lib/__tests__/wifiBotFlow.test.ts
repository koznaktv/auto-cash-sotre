import { describe, it, expect } from 'vitest';
import { getMenuContent } from '../maxbazarBot';
import { claimAvailableWifiCardAsync, unclaimWifiCardAsync } from '../wifiInventoryDb';

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

      for (const cb of callbacks) {
        if (cb.startsWith('buy|')) {
          const parts = cb.split('|');
          expect(parts[1]).toBe(net.menuId);
          expect(parts[2]).toMatch(new RegExp(`^wifi:${net.serviceKey}:\\d+gb`));
        }
      }
    });
  }

  it('renders confirmation screen for Kafraya 1GB card', () => {
    const pkgCode = 'wifi:fursan_kf:1gb:ac';
    const buyMenuId = 'buy|wifi:fursan_kafraya|' + pkgCode;
    const confRes = getMenuContent(buyMenuId, mockUser, mockSession, 99887766, false, mockConfig);

    expect(confRes.text).toContain('سېتىۋېلىشنى جەزملەشتۈرۈش');
    expect(confRes.text).toContain('Wi-Fi كارتىسى');
  });

  it('successfully claims and unclaims Kafer Jalis 4GB card', async () => {
    let claimed: any = null;
    try {
      claimed = await claimAvailableWifiCardAsync({
        serviceId: 'fursan_kafer_jalis',
        packageId: 'fursan_kj_4gb',
        orderId: 'TEST-ORD-' + Date.now(),
        userId: mockUser.id,
        userEmail: mockUser.email,
      });

      expect(claimed).not.toBeNull();
      expect(claimed?.serviceId).toBe('fursan_kafer_jalis');
    } finally {
      if (claimed) {
        await unclaimWifiCardAsync(claimed.id);
      }
    }
  });

  it('correctly returns null for Mujahid Net when stock is empty', async () => {
    const claimed = await claimAvailableWifiCardAsync({
      serviceId: 'almujahid_net',
      packageId: 'mujahid_1gb',
      orderId: 'TEST-ORD-' + Date.now(),
      userId: mockUser.id,
      userEmail: mockUser.email,
    });

    expect(claimed).toBeNull();
  });
});
