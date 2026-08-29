const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Renders latin digits inside a value using Persian digits. */
export function faNum(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Formats a 0..1 ratio as a Persian percentage string (no percent sign). */
export function faPercent(ratio: number): string {
  return faNum(Math.round(ratio * 100));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
