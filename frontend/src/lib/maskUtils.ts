/**
 * Utility functions for masking sensitive identification numbers,
 * bank account digits, card numbers, or phone/VIN sequences.
 */

export type MaskMode = 'LAST4' | 'FIRST3' | 'MIDDLE' | 'NONE';

/**
 * Show only the last 4 digits (e.g. ****8368)
 */
export function maskLast4(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.toString().trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  const asterisks = '*'.repeat(Math.max(4, clean.length - 4));
  return `${asterisks}${last4}`;
}

/**
 * Show only the first 3 digits (e.g. 235*****)
 */
export function maskFirst3(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.toString().trim();
  if (clean.length <= 3) return clean;
  const first3 = clean.slice(0, 3);
  const asterisks = '*'.repeat(Math.max(4, clean.length - 3));
  return `${first3}${asterisks}`;
}

/**
 * Hide middle digits, showing start and end (e.g. 235***68)
 */
export function maskMiddle(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.toString().trim();
  if (clean.length <= 4) return clean;
  
  const startLength = Math.min(3, Math.floor(clean.length / 3));
  const endLength = Math.min(2, Math.floor(clean.length / 4)) || 2;
  const middleLength = Math.max(3, clean.length - startLength - endLength);
  
  const start = clean.slice(0, startLength);
  const end = clean.slice(-endLength);
  return `${start}${'*'.repeat(middleLength)}${end}`;
}

/**
 * Apply selected masking mode
 */
export function applyMask(value: string | null | undefined, mode: MaskMode): string {
  if (!value) return '';
  switch (mode) {
    case 'LAST4':
      return maskLast4(value);
    case 'FIRST3':
      return maskFirst3(value);
    case 'MIDDLE':
      return maskMiddle(value);
    case 'NONE':
    default:
      return value.toString();
  }
}
