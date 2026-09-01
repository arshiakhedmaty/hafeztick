import { type DayKey, compareDays, lastDays, startOfWeek, addDays, weekDays, weekdayIndex } from "../date/day";
import { type DayScore, isSuccessfulDay, scoreDay, totalMinutes } from "./scoring";
import { groupEntriesByDay } from "./stats";
import type { AppData, Entry, Settings } from "./types";

/**
 * What the app should say to this person today — at most one thing.
 *
 * A ledger that only records is honest but inert; an app that comments on
 * everything becomes noise and gets dismissed on reflex. So there is exactly
 * one slot, and it speaks only at the four moments that decide whether
 * somebody keeps going:
 *
 *   1. The goal is out of reach.  Someone aiming at six hours who studies two
 *      fails every single day. A target that cannot be met stops being a
 *      target and becomes a verdict, and that is the most common reason
 *      people abandon a tracker. Nothing else matters until it is fixed, so
 *      this outranks everything.
 *   2. A streak just broke.  The dangerous moment is not the missed day, it
 *      is the day after — when a run that felt worth protecting reads as zero
 *      and the honest conclusion is "I have already failed, why continue".
 *      Naming what was built, and that it is still there, is the whole
 *      intervention.
 *   3. A milestone.  Cumulative hours are the number that says who you are
 *      becoming rather than how today went. They are worth stopping for.
 *   4. A strong week.  Reinforcing what already worked is cheaper than
 *      correcting what did not.
 *
 * Everything here is derived; nothing is stored except which messages have
 * been seen. Each returns `null` rather than a softened half-message when its
 * condition is not clearly met — a slot that is usually empty is a slot that
 * gets read when it is not.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Enough scored history to say anything about a person's pattern. */
const ENOUGH_DAYS = 14;
/** How long a dismissed message stays away. */
export const SNOOZE_DAYS = 14;

export type Insight =
  | {
      kind: "goal-too-high";
      /** What the person actually averages, in minutes. */
      averageMinutes: number;
      /** The goal they are being measured against. */
      goalMinutes: number;
      /** A target their own history says they would meet. */
      suggestedMinutes: number;
    }
  | {
      kind: "streak-broken";
      /** How long the run was before it ended. */
      lostStreak: number;
      /** The best run they have ever had, which is not lost. */
      bestStreak: number;
    }
  | {
      kind: "milestone";
      /** Whole hours crossed. */
      hours: number;
      /** Days that carry logged time — the days those hours were built from. */
      days: number;
    }
  | {
      kind: "strong-week";
      minutes: number;
      previousMinutes: number;
    };

export type InsightKind = Insight["kind"];

/** Milestones in hours. Sparse enough that reaching one still means something. */
export const MILESTONES = [10, 25, 50, 100, 200, 350, 500, 750, 1000] as const;

function scoredDays(scores: DayScore[]): DayScore[] {
  return scores.filter((score) => score.ratio !== null);
}

/**
 * A goal the person's own history says they would meet: their average, rounded
 * up to the next half hour. Deliberately not their best day — a target set
 * from a peak is the same trap in a smaller size.
 */
export function suggestGoal(averageMinutes: number): number {
  return Math.max(30, Math.ceil(averageMinutes / 30) * 30);
}

function goalTooHigh(
  scores: DayScore[],
  settings: Pick<Settings, "dailyGoalMinutes">,
): Insight | null {
  const scored = scoredDays(scores);
  if (scored.length < ENOUGH_DAYS) return null;

  const average = totalMinutes(scored) / scored.length;
  const goal = settings.dailyGoalMinutes;
  if (goal <= 0) return null;

  // Missing by a little is a normal week. Missing by nearly half, every day
  // for a fortnight, is a target set for somebody else's life.
  if (average >= goal * 0.6) return null;

  const suggested = suggestGoal(average);
  if (goal - suggested < 45) return null;

  return {
    kind: "goal-too-high",
    averageMinutes: Math.round(average),
    goalMinutes: goal,
    suggestedMinutes: suggested,
  };
}

/**
 * Looks for a run that ended in the last few days.
 *
 * Rest days and days with no goal are neutral here exactly as they are for the
 * streak itself, so a quiet Friday never reads as a break.
 */
function streakBroken(
  scores: DayScore[],
  settings: Pick<Settings, "successThreshold" | "restDays">,
  today: DayKey,
): Insight | null {
  const ordered = [...scores].sort((a, b) => compareDays(a.day, b.day));
  const neutral = (score: DayScore) =>
    score.ratio === null || settings.restDays.includes(weekdayIndex(score.day));

  // Today is still open, so it can neither break a run nor end one.
  const past = ordered.filter((score) => compareDays(score.day, today) < 0);

  let lastMissIndex = -1;
  for (let i = past.length - 1; i >= 0; i -= 1) {
    if (neutral(past[i])) continue;
    if (!isSuccessfulDay(past[i], settings)) {
      lastMissIndex = i;
      break;
    }
    // A successful day after the miss means the run has already resumed.
    return null;
  }
  if (lastMissIndex === -1) return null;

  // Only speak while it is still the day after, not a fortnight later.
  const missedDay = past[lastMissIndex].day;
  const daysSince = Math.round(
    (Date.parse(`${today}T12:00:00`) - Date.parse(`${missedDay}T12:00:00`)) / DAY,
  );
  if (daysSince > 3) return null;

  let lost = 0;
  for (let i = lastMissIndex - 1; i >= 0; i -= 1) {
    if (neutral(past[i])) continue;
    if (!isSuccessfulDay(past[i], settings)) break;
    lost += 1;
  }
  // Losing a two-day run is not a crisis and does not need a message.
  if (lost < 3) return null;

  let best = 0;
  let run = 0;
  for (const score of ordered) {
    if (neutral(score)) continue;
    if (isSuccessfulDay(score, settings)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  return { kind: "streak-broken", lostStreak: lost, bestStreak: best };
}

/**
 * Read straight off the entries rather than off day scores: this is the one
 * number that must cover *all* history, not a window of it, and summing a few
 * thousand records is cheaper than building a score for every day since the
 * person started.
 */
function milestone(entries: Entry[], celebrated: number): Insight | null {
  let minutes = 0;
  const days = new Set<DayKey>();
  for (const entry of entries) {
    if (entry.status === "skipped") continue;
    const logged = Math.max(0, entry.minutes ?? 0);
    if (logged === 0) continue;
    minutes += logged;
    days.add(entry.day);
  }

  const hours = Math.floor(minutes / 60);
  const reached = [...MILESTONES].reverse().find((m) => hours >= m);
  if (reached === undefined || reached <= celebrated) return null;

  return { kind: "milestone", hours: reached, days: days.size };
}

function strongWeek(
  scoresFor: (days: DayKey[]) => DayScore[],
  today: DayKey,
): Insight | null {
  // The week just gone, not the one in progress: a verdict needs a full week.
  const lastWeek = weekDays(addDays(startOfWeek(today), -1));
  const weekBefore = weekDays(addDays(startOfWeek(today), -8));

  const minutes = totalMinutes(scoresFor(lastWeek));
  const previous = totalMinutes(scoresFor(weekBefore));

  // Needs a real week to compare against, and a real improvement.
  if (previous < 120 || minutes < previous * 1.2) return null;
  // Only worth saying in the first days of the new week, while it is news.
  if (compareDays(today, addDays(startOfWeek(today), 2)) > 0) return null;

  return { kind: "strong-week", minutes, previousMinutes: previous };
}

/**
 * The single most useful thing to say right now, or nothing.
 *
 * Order is the product decision: a goal nobody can reach makes every other
 * message meaningless, and a run that just ended is more urgent than a number
 * worth celebrating.
 */
export function nextInsight(
  data: Pick<AppData, "entries"> & { settings: Settings },
  today: DayKey,
  now: number = Date.now(),
): Insight | null {
  const snoozed = data.settings.insightSnoozedAt ?? {};
  const celebrated = data.settings.celebratedHours ?? 0;

  // One pass over the entries, shared by everything below. This runs on the
  // today screen on every change, so it stays off the interaction path.
  const byDay = groupEntriesByDay(data.entries);
  const scoresFor = (days: DayKey[]) =>
    days.map((day) => scoreDay(day, byDay.get(day) ?? [], data.settings));

  let recent: DayScore[] | null = null;
  const recentScores = () =>
    (recent ??= scoresFor(lastDays(today, 30)));

  // Thunks, not values: the first candidate that applies is usually the only
  // one that gets computed.
  const candidates: Array<() => Insight | null> = [
    () => goalTooHigh(recentScores(), data.settings),
    () => streakBroken(recentScores(), data.settings, today),
    () => milestone(data.entries, celebrated),
    () => strongWeek(scoresFor, today),
  ];

  for (const candidate of candidates) {
    const insight = candidate();
    if (!insight) continue;
    const since = snoozed[insight.kind];
    // A milestone is a one-off: once celebrated it is recorded, not snoozed.
    if (since !== undefined && now - since < SNOOZE_DAYS * DAY) continue;
    return insight;
  }

  return null;
}
