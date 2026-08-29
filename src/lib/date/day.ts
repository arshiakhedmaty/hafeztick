import {
  JALALI_MONTHS,
  WEEKDAY_NAMES,
  gregorianToJalali,
  jalaliMonthLength,
  jalaliToGregorian,
} from "./jalali";
import { faNum } from "../utils/number";

/**
 * A day is identified by its Gregorian calendar date in local time,
 * serialised as "YYYY-MM-DD". Storing an absolute day (instead of a
 * timestamp) keeps history stable across timezones and DST shifts.
 */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses a day key into a local Date fixed at noon (DST-safe for arithmetic). */
export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

export function addDays(key: DayKey, amount: number): DayKey {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

/** Signed day distance: diffDays("...-10", "...-08") === 2 */
export function diffDays(a: DayKey, b: DayKey): number {
  const ms = fromDayKey(a).getTime() - fromDayKey(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function compareDays(a: DayKey, b: DayKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 0 = Saturday … 6 = Friday (Persian week order). */
export function weekdayIndex(key: DayKey): number {
  return (fromDayKey(key).getDay() + 1) % 7;
}

export function startOfWeek(key: DayKey): DayKey {
  return addDays(key, -weekdayIndex(key));
}

export function weekDays(anyDayOfWeek: DayKey): DayKey[] {
  const start = startOfWeek(anyDayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Inclusive list of day keys from `from` to `to`. */
export function rangeKeys(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  let cursor = from;
  let guard = 0;
  while (compareDays(cursor, to) <= 0 && guard < 4000) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return out;
}

/** The last `count` days ending at `end` (inclusive), oldest first. */
export function lastDays(end: DayKey, count: number): DayKey[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
}

export interface JalaliParts {
  jy: number;
  jm: number;
  jd: number;
  monthName: string;
  weekdayName: string;
  weekday: number;
}

export function jalaliParts(key: DayKey): JalaliParts {
  const date = fromDayKey(key);
  const { jy, jm, jd } = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  const weekday = weekdayIndex(key);
  return {
    jy,
    jm,
    jd,
    monthName: JALALI_MONTHS[jm - 1],
    weekdayName: WEEKDAY_NAMES[weekday],
    weekday,
  };
}

/** "۷ شهریور" | "۷ شهریور ۱۴۰۵" | "شنبه، ۷ شهریور" */
export function formatDay(
  key: DayKey,
  options: { withYear?: boolean; withWeekday?: boolean } = {},
): string {
  const p = jalaliParts(key);
  const core = `${faNum(p.jd)} ${p.monthName}`;
  const withYear = options.withYear ? `${core} ${faNum(p.jy)}` : core;
  return options.withWeekday ? `${p.weekdayName}، ${withYear}` : withYear;
}

/** "شهریور ۱۴۰۵" */
export function formatMonth(key: DayKey): string {
  const p = jalaliParts(key);
  return `${p.monthName} ${faNum(p.jy)}`;
}

/** Human label used in headers: امروز / دیروز / فردا, otherwise the date. */
export function relativeDayLabel(key: DayKey, today: DayKey = todayKey()): string {
  const delta = diffDays(key, today);
  if (delta === 0) return "امروز";
  if (delta === -1) return "دیروز";
  if (delta === 1) return "فردا";
  return formatDay(key, { withWeekday: true });
}

/** First day of the Jalali month containing `key`. */
export function jalaliMonthStart(key: DayKey): DayKey {
  const { jy, jm } = jalaliParts(key);
  const g = jalaliToGregorian(jy, jm, 1);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** Moves whole Jalali months, which are not all the same length. */
export function shiftJalaliMonth(key: DayKey, delta: number): DayKey {
  const { jy, jm } = jalaliParts(key);
  let year = jy;
  let month = jm + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  const g = jalaliToGregorian(year, month, 1);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** Day keys of a Jalali month grid, aligned to full Persian weeks. */
export function jalaliMonthGrid(key: DayKey): DayKey[] {
  const { jy, jm } = jalaliParts(key);
  const firstKey = jalaliMonthStart(key);
  const length = jalaliMonthLength(jy, jm);
  const lastKey = addDays(firstKey, length - 1);
  return rangeKeys(startOfWeek(firstKey), addDays(startOfWeek(lastKey), 6));
}

export function isSameJalaliMonth(a: DayKey, b: DayKey): boolean {
  const pa = jalaliParts(a);
  const pb = jalaliParts(b);
  return pa.jy === pb.jy && pa.jm === pb.jm;
}
