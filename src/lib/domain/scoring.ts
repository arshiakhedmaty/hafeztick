import type { DayKey } from "../date/day";
import { type GoalSettings, goalMinutesFor } from "./goals";
import type { Entry, Routine } from "./types";
import { isFlexible } from "./schedule";

/**
 * A day is scored on time, not on ticks.
 *
 * The question the app answers is «چقدر مطالعه کردی؟», so the numerator is the
 * minutes the user actually reported and the denominator is that weekday's own
 * hour goal. Finishing four short items and finishing one long one are no
 * longer the same thing, which is the whole point.
 *
 * Entries the user marked "skipped" contribute nothing and are counted apart —
 * a deliberate release valve, so consciously dropping an item does not read as
 * failure. They do not shrink the goal: the hours were still the promise.
 */
export interface DayScore {
  day: DayKey;
  /** Minutes actually logged on this day, across every item. */
  minutes: number;
  /** Minutes this day asked for. Zero means the day is not scored. */
  goalMinutes: number;
  /**
   * `minutes / goalMinutes`, uncapped so over-delivery stays visible.
   * `null` when the day has no goal, or no history at all.
   */
  ratio: number | null;
  /** Items with time logged against them. */
  loggedCount: number;
  /** Items that were planned and not skipped. */
  totalCount: number;
  skippedCount: number;
}

export function emptyDayScore(day: DayKey, goalMinutes = 0): DayScore {
  return {
    day,
    minutes: 0,
    goalMinutes,
    ratio: null,
    loggedCount: 0,
    totalCount: 0,
    skippedCount: 0,
  };
}

export function scoreDay(
  day: DayKey,
  entries: Entry[],
  settings: GoalSettings,
): DayScore {
  const score = emptyDayScore(day, goalMinutesFor(settings, day));

  for (const entry of entries) {
    if (entry.day !== day) continue;

    if (entry.status === "skipped") {
      score.skippedCount += 1;
      continue;
    }

    // Weekly-quota routines do not add to the day's item count, but the time
    // spent on them is still time spent studying.
    const minutes = Math.max(0, entry.minutes ?? 0);
    score.minutes += minutes;
    if (minutes > 0) score.loggedCount += 1;
    if (entry.scope === "day") score.totalCount += 1;
  }

  // A day nobody planned and nobody logged is neutral rather than a zero: it
  // neither flatters nor punishes the statistics.
  const touched =
    score.totalCount > 0 || score.skippedCount > 0 || score.minutes > 0;

  score.ratio =
    score.goalMinutes > 0 && touched ? score.minutes / score.goalMinutes : null;

  return score;
}

export function isSuccessfulDay(
  score: DayScore,
  settings: Pick<GoalSettings, "successThreshold">,
): boolean {
  return score.ratio !== null && score.ratio >= settings.successThreshold;
}

export interface FlexibleProgress {
  routineId: string;
  title: string;
  target: number;
  done: number;
  /** Minutes logged against this routine across the week. */
  minutes: number;
  ratio: number;
  /** Days of this week on which it was already logged. */
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
      const logged = entries.filter(
        (entry) =>
          entry.sourceId === routine.id &&
          entry.status === "done" &&
          daySet.has(entry.day),
      );
      const doneDays = logged.map((entry) => entry.day).sort();

      return {
        routineId: routine.id,
        title: routine.title,
        target,
        done: doneDays.length,
        minutes: logged.reduce((sum, entry) => sum + (entry.minutes ?? 0), 0),
        ratio: target > 0 ? Math.min(1, doneDays.length / target) : 0,
        doneDays,
      };
    });
}

export interface WeekScore {
  /** Minutes logged across the week. */
  minutes: number;
  /** Minutes the week asked for, summed over its days. */
  goalMinutes: number;
  ratio: number | null;
  /** Days that reached their own hour goal's success threshold. */
  successfulDays: number;
  /** Days that had a goal and some history. */
  plannedDays: number;
}

export function scoreWeek(
  dayScores: DayScore[],
  settings: Pick<GoalSettings, "successThreshold">,
): WeekScore {
  let minutes = 0;
  let goalMinutes = 0;
  let successfulDays = 0;
  let plannedDays = 0;

  for (const score of dayScores) {
    minutes += score.minutes;
    goalMinutes += score.goalMinutes;
    if (score.ratio !== null) {
      plannedDays += 1;
      if (isSuccessfulDay(score, settings)) successfulDays += 1;
    }
  }

  return {
    minutes,
    goalMinutes,
    ratio: goalMinutes > 0 ? minutes / goalMinutes : null,
    successfulDays,
    plannedDays,
  };
}

/** Minutes logged across a set of day scores. */
export function totalMinutes(scores: DayScore[]): number {
  return scores.reduce((sum, score) => sum + score.minutes, 0);
}

/** Average of the days that were actually scored. */
export function averageRatio(scores: DayScore[]): number | null {
  const rated = scores.filter((s) => s.ratio !== null);
  if (rated.length === 0) return null;
  return rated.reduce((sum, s) => sum + (s.ratio as number), 0) / rated.length;
}

/** Average minutes per scored day — the honest "how much do I study" number. */
export function averageMinutes(scores: DayScore[]): number | null {
  const rated = scores.filter((s) => s.ratio !== null);
  if (rated.length === 0) return null;
  return rated.reduce((sum, s) => sum + s.minutes, 0) / rated.length;
}
