import { describe, it, expect } from 'vitest';
import {
  normalizeWifiFamily,
  claimAvailableWifiCardAsync,
  unclaimWifiCardAsync,
  getAllWifiCardsAsync,
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

  it('successfully claims card with bot pkgCode format (fursan_kf:6gb:ac)', async () => {
    const card = await claimAvailableWifiCardAsync({
      serviceId: 'fursan_kf',
      packageId: 'wifi:fursan_kf:6gb:ac',
      userId: 'test_user_bot',
      userEmail: 'test@bot.user',
      orderId: 'TEST-ORD-001',
    });

    expect(card).not.toBeNull();
    expect(card?.serviceId).toBe('fursan_kafraya');
    expect(card?.packageId).toBe('fursan_kf_6gb');
    expect(card?.status).toBe('sold');

    // Unclaim back to keep inventory pure
    if (card) {
      await unclaimWifiCardAsync(card.id);
    }
  });

  it('successfully claims card with bot Azez format (azez:1gb:mb)', async () => {
    const card = await claimAvailableWifiCardAsync({
      serviceId: 'azez',
      packageId: 'wifi:azez:1gb:mb',
      userId: 'test_user_bot',
      userEmail: 'test@bot.user',
      orderId: 'TEST-ORD-002',
    });

    expect(card).not.toBeNull();
    expect(card?.serviceId).toBe('azez_net');
    expect(card?.packageId).toBe('azez_1gb');

    if (card) {
      await unclaimWifiCardAsync(card.id);
    }
  });

  it('successfully claims card with website format (fursan_kafraya, fursan_kf_4gb)', async () => {
    const card = await claimAvailableWifiCardAsync({
      serviceId: 'fursan_kafraya',
      packageId: 'fursan_kf_4gb',
      userId: 'test_user_web',
      userEmail: 'test@web.user',
      orderId: 'TEST-ORD-003',
    });

    expect(card).not.toBeNull();
    expect(card?.serviceId).toBe('fursan_kafraya');
    expect(card?.packageId).toBe('fursan_kf_4gb');

    if (card) {
      await unclaimWifiCardAsync(card.id);
    }
  });
});
