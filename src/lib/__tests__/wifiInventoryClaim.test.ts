import { describe, it, expect } from 'vitest';
import {
  normalizeWifiFamily,
  claimAvailableWifiCardAsync,
  unclaimWifiCardAsync,
} from '../wifiInventoryDb';

describe('Wi-Fi Inventory Normalization & Claiming', () => {
  it('normalizes service IDs into proper families', () => {
    expect(normalizeWifiFamily('fursan_kf').family).toBe('fursan_kafraya');
    expect(normalizeWifiFamily('fursan_kafraya').family).toBe('fursan_kafraya');
    expect(normalizeWifiFamily('fursan_kj').family).toBe('fursan_kafer_jalis');
    expect(normalizeWifiFamily('fursan_kafer_jalis').family).toBe('fursan_kafer_jalis');
    expect(normalizeWifiFamily('azez').family).toBe('azez_net');
    expect(normalizeWifiFamily('azez_net').family).toBe('azez_net');
    expect(normalizeWifiFamily('mujahid').family).toBe('almujahid_net');
    expect(normalizeWifiFamily('almujahid_net').family).toBe('almujahid_net');
  });

  it('successfully claims in-stock card with bot pkgCode format (fursan_kf:1gb:ac)', async () => {
    let card: any = null;
    try {
      card = await claimAvailableWifiCardAsync({
        serviceId: 'fursan_kf',
        packageId: 'wifi:fursan_kf:1gb:ac',
        userId: 'test_user_bot',
        userEmail: 'test@bot.user',
        orderId: 'TEST-ORD-001',
      });

      expect(card).not.toBeNull();
      expect(card?.serviceId).toBe('fursan_kafraya');
      expect(card?.packageId).toBe('fursan_kf_1gb');
      expect(card?.status).toBe('sold');
    } finally {
      if (card) {
        await unclaimWifiCardAsync(card.id);
      }
    }
  });

  it('successfully claims in-stock card with bot Azez format (azez:6gb:mb)', async () => {
    let card: any = null;
    try {
      card = await claimAvailableWifiCardAsync({
        serviceId: 'azez',
        packageId: 'wifi:azez:6gb:mb',
        userId: 'test_user_bot',
        userEmail: 'test@bot.user',
        orderId: 'TEST-ORD-002',
      });

      expect(card).not.toBeNull();
      expect(card?.serviceId).toBe('azez_net');
      expect(card?.packageId).toBe('azez_6gb');
    } finally {
      if (card) {
        await unclaimWifiCardAsync(card.id);
      }
    }
  });

  it('successfully claims in-stock card with website format (fursan_kafer_jalis, fursan_kj_4gb)', async () => {
    let card: any = null;
    try {
      card = await claimAvailableWifiCardAsync({
        serviceId: 'fursan_kafer_jalis',
        packageId: 'fursan_kj_4gb',
        userId: 'test_user_web',
        userEmail: 'test@web.user',
        orderId: 'TEST-ORD-003',
      });

      expect(card).not.toBeNull();
      expect(card?.serviceId).toBe('fursan_kafer_jalis');
      expect(card?.packageId).toBe('fursan_kj_4gb');
    } finally {
      if (card) {
        await unclaimWifiCardAsync(card.id);
      }
    }
  });

  it('correctly returns null for out-of-stock networks (such as Mujahid Net)', async () => {
    const card = await claimAvailableWifiCardAsync({
      serviceId: 'almujahid_net',
      packageId: 'wifi:mujahid:1gb:ac',
      userId: 'test_user_empty',
      userEmail: 'test@empty.user',
      orderId: 'TEST-ORD-EMPTY',
    });

    expect(card).toBeNull();
  });
});
