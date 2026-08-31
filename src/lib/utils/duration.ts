import { faNum } from "./number";

/**
 * Everything in HafezTick is measured in minutes of real, logged time.
 *
 * Minutes are the storage unit because they are integers: hours would need
 * floats, and a plan built on 0.1 + 0.2 is a plan that drifts. Formatting back
 * into «۲ ساعت و ۳۰ دقیقه» happens only at the edge, in the UI.
 */

export const MINUTES_PER_HOUR = 60;
/** A single logged item can never exceed a day. */
export const MAX_ENTRY_MINUTES = 24 * MINUTES_PER_HOUR;

export interface HourParts {
  hours: number;
  minutes: number;
}

export function splitMinutes(total: number): HourParts {
  const safe = Math.max(0, Math.round(total));
  return {
    hours: Math.floor(safe / MINUTES_PER_HOUR),
    minutes: safe % MINUTES_PER_HOUR,
  };
}

export function joinMinutes(hours: number, minutes: number): number {
  return clampMinutes(
    Math.round(Math.max(0, hours)) * MINUTES_PER_HOUR + Math.round(Math.max(0, minutes)),
  );
}

export function clampMinutes(value: number, max = MAX_ENTRY_MINUTES): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
}

/** Decimal hours, for a compact «۴٫۵ ساعت» style read-out. */
export function toHours(minutes: number): number {
  return minutes / MINUTES_PER_HOUR;
}

/** «۲:۳۰» — the dense form used inside chips, tables and day columns. */
export function faClock(total: number): string {
  const { hours, minutes } = splitMinutes(total);
  return `${faNum(hours)}:${faNum(String(minutes).padStart(2, "0"))}`;
}

/**
 * «۲ ساعت و ۳۰ دقیقه» — the spoken form used in headlines and summaries.
 * `short` drops the conjunction: «۲ ساعت ۳۰ دقیقه».
 */
export function faDuration(
  total: number,
  options: { short?: boolean; zero?: string } = {},
): string {
  const { hours, minutes } = splitMinutes(total);
  if (hours === 0 && minutes === 0) return options.zero ?? "بدون زمان";

  const parts: string[] = [];
  if (hours > 0) parts.push(`${faNum(hours)} ساعت`);
  if (minutes > 0) parts.push(`${faNum(minutes)} دقیقه`);
  return parts.join(options.short ? " " : " و ");
}

/** «۶ ساعت» / «۶٫۵ ساعت» — goals, which are usually round numbers. */
export function faGoal(total: number): string {
  const { hours, minutes } = splitMinutes(total);
  if (total === 0) return "بدون هدف";
  if (minutes === 0) return `${faNum(hours)} ساعت`;
  if (minutes === 30) return `${faNum(hours)}٫۵ ساعت`;
  return faDuration(total, { short: true });
}

/**
 * Reads a free-typed duration: «2», «2:30», «2.5», «۹۰د», «1h30».
 * Returns null when nothing sensible can be read, so callers can keep the
 * previous value rather than silently writing a zero.
 */
export function parseDuration(input: string): number | null {
  const normalized = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫،]/g, ".")
    .trim();

  if (!normalized) return null;

  const clock = normalized.match(/^(\d+)\s*[:h ساعت]+\s*(\d+)?\s*(?:د|m|دقیقه)?$/u);
  if (clock) {
    return joinMinutes(Number(clock[1]), Number(clock[2] ?? 0));
  }

  const onlyMinutes = normalized.match(/^(\d+)\s*(?:د|m|min|دقیقه)$/u);
  if (onlyMinutes) return clampMinutes(Number(onlyMinutes[1]));

  const decimal = Number(normalized);
  if (Number.isFinite(decimal)) return clampMinutes(decimal * MINUTES_PER_HOUR);

  return null;
}
