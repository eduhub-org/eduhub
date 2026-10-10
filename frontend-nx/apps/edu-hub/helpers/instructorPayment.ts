/**
 * Instructor payment amounts are stored in cents (like Course.basePrice) and edited in euros.
 */

export const formatEuro = (cents: number, locale: string): string =>
  new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

/** Keeps only what can be part of a euro amount: digits and one decimal separator (, or .). */
export const sanitizeEuroInput = (input: string): string => {
  const cleaned = input.replace(/[^\d.,]/g, '');
  const separatorIndex = cleaned.search(/[.,]/);
  if (separatorIndex === -1) return cleaned;
  const whole = cleaned.slice(0, separatorIndex);
  const decimals = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, '').slice(0, 2);
  return `${whole}${cleaned[separatorIndex]}${decimals}`;
};

/** "250", "250,5", "250.50" -> cents; null when empty or not a valid amount. */
export const parseEuroToCents = (input: string): number | null => {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
};

/** Cents -> the editable string ("250" or "250,50" / "250.50"). */
export const centsToEuroInput = (cents: number | null | undefined, locale: string): string => {
  if (cents === null || cents === undefined) return '';
  const euros = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return locale === 'de' ? euros.replace('.', ',') : euros;
};

export interface SplitSummary {
  assigned: number;
  remaining: number;
  /** Every instructor has an entered amount and they add up to the total. */
  complete: boolean;
}

/** `shares` holds one entry per instructor; null = not entered yet. */
export const summarizeSplit = (total: number, shares: (number | null)[]): SplitSummary => {
  const assigned = shares.reduce<number>((sum, share) => sum + (share ?? 0), 0);
  return {
    assigned,
    remaining: total - assigned,
    complete: shares.length > 0 && shares.every((share) => share !== null) && assigned === total,
  };
};
