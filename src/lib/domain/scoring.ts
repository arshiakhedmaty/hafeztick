import type { DayKey } from "../date/day";
import { type Entry, PRIORITY_WEIGHT, type Routine } from "./types";
import { isFlexible } from "./schedule";

/**
 * Scores are weighted by priority, so finishing what matters counts for more
 * than clearing easy items. Entries the user explicitly marked "skipped" leave
 * the denominator entirely — a deliberate release valve so that consciously
 * dropping something does not read as failure.
 */
export interface DayScore {
  day: DayKey;
  doneWeight: number;
  totalWeight: number;
  /** null when nothing was planned for the day. */
  ratio: number | null;
  doneCount: number;
  totalCount: number;
  skippedCount: number;
}

export function emptyDayScore(day: DayKey): DayScore {
  return {
    day,
    doneWeight: 0,
    totalWeight: 0,
    ratio: null,
    doneCount: 0,
    totalCount: 0,
    skippedCount: 0,
  };
}

export function scoreDay(day: DayKey, entries: Entry[]): DayScore {
  const score = emptyDayScore(day);

  for (const entry of entries) {
    if (entry.day !== day || entry.scope !== "day") continue;
    if (entry.status === "skipped") {
      score.skippedCount += 1;
      continue;
    }
    const weight = PRIORITY_WEIGHT[entry.priority];
    score.totalWeight += weight;
    score.totalCount += 1;
    if (entry.status === "done") {
      score.doneWeight += weight;
      score.doneCount += 1;
    }
  }

  score.ratio = score.totalWeight > 0 ? score.doneWeight / score.totalWeight : null;
  return score;
}

export interface FlexibleProgress {
  routineId: string;
  title: string;
  target: number;
  done: number;
  weight: number;
  ratio: number;
  /** Days of this week on which it was already ticked. */
  doneDays: DayKey[];
}

/** Weekly progress of "n times a week" routines. */
export function flexibleProgressForWeek(
  routines: Routine[],
  entries: Entry[],
  days: DayKey[],
): FlexibleProgress[] {
  const daySet = new Set(days);
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  return routines
    .filter(
      (routine) =>
        isFlexible(routine) &&
        routine.archivedAt === null &&
        routine.startDay <= lastDay &&
        (routine.endDay === null || routine.endDay >= firstDay),
    )
    .map((routine) => {
      const target =
        routine.repeat.kind === "flexible" ? routine.repeat.timesPerWeek : 0;
      const doneDays = entries
        .filter(
          (entry) =>
            entry.sourceId === routine.id &&
            entry.status === "done" &&
            daySet.has(entry.day),
        )
        .map((entry) => entry.day)
        .sort();

      return {
        routineId: routine.id,
        title: routine.title,
        target,
        done: doneDays.length,
        weight: PRIORITY_WEIGHT[routine.priority],
        ratio: target > 0 ? Math.min(1, doneDays.length / target) : 0,
        doneDays,
      };
    });
}

export interface WeekScore {
  ratio: number | null;
  doneWeight: number;
  totalWeight: number;
  doneCount: number;
  totalCount: number;
  /** Days that reached the daily goal. */
  successfulDays: number;
  plannedDays: number;
}

export function scoreWeek(
  dayScores: DayScore[],
  flexible: FlexibleProgress[],
  dailyGoal: number,
): WeekScore {
  let doneWeight = 0;
  let totalWeight = 0;
  let doneCount = 0;
  let totalCount = 0;
  let successfulDays = 0;
  let plannedDays = 0;

  for (const score of dayScores) {
    doneWeight += score.doneWeight;
    totalWeight += score.totalWeight;
    doneCount += score.doneCount;
    totalCount += score.totalCount;
    if (score.ratio !== null) {
      plannedDays += 1;
      if (score.ratio >= dailyGoal) successfulDays += 1;
    }
  }

  for (const item of flexible) {
    doneWeight += Math.min(item.done, item.target) * item.weight;
    totalWeight += item.target * item.weight;
    doneCount += Math.min(item.done, item.target);
    totalCount += item.target;
  }

  return {
    ratio: totalWeight > 0 ? doneWeight / totalWeight : null,
    doneWeight,
    totalWeight,
    doneCount,
    totalCount,
    successfulDays,
    plannedDays,
  };
}

/** Average of the days that actually had a plan. */
export function averageRatio(scores: DayScore[]): number | null {
  const rated = scores.filter((s) => s.ratio !== null);
  if (rated.length === 0) return null;
  return rated.reduce((sum, s) => sum + (s.ratio as number), 0) / rated.length;
}
