/** Login identifier validation — replace with AD SSO / OTP in production */

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/** Digits only, UAE-friendly (971… or 05…) */
export function normalizeMobile(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('971')) return digits;
  if (digits.startsWith('0') && digits.length >= 9) return `971${digits.slice(1)}`;
  if (digits.length === 9) return `971${digits}`;
  return digits;
}

export function isValidEmailShape(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

/** UAE mobile: +971 5X XXX XXXX (9 digits after 971, leading 5) */
export function isValidUaeMobileShape(value) {
  const n = normalizeMobile(value);
  return n.startsWith('971') && n.length === 12 && n[3] === '5';
}
