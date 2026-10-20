import { describe, expect, it } from 'vitest';
import { smartTranslateTitle, smartTranslateFieldLabel } from '../smartTranslate';

describe('smartTranslateTitle', () => {
  it('translates user screenshot packages accurately to Uyghur', () => {
    // 1. Realme auto login tool + No Refund
    expect(smartTranslateTitle('RFT Otp (Realme auto Login tool) No Refund', 'ug'))
      .toBe('RFT Otp (Realme ئاپتوماتىك كىرىش قورالى) (قايتۇرۇلمايدۇ)');

    // 2. Xiaomi Frp + 24x7 Online -No Refund
    expect(smartTranslateTitle('RFT Otp (Xiaomi Frp) 24x7 Online -No Refund', 'ug'))
      .toBe('RFT Otp (Xiaomi Frp) 24 سائەت توردا (قايتۇرۇلمايدۇ)');

    // 3. Xiaomi Qc Auth -No Refund
    expect(smartTranslateTitle('RFT Otp (Xiaomi Qc Auth) -No Refund', 'ug'))
      .toBe('RFT Otp (Xiaomi Qc دەلىللەش) (قايتۇرۇلمايدۇ)');

    // 4. Realme O+ support auto Login
    expect(smartTranslateTitle('RFT Otp (Realme O+ support auto Login)', 'ug'))
      .toBe('RFT Otp (Realme O+ ئاپتوماتىك كىرىشنى قوللايدۇ)');
  });

  it('translates duration, activation, renewal and licenses', () => {
    expect(smartTranslateTitle('CF-Tools (1 Month) Activation No Refund', 'ug'))
      .toBe('CF-Tools (1 ئايلىق) ئاكتىپلاش (قايتۇرۇلمايدۇ)');

    expect(smartTranslateTitle('Pandora Tool Online Digital Licens ( 1 Year ) Renewal { Without Box }', 'ug'))
      .toContain('1 يىللىق');

    expect(smartTranslateTitle('ZXW Online Account Activation -1 Year', 'ug'))
      .toContain('1 يىللىق');
  });

  it('translates Arabic phrases to Uyghur', () => {
    expect(smartTranslateTitle('شحن فوري', 'ug')).toBe('دەرھال قاچىلاش');
    expect(smartTranslateTitle('باقة 1000 جوهرة بدون استرجاع', 'ug')).toContain('(قايتۇرۇلمايدۇ)');
  });

  it('translates English to Arabic when lang is ar', () => {
    expect(smartTranslateTitle('RFT Otp (Realme auto Login tool) No Refund', 'ar'))
      .toContain('تسجيل دخول تلقائي');
  });
});

describe('smartTranslateFieldLabel', () => {
  it('translates provider field keys to localized labels', () => {
    expect(smartTranslateFieldLabel('USER ID', 'ug')).toBe('ئويۇنچى كىملىكى (Player ID)');
    expect(smartTranslateFieldLabel('IMEI', 'ug')).toBe('IMEI نومۇرى');
    expect(smartTranslateFieldLabel('Phone', 'ug')).toBe('تېلېفون نومۇرى');
    expect(smartTranslateFieldLabel('Link', 'ug')).toBe('ئۇلىنىش (Link / URL)');
    expect(smartTranslateFieldLabel('USER ID', 'ar')).toBe('معرف اللاعب (Player ID)');
    expect(smartTranslateFieldLabel('USER ID', 'en')).toBe('Player ID');
  });
});
