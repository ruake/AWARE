/**
 * Locale-aware relative time formatter.
 * Uses the browser's Intl.RelativeTimeFormat API.
 */
export function formatRelativeTime(isoDate: string, locale?: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale ?? navigator.language, { numeric: "auto" });
  if (absDiff < 60_000) return rtf.format(0, "seconds");
  if (absDiff < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minutes");
  if (absDiff < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hours");
  return rtf.format(Math.round(diff / 86_400_000), "days");
}

/**
 * Locale-aware number formatter (e.g., percentages, counts).
 */
export function formatPercent(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? navigator.language, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Locale-aware duration formatter.
 */
export function formatDurationMs(ms: number, locale?: string): string {
  const s = Math.floor((ms / 1000) % 60);
  const m = Math.floor((ms / 60_000) % 60);
  const h = Math.floor(ms / 3_600_000);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * Locale-aware absolute date/time formatter.
 */
export function formatDateTime(isoDate: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}
