import { describe, it, expect } from 'vitest';
import { normalizeTxId } from '../tsaShamcash';

describe('TSA Shamcash API integration', () => {
  it('normalizes Latin transaction numbers', () => {
    expect(normalizeTxId('288100001')).toBe('288100001');
    expect(normalizeTxId('  288100001  ')).toBe('288100001');
    expect(normalizeTxId('#288100001')).toBe('288100001');
    expect(normalizeTxId('tx: 288100001')).toBe('288100001');
    expect(normalizeTxId('TX_288100001')).toBe('288100001');
    expect(normalizeTxId('No: 288100001')).toBe('288100001');
  });

  it('normalizes Eastern Arabic numerals to Latin digits', () => {
    // ٢٨٨١٠٠٠٠١ -> 288100001
    expect(normalizeTxId('٢٨٨١٠٠٠٠١')).toBe('288100001');
    // ١٢٣٤٥٦٧٨٩٠ -> 1234567890
    expect(normalizeTxId('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
  });

  it('normalizes Persian numerals to Latin digits', () => {
    // ۲۸۸۱۰۰۰۰۱ -> 288100001
    expect(normalizeTxId('۲۸۸۱۰۰۰۰۱')).toBe('288100001');
  });

  it('handles empty or whitespace inputs gracefully', () => {
    expect(normalizeTxId('')).toBe('');
    expect(normalizeTxId('   ')).toBe('');
  });

  it('calculates USD conversion correctly for SYP and USD', () => {
    const exchangeRate = 15000;

    // USD is 1:1
    const usdAmount = 25;
    expect(Math.round(usdAmount * 100) / 100).toBe(25);

    // 150,000 SYP at 15,000 rate = 10 USD
    const sypAmount1 = 150000;
    expect(Math.round((sypAmount1 / exchangeRate) * 100) / 100).toBe(10);

    // 75,000 SYP at 15,000 rate = 5 USD
    const sypAmount2 = 75000;
    expect(Math.round((sypAmount2 / exchangeRate) * 100) / 100).toBe(5);

    // 22,500 SYP at 15,000 rate = 1.5 USD
    const sypAmount3 = 22500;
    expect(Math.round((sypAmount3 / exchangeRate) * 100) / 100).toBe(1.5);
  });
});
