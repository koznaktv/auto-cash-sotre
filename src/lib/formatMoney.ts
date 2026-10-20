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
