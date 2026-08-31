import {
  type DayKey,
  compareDays,
  lastDays,
  weekDays,
  weekdayIndex,
} from "../date/day";
import { type GoalSettings, goalMinutesFor } from "./goals";
import {
  type DayScore,
  type FlexibleProgress,
  type WeekScore,
  averageMinutes,
  averageRatio,
  flexibleProgressForWeek,
  isSuccessfulDay,
  scoreDay,
  scoreWeek,
  totalMinutes,
} from "./scoring";
import type { AppData, Category, Entry, Routine, Settings } from "./types";
import { routineOccursOn } from "./schedule";

/** Groups entries by day once, so the stats pass stays linear. */
export function groupEntriesByDay(entries: Entry[]): Map<DayKey, Entry[]> {
  const map = new Map<DayKey, Entry[]>();
  for (const entry of entries) {
    const bucket = map.get(entry.day);
    if (bucket) bucket.push(entry);
    else map.set(entry.day, [entry]);
  }
  return map;
}

export function computeDayScores(
  entries: Entry[],
  days: DayKey[],
  settings: GoalSettings,
): DayScore[] {
  const byDay = groupEntriesByDay(entries);
  return days.map((day) => scoreDay(day, byDay.get(day) ?? [], settings));
}

export interface StreakInfo {
  current: number;
  best: number;
  /** Days that were neutral (rest day or unscored) inside the streak. */
  neutralInCurrent: number;
}

function isNeutralDay(score: DayScore, restDays: number[]): boolean {
  return score.ratio === null || restDays.includes(weekdayIndex(score.day));
}

/**
 * A streak counts consecutive successful days, where "rest days" and days
 * without an hour goal are neutral: they neither extend nor break it. Today is
 * never allowed to break a streak, because the day is not over yet.
 */
export function computeStreaks(
  scores: DayScore[],
  settings: Pick<Settings, "successThreshold" | "restDays">,
  today: DayKey,
): StreakInfo {
  const ordered = [...scores].sort((a, b) => compareDays(a.day, b.day));
  const { restDays } = settings;

  let best = 0;
  let running = 0;
  for (const score of ordered) {
    if (isNeutralDay(score, restDays)) continue;
    if (isSuccessfulDay(score, settings)) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  let neutralInCurrent = 0;
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const score = ordered[i];
    if (compareDays(score.day, today) > 0) continue;
    if (isNeutralDay(score, restDays)) {
      if (current > 0) neutralInCurrent += 1;
      continue;
    }
    if (isSuccessfulDay(score, settings)) {
      current += 1;
      continue;
    }
    // An unfinished today does not end the streak.
    if (score.day === today) continue;
    break;
  }

  return { current, best: Math.max(best, current), neutralInCurrent };
}

export interface PeriodComparison {
  /** Average minutes per scored day in the current window. */
  current: number | null;
  previous: number | null;
  /** Difference in minutes, null when either side has no data. */
  delta: number | null;
}

/** Compares the last `window` days against the `window` days before them. */
export function comparePeriods(
  entries: Entry[],
  today: DayKey,
  window: number,
  settings: GoalSettings,
): PeriodComparison {
  const currentDays = lastDays(today, window);
  const previousDays = lastDays(currentDays[0], window + 1).slice(0, window);

  const current = averageMinutes(computeDayScores(entries, currentDays, settings));
  const previous = averageMinutes(computeDayScores(entries, previousDays, settings));

  return {
    current,
    previous,
    delta: current !== null && previous !== null ? current - previous : null,
  };
}

export interface CategoryStat {
  categoryId: string | null;
  name: string;
  color: Category["color"];
  /** Minutes logged in this category over the window. */
  minutes: number;
  /** Share of all logged minutes, 0..1 — what the bar length means. */
  share: number;
  /** Items that carried time, for context under the hours. */
  loggedCount: number;
}

/**
 * Where the hours actually went.
 *
 * The headline per category is time, not a completion percentage: «پروژه: ۲
 * ساعت» answers the question a student is really asking.
 */
export function categoryBreakdown(
  entries: Entry[],
  categories: Category[],
  days: DayKey[],
): CategoryStat[] {
  const daySet = new Set(days);
  const buckets = new Map<string, { minutes: number; loggedCount: number }>();
  let grandTotal = 0;

  for (const entry of entries) {
    if (!daySet.has(entry.day) || entry.status === "skipped") continue;
    const minutes = Math.max(0, entry.minutes ?? 0);
    if (minutes === 0) continue;

    const key = entry.categoryId ?? "__none__";
    const bucket = buckets.get(key) ?? { minutes: 0, loggedCount: 0 };
    bucket.minutes += minutes;
    bucket.loggedCount += 1;
    buckets.set(key, bucket);
    grandTotal += minutes;
  }

  const share = (minutes: number) => (grandTotal > 0 ? minutes / grandTotal : 0);
  const stats: CategoryStat[] = [];

  for (const category of categories) {
    const bucket = buckets.get(category.id);
    if (!bucket) continue;
    stats.push({
      categoryId: category.id,
      name: category.name,
      color: category.color,
      minutes: bucket.minutes,
      share: share(bucket.minutes),
      loggedCount: bucket.loggedCount,
    });
  }

  const none = buckets.get("__none__");
  if (none) {
    stats.push({
      categoryId: null,
      name: "بدون دسته",
      color: "slate",
      minutes: none.minutes,
      share: share(none.minutes),
      loggedCount: none.loggedCount,
    });
  }

  return stats.sort((a, b) => b.minutes - a.minutes);
}

export interface RoutineStat {
  routineId: string;
  title: string;
  color: Category["color"];
  /** Minutes logged against this routine over the window. */
  minutes: number;
  /** Days it was actually done, out of the days it was planned. */
  done: number;
  planned: number;
  ratio: number | null;
  /** Average minutes on the days it was done. */
  averageMinutes: number | null;
  currentStreak: number;
}

/** Per-routine consistency, and the hours behind it, over a window of days. */
export function routineConsistency(
  data: Pick<AppData, "routines" | "entries" | "categories">,
  days: DayKey[],
): RoutineStat[] {
  const daySet = new Set(days);
  const colorOf = (categoryId: string | null): Category["color"] =>
    data.categories.find((c) => c.id === categoryId)?.color ?? "slate";

  const relevant = data.entries.filter(
    (entry) => entry.sourceType === "routine" && daySet.has(entry.day),
  );
  const byRoutine = new Map<string, Entry[]>();
  for (const entry of relevant) {
    const bucket = byRoutine.get(entry.sourceId);
    if (bucket) bucket.push(entry);
    else byRoutine.set(entry.sourceId, [entry]);
  }

  return data.routines
    .filter((routine) => routine.archivedAt === null)
    .map((routine) => {
      const entries = (byRoutine.get(routine.id) ?? []).sort((a, b) =>
        compareDays(a.day, b.day),
      );
      const counted = entries.filter((entry) => entry.status !== "skipped");
      const doneEntries = counted.filter((entry) => (entry.minutes ?? 0) > 0);
      const minutes = doneEntries.reduce(
        (sum, entry) => sum + (entry.minutes ?? 0),
        0,
      );

      let currentStreak = 0;
      for (let i = counted.length - 1; i >= 0; i -= 1) {
        if ((counted[i].minutes ?? 0) > 0) currentStreak += 1;
        else break;
      }

      return {
        routineId: routine.id,
        title: routine.title,
        color: colorOf(routine.categoryId),
        minutes,
        done: doneEntries.length,
        planned: counted.length,
        ratio: counted.length > 0 ? doneEntries.length / counted.length : null,
        averageMinutes:
          doneEntries.length > 0 ? minutes / doneEntries.length : null,
        currentStreak,
      };
    })
    .filter((stat) => stat.planned > 0 || stat.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

export interface WeekdayStat {
  weekday: number;
  /** Average share of that weekday's goal that gets reached. */
  ratio: number | null;
  /** Average minutes studied on that weekday. */
  minutes: number | null;
  /** The goal that weekday carries, for the label under the bar. */
  goalMinutes: number;
  sampleSize: number;
}

export function weekdayBreakdown(
  scores: DayScore[],
  settings: GoalSettings,
  reference: DayKey,
): WeekdayStat[] {
  const buckets = Array.from({ length: 7 }, () => ({
    ratioSum: 0,
    minuteSum: 0,
    count: 0,
  }));

  for (const score of scores) {
    if (score.ratio === null) continue;
    const bucket = buckets[weekdayIndex(score.day)];
    bucket.ratioSum += score.ratio;
    bucket.minuteSum += score.minutes;
    bucket.count += 1;
  }

  // Any day of the reference week resolves that weekday's configured goal.
  const referenceWeek = weekDays(reference);

  return buckets.map((bucket, weekday) => ({
    weekday,
    ratio: bucket.count > 0 ? bucket.ratioSum / bucket.count : null,
    minutes: bucket.count > 0 ? bucket.minuteSum / bucket.count : null,
    goalMinutes: goalMinutesFor(settings, referenceWeek[weekday]),
    sampleSize: bucket.count,
  }));
}

export interface TrendPoint {
  day: DayKey;
  ratio: number | null;
  minutes: number;
  /** Trailing seven-day average of the ratio. */
  average: number | null;
  /** Trailing seven-day average of the minutes. */
  averageMinutes: number | null;
}

/** Daily ratios plus a trailing moving average, for the trend chart. */
export function buildTrend(scores: DayScore[], window = 7): TrendPoint[] {
  return scores.map((score, index) => {
    const slice = scores.slice(Math.max(0, index - window + 1), index + 1);
    return {
      day: score.day,
      ratio: score.ratio,
      minutes: score.minutes,
      average: averageRatio(slice),
      averageMinutes: averageMinutes(slice),
    };
  });
}

export interface StatsOverview {
  days: DayKey[];
  scores: DayScore[];
  trend: TrendPoint[];
  streaks: StreakInfo;
  weekOverWeek: PeriodComparison;
  monthOverMonth: PeriodComparison;
  categories: CategoryStat[];
  routines: RoutineStat[];
  weekdays: WeekdayStat[];
  thisWeek: {
    days: DayKey[];
    scores: DayScore[];
    flexible: FlexibleProgress[];
    summary: WeekScore;
  };
  totals: {
    /** Minutes logged over the whole range. */
    minutes: number;
    /** Minutes the range asked for. */
    goalMinutes: number;
    activeDays: number;
    successfulDays: number;
    averageMinutes: number | null;
    averageRatio: number | null;
  };
}

/** Single pass that produces everything the statistics screen renders. */
export function buildStatsOverview(
  data: AppData,
  today: DayKey,
  rangeDays = 90,
): StatsOverview {
  const settings = data.settings;
  const days = lastDays(today, rangeDays);
  const scores = computeDayScores(data.entries, days, settings);
  const currentWeek = weekDays(today);
  const weekScores = computeDayScores(data.entries, currentWeek, settings);
  const flexible = flexibleProgressForWeek(
    data.routines,
    data.entries,
    currentWeek,
  );

  const activeDays = scores.filter((s) => s.ratio !== null).length;
  const successfulDays = scores.filter((s) => isSuccessfulDay(s, settings)).length;

  return {
    days,
    scores,
    trend: buildTrend(scores),
    streaks: computeStreaks(scores, settings, today),
    weekOverWeek: comparePeriods(data.entries, today, 7, settings),
    monthOverMonth: comparePeriods(data.entries, today, 30, settings),
    categories: categoryBreakdown(data.entries, data.categories, days),
    routines: routineConsistency(data, lastDays(today, 30)),
    weekdays: weekdayBreakdown(scores, settings, today),
    thisWeek: {
      days: currentWeek,
      scores: weekScores,
      flexible,
      summary: scoreWeek(weekScores, settings),
    },
    totals: {
      minutes: totalMinutes(scores),
      goalMinutes: scores.reduce((sum, s) => sum + s.goalMinutes, 0),
      activeDays,
      successfulDays,
      averageMinutes: averageMinutes(scores),
      averageRatio: averageRatio(scores),
    },
  };
}

/** True when a routine is expected today but has no time logged yet. */
export function pendingRoutinesFor(
  routines: Routine[],
  entries: Entry[],
  day: DayKey,
): Routine[] {
  const loggedIds = new Set(
    entries
      .filter((e) => e.day === day && (e.minutes ?? 0) > 0)
      .map((e) => e.sourceId),
  );
  return routines.filter(
    (routine) => routineOccursOn(routine, day) && !loggedIds.has(routine.id),
  );
}
