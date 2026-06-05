export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function normalizeMobile(value: string): string {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('971')) return digits;
  if (digits.startsWith('0') && digits.length >= 9) return `971${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('5')) return `971${digits}`;
  return digits;
}

export function isValidEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

/** UAE mobile: +971 5X XXX XXXX */
export function isValidUaeMobileShape(value: string): boolean {
  const n = normalizeMobile(value);
  return n.startsWith('971') && n.length === 12 && n[3] === '5';
}
