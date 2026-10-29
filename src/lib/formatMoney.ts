/**
 * Precision money formatting supporting micro-cents and standard currency.
 *
 * Examples:
 * - 0.0010568041237113402 -> "0.0010568"
 * - 0.00010685625 -> "0.00010686"
 * - 0.00776414 -> "0.007764"
 * - 0.025 -> "0.025"
 * - 0.50 -> "0.50"
 * - 1.09 -> "1.09"
 * - 10 -> "10.00"
 */
export function formatSmartPrice(
  val: number | string | null | undefined,
  maxMicroDecimals: number = 8
): string {
  if (val === null || val === undefined) return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (!Number.isFinite(num) || num === 0) return '0.00';

  const abs = Math.abs(num);

  // Micro prices (< $0.01) e.g. Sahl Cash per-point or game-token pricing
  if (abs < 0.01) {
    const fixed = num.toFixed(maxMicroDecimals);
    const cleaned = fixed.replace(/0+$/, '').replace(/\.$/, '');
    return cleaned === '0' || cleaned === '-0' ? num.toFixed(maxMicroDecimals) : cleaned;
  }

  // Fractional prices ($0.01 <= |value| < 1.00)
  if (abs < 1) {
    const fixed = num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    const parts = fixed.split('.');
    if (!parts[1]) return `${fixed}.00`;
    if (parts[1].length === 1) return `${fixed}0`;
    return fixed;
  }

  // Standard prices (>= $1.00)
  const fixed = num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  const parts = fixed.split('.');
  if (!parts[1] || parts[1].length <= 2) {
    return num.toFixed(2);
  }
  return fixed;
}

/** Legacy alias compatible with formatCurrencyAmount */
export function formatCurrencyAmount(val: number | string | null | undefined): string {
  return formatSmartPrice(val);
}

/**
 * Extracts a clean, concise package quantity/amount from verbose package titles.
 * Examples:
 * - "8100 UC - تېز قاچىلاش" -> "8100 UC"
 * - "60 UC - تېز قاچىلاش" -> "60 UC"
 * - "3850 UC - تېز قاچىلاش" -> "3850 UC"
 * - "86 ئالماس (78 + 8 Bonus)" -> "86 ئالماس"
 * - "110 ئالماس (100 + 10)" -> "110 ئالماس"
 * - "Weekly Diamond Pass (ھەپتىلىك ئالماس پاس كارتىسى)" -> "Weekly Diamond Pass"
 * - "6 جيجا 7 كۈنلۈك (1 أجهزة)" -> "6GB (7 كۈنلۈك)"
 * - "Prime 1 ئايلىق ئەزالىق (1 Month)" -> "Prime (1 ئايلىق)"
 */
export function extractCleanPackageQuantity(title: string | null | undefined): string {
  if (!title) return '';
  let t = String(title).trim();

  // 1. Remove noise suffixes like '- تېز قاچىلاش', '- Instant', '- Fast', etc.
  t = t
    .replace(
      /\s*[-–—]\s*(?:تېز قاچىلاش|سۈرئەتلىك|ئاپتوماتىك|نەق مەيدان|Instant|Fast Delivery|Auto|Direct Top-?up|Global|TR|ID)\b/gi,
      ''
    )
    .trim();

  // 2. Specific gaming currency matches (UC, ئالماس/Diamond, Coins, etc.)
  const currMatch = t.match(
    /(\d+[\d,\.]*(?:\s*[\+]\s*\d+[\d,\.]*)?)\s*(UC|uc|Uc|ئالماس|ماس|Diamonds?|Diamantes?|Diamond|💎|Coins?|تەڭگە|CP|VP|Robux|V-?Bucks|Stars?|يۇلتۇز|جيجا|GB)\b/i
  );
  if (currMatch) {
    const num = currMatch[1].trim();
    let unit = currMatch[2].trim();
    if (/^uc$/i.test(unit)) unit = 'UC';
    if (/^diam/i.test(unit)) unit = 'Diamonds';
    if (/^جيجا$/i.test(unit)) unit = 'GB';
    return `${num} ${unit}`;
  }

  // 3. Passes & Memberships
  if (/Weekly (?:Diamond )?Pass/i.test(t) || /ھەپتىلىك ئالماس پاس/i.test(t)) return 'Weekly Diamond Pass';
  if (/Twilight Pass/i.test(t) || /تۈۋايلىت پاس/i.test(t)) return 'Twilight Pass';
  if (/Elite Pass/i.test(t) || /ئېلىت كارتىسى/i.test(t)) return 'Elite Pass';
  if (/Prime Plus/i.test(t)) {
    const dur = t.match(/(\d+)\s*(?:ئايلىق|Month)/i);
    return dur ? `Prime Plus (${dur[1]} ئايلىق)` : 'Prime Plus';
  }
  if (/Prime/i.test(t)) {
    const dur = t.match(/(\d+)\s*(?:ئايلىق|Month)/i);
    return dur ? `Prime (${dur[1]} ئايلىق)` : 'Prime';
  }

  // 4. Gigabytes with days: e.g. 6 جيجا 7 كۈنلۈك (1 أجهزة)
  const gbMatch = t.match(/(\d+)\s*(?:جيجا|GB)\s*(\d+\s*كۈنلۈك|\d+\s*Days?)?/i);
  if (gbMatch) {
    return gbMatch[2] ? `${gbMatch[1]}GB (${gbMatch[2]})` : `${gbMatch[1]}GB`;
  }

  // 5. Leading number match: e.g. "50 + 5" or "100"
  const numStartMatch = t.match(/^(\d+[\d,\.]*(?:\s*\+\s*\d+[\d,\.]*)?)\s*([A-Za-z\u0600-\u06FF]+)?/);
  if (numStartMatch) {
    return numStartMatch[2] ? `${numStartMatch[1]} ${numStartMatch[2]}` : numStartMatch[1];
  }

  // 6. Clean up parentheticals and redundant 'بولىقى'
  let cleaned = t.replace(/\s*\([^\)]*\)/g, '').trim();
  cleaned = cleaned.replace(/\s*بولىقى$/g, '').trim();
  return cleaned || t;
}
