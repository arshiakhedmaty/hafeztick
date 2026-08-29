import {
  type DayKey,
  compareDays,
  lastDays,
  weekDays,
  weekdayIndex,
} from "../date/day";
import {
  type DayScore,
  type FlexibleProgress,
  averageRatio,
  flexibleProgressForWeek,
  scoreDay,
  scoreWeek,
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

export function computeDayScores(entries: Entry[], days: DayKey[]): DayScore[] {
  const byDay = groupEntriesByDay(entries);
  return days.map((day) => scoreDay(day, byDay.get(day) ?? []));
}

export interface StreakInfo {
  current: number;
  best: number;
  /** Days that were neutral (rest day or nothing planned) inside the streak. */
  neutralInCurrent: number;
}

function isNeutralDay(score: DayScore, restDays: number[]): boolean {
  return score.ratio === null || restDays.includes(weekdayIndex(score.day));
}

/**
 * A streak counts consecutive successful days, where "rest days" and days with
 * no plan are neutral: they neither extend nor break it. Today is never
 * allowed to break a streak, because the day is not over yet.
 */
export function computeStreaks(
  scores: DayScore[],
  settings: Pick<Settings, "dailyGoal" | "restDays">,
  today: DayKey,
): StreakInfo {
  const ordered = [...scores].sort((a, b) => compareDays(a.day, b.day));
  const { dailyGoal, restDays } = settings;

  let best = 0;
  let running = 0;
  for (const score of ordered) {
    if (isNeutralDay(score, restDays)) continue;
    if ((score.ratio as number) >= dailyGoal) {
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
    const success = (score.ratio as number) >= dailyGoal;
    if (success) {
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
  current: number | null;
  previous: number | null;
  /** Percentage-point difference, null when either side has no data. */
  delta: number | null;
}

/** Compares the last `window` days against the `window` days before them. */
export function comparePeriods(
  entries: Entry[],
  today: DayKey,
  window: number,
): PeriodComparison {
  const currentDays = lastDays(today, window);
  const previousDays = lastDays(currentDays[0], window + 1).slice(0, window);

  const current = averageRatio(computeDayScores(entries, currentDays));
  const previous = averageRatio(computeDayScores(entries, previousDays));

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
  done: number;
  total: number;
  ratio: number | null;
}

export function categoryBreakdown(
  entries: Entry[],
  categories: Category[],
  days: DayKey[],
): CategoryStat[] {
  const daySet = new Set(days);
  const buckets = new Map<string, { done: number; total: number }>();

  for (const entry of entries) {
    if (!daySet.has(entry.day) || entry.status === "skipped") continue;
    const key = entry.categoryId ?? "__none__";
    const bucket = buckets.get(key) ?? { done: 0, total: 0 };
    bucket.total += 1;
    if (entry.status === "done") bucket.done += 1;
    buckets.set(key, bucket);
  }

  const stats: CategoryStat[] = [];
  for (const category of categories) {
    const bucket = buckets.get(category.id);
    if (!bucket) continue;
    stats.push({
      categoryId: category.id,
      name: category.name,
      color: category.color,
      done: bucket.done,
      total: bucket.total,
      ratio: bucket.total > 0 ? bucket.done / bucket.total : null,
    });
  }

  const none = buckets.get("__none__");
  if (none) {
    stats.push({
      categoryId: null,
      name: "بدون دسته",
      color: "slate",
      done: none.done,
      total: none.total,
      ratio: none.total > 0 ? none.done / none.total : null,
    });
  }

  return stats.sort((a, b) => b.total - a.total);
}

export interface RoutineStat {
  routineId: string;
  title: string;
  color: Category["color"];
  done: number;
  planned: number;
  ratio: number | null;
  currentStreak: number;
}

/** Per-routine consistency over a window of days. */
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
      const done = counted.filter((entry) => entry.status === "done").length;

      let currentStreak = 0;
      for (let i = counted.length - 1; i >= 0; i -= 1) {
        if (counted[i].status === "done") currentStreak += 1;
        else break;
      }

      return {
        routineId: routine.id,
        title: routine.title,
        color: colorOf(routine.categoryId),
        done,
        planned: counted.length,
        ratio: counted.length > 0 ? done / counted.length : null,
        currentStreak,
      };
    })
    .filter((stat) => stat.planned > 0)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
}

export interface WeekdayStat {
  weekday: number;
  ratio: number | null;
  sampleSize: number;
}

export function weekdayBreakdown(scores: DayScore[]): WeekdayStat[] {
  const buckets = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));

  for (const score of scores) {
    if (score.ratio === null) continue;
    const bucket = buckets[weekdayIndex(score.day)];
    bucket.sum += score.ratio;
    bucket.count += 1;
  }

  return buckets.map((bucket, weekday) => ({
    weekday,
    ratio: bucket.count > 0 ? bucket.sum / bucket.count : null,
    sampleSize: bucket.count,
  }));
}

export interface TrendPoint {
  day: DayKey;
  ratio: number | null;
  average: number | null;
}

/** Daily ratios plus a trailing moving average, for the trend chart. */
export function buildTrend(scores: DayScore[], window = 7): TrendPoint[] {
  return scores.map((score, index) => {
    const slice = scores.slice(Math.max(0, index - window + 1), index + 1);
    return {
      day: score.day,
      ratio: score.ratio,
      average: averageRatio(slice),
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
    summary: ReturnType<typeof scoreWeek>;
  };
  totals: {
    doneEntries: number;
    plannedEntries: number;
    activeDays: number;
    successfulDays: number;
    averageRatio: number | null;
  };
}

/** Single pass that produces everything the statistics screen renders. */
export function buildStatsOverview(
  data: AppData,
  today: DayKey,
  rangeDays = 90,
): StatsOverview {
  const days = lastDays(today, rangeDays);
  const scores = computeDayScores(data.entries, days);
  const currentWeek = weekDays(today);
  const weekScores = computeDayScores(data.entries, currentWeek);
  const flexible = flexibleProgressForWeek(
    data.routines,
    data.entries,
    currentWeek,
  );

  const plannedEntries = scores.reduce((sum, s) => sum + s.totalCount, 0);
  const doneEntries = scores.reduce((sum, s) => sum + s.doneCount, 0);
  const activeDays = scores.filter((s) => s.ratio !== null).length;
  const successfulDays = scores.filter(
    (s) => s.ratio !== null && s.ratio >= data.settings.dailyGoal,
  ).length;

  return {
    days,
    scores,
    trend: buildTrend(scores),
    streaks: computeStreaks(scores, data.settings, today),
    weekOverWeek: comparePeriods(data.entries, today, 7),
    monthOverMonth: comparePeriods(data.entries, today, 30),
    categories: categoryBreakdown(data.entries, data.categories, days),
    routines: routineConsistency(data, lastDays(today, 30)),
    weekdays: weekdayBreakdown(scores),
    thisWeek: {
      days: currentWeek,
      scores: weekScores,
      flexible,
      summary: scoreWeek(weekScores, flexible, data.settings.dailyGoal),
    },
    totals: {
      doneEntries,
      plannedEntries,
      activeDays,
      successfulDays,
      averageRatio: averageRatio(scores),
    },
  };
}

/** True when a routine is expected today but not yet ticked. */
export function pendingRoutinesFor(
  routines: Routine[],
  entries: Entry[],
  day: DayKey,
): Routine[] {
  const doneIds = new Set(
    entries.filter((e) => e.day === day && e.status === "done").map((e) => e.sourceId),
  );
  return routines.filter(
    (routine) => routineOccursOn(routine, day) && !doneIds.has(routine.id),
  );
}
