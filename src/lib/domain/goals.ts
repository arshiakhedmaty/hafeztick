import { type DayKey, weekdayIndex } from "../date/day";
import type { Settings } from "./types";

/** The part of settings that decides how many minutes a day is worth. */
export type GoalSettings = Pick<
  Settings,
  "dailyGoalMinutes" | "weekdayGoalMinutes" | "successThreshold"
>;

/**
 * How many minutes of study a given day asks for.
 *
 * A weekday may carry its own goal (Saturday six hours, Thursday two), fall
 * back to the default with `null`, or opt out entirely with `0`. A zero goal is
 * not a failed day: it is a day that is simply not scored, which is what makes
 * a light Friday harmless to the streak.
 */
export function goalMinutesFor(settings: GoalSettings, day: DayKey): number {
  const perWeekday = settings.weekdayGoalMinutes?.[weekdayIndex(day)];
  const minutes = perWeekday ?? settings.dailyGoalMinutes;
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
}

/** The minutes this day must reach to count as a successful day. */
export function successMinutesFor(settings: GoalSettings, day: DayKey): number {
  return Math.round(goalMinutesFor(settings, day) * settings.successThreshold);
}

/** Total minutes targeted across a list of days — the week's hour budget. */
export function goalMinutesForDays(
  settings: GoalSettings,
  days: DayKey[],
): number {
  return days.reduce((sum, day) => sum + goalMinutesFor(settings, day), 0);
}

/** Effective goal of each weekday, with the default already resolved. */
export function resolvedWeekdayGoals(settings: GoalSettings): number[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const own = settings.weekdayGoalMinutes?.[weekday];
    const minutes = own ?? settings.dailyGoalMinutes;
    return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
  });
}
