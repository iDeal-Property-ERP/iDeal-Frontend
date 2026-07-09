/**
 * Small shared formatters for the Management triage screens. Kept UI-string-free
 * (no user-visible copy) — these transform backend data (enum values, ISO
 * timestamps) into display shapes. Localized labels always come from `t()`.
 */

/**
 * Title-cases a backend enum value: lowercases, splits on `_`/spaces, and
 * capitalizes each word (e.g. `pending_review` → "Pending Review").
 * @param value - The raw enum/status string.
 * @returns The title-cased label.
 */
export function titleCase(value: string): string {
  return value
    .replaceAll('_', ' ')
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * A compact, locale-agnostic relative-time string from an ISO timestamp
 * ("just now", "12 min ago", "3 h ago", "2 d ago", else a short date). Used for
 * queue-card age chips and activity/comment timestamps.
 * @param iso - The ISO timestamp.
 * @returns The relative-time label.
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) {
    return 'just now';
  }
  if (min < 60) {
    return `${min} min ago`;
  }
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} d ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
