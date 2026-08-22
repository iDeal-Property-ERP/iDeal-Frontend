/**
 * Formats a numeric string/amount as a compact currency string with grouping.
 * @param amount - The raw amount (string or number).
 * @param currency - Optional currency symbol/prefix (defaults to "$").
 * @returns The formatted amount, e.g. "$64,200".
 */
export function formatMoney(amount: string | number, currency = '$'): string {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return `${currency}0`;
  }
  return `${currency}${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * Formats an amount in its own currency: "$430" for USD, "5,600 UZS" for UZS.
 * @param amount - The raw amount (string or number).
 * @param currency - The ISO currency code ("USD" | "UZS").
 * @returns The formatted amount with the right symbol/suffix.
 */
export function formatCurrency(amount: string | number, currency: string): string {
  if (currency === 'UZS') {
    const value = Number(amount);
    return `${Number.isNaN(value) ? 0 : Math.round(value).toLocaleString('en-US')} UZS`;
  }
  return formatMoney(amount, '$');
}

/**
 * Formats a month key (e.g. "2026-06" or an ISO date) to a short label ("Jun").
 * Falls back to the raw string when it can't be parsed.
 * @param month - The month key from the API.
 * @returns A short month label.
 */
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatMonthLabel(month: string): string {
  const [year, monthPart] = month.split('-');
  if (year?.length === 4 && monthPart && /^\d{2}$/u.test(monthPart)) {
    const monthIndex = Number(monthPart) - 1;
    return MONTH_NAMES[monthIndex] ?? month;
  }
  return month.length > 3 ? month.slice(0, 3) : month;
}
