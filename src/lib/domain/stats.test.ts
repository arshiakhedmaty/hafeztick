import { describe, expect, it } from "vitest";
import { lastDays } from "../date/day";
import {
  categoryBreakdown,
  computeDayScores,
  comparePeriods,
  computeStreaks,
  weekdayBreakdown,
} from "./stats";
import { makeGoals, makeLogged } from "./test-utils";
import type { Category } from "./types";

const TODAY = "2026-08-29"; // Saturday
const GOALS = makeGoals(); // five hours a day, 70% (= 3h30m) makes it a success

/** Builds one entry per listed day, carrying that many minutes. */
function entriesFor(days: Record<string, number>) {
  return Object.entries(days).map(([day, minutes]) =>
    makeLogged({ day, sourceId: day, minutes }),
  );
}

const HIT = 300; // the whole five hours
const MISS = 60; // an hour: real, but short of the threshold

describe("computeStreaks", () => {
  const settings = { successThreshold: 0.7, restDays: [] as number[] };

  it("counts consecutive successful days back from today", () => {
    const entries = entriesFor({
      "2026-08-26": HIT,
      "2026-08-27": HIT,
      "2026-08-28": HIT,
      "2026-08-29": HIT,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10), GOALS);

    expect(computeStreaks(scores, settings, TODAY).current).toBe(4);
  });

  it("judges a day by its hours, not by how much of the list was cleared", () => {
    // Three items planned, all three logged — but only 30 minutes in total.
    const entries = [
      makeLogged({ day: TODAY, sourceId: "a", minutes: 10 }),
      makeLogged({ day: TODAY, sourceId: "b", minutes: 10 }),
      makeLogged({ day: TODAY, sourceId: "c", minutes: 10 }),
    ];
    const [score] = computeDayScores(entries, [TODAY], GOALS);

    expect(score.loggedCount).toBe(3);
    expect(score.ratio).toBeCloseTo(0.1);
  });

  it("does not let an unfinished today break the streak", () => {
    const entries = entriesFor({
      "2026-08-27": HIT,
      "2026-08-28": HIT,
      "2026-08-29": MISS, // today, still open
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10), GOALS);

    expect(computeStreaks(scores, settings, TODAY).current).toBe(2);
  });

  it("breaks on a short day that is not today", () => {
    const entries = entriesFor({
      "2026-08-26": HIT,
      "2026-08-27": MISS,
      "2026-08-28": HIT,
      "2026-08-29": HIT,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10), GOALS);

    expect(computeStreaks(scores, settings, TODAY).current).toBe(2);
  });

  it("treats days with nothing planned and nothing logged as neutral", () => {
    const entries = entriesFor({
      "2026-08-26": HIT,
      // 2026-08-27 has nothing at all
      "2026-08-28": HIT,
      "2026-08-29": HIT,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10), GOALS);

    expect(computeStreaks(scores, settings, TODAY).current).toBe(3);
  });

  it("treats a weekday with a zero hour goal as neutral", () => {
    // 2026-08-28 is a Friday (weekday index 6); give Friday no goal at all.
    const goals = makeGoals({
      weekdayGoalMinutes: [null, null, null, null, null, null, 0],
    });
    const entries = entriesFor({
      "2026-08-26": HIT,
      "2026-08-27": HIT,
      "2026-08-28": 0,
      "2026-08-29": HIT,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10), goals);

    expect(computeStreaks(scores, settings, TODAY).current).toBe(3);
  });

  it("does not break a streak on a configured rest day", () => {
    const entries = entriesFor({
      "2026-08-26": HIT,
      "2026-08-27": HIT,
      "2026-08-28": MISS,
      "2026-08-29": HIT,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10), GOALS);

    expect(
      computeStreaks(scores, { successThreshold: 0.7, restDays: [6] }, TODAY)
        .current,
    ).toBe(3);
    expect(computeStreaks(scores, settings, TODAY).current).toBe(1);
  });

  it("remembers the best streak even after it is broken", () => {
    const entries = entriesFor({
      "2026-08-20": HIT,
      "2026-08-21": HIT,
      "2026-08-22": HIT,
      "2026-08-23": MISS,
      "2026-08-29": HIT,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 20), GOALS);
    const streaks = computeStreaks(scores, settings, TODAY);

    expect(streaks.best).toBe(3);
    expect(streaks.current).toBe(1);
  });
});

describe("comparePeriods", () => {
  it("compares average daily minutes against the window before it", () => {
    const entries = [
      // previous week: 60 and 120 minutes -> 90 a day
      ...entriesFor({ "2026-08-17": 60, "2026-08-18": 120 }),
      // current week: 180 and 240 -> 210 a day
      ...entriesFor({ "2026-08-27": 180, "2026-08-28": 240 }),
    ];

    const comparison = comparePeriods(entries, TODAY, 7, GOALS);
    expect(comparison.current).toBe(210);
    expect(comparison.previous).toBe(90);
    expect(comparison.delta).toBe(120);
  });

  it("reports no delta when a side has no data", () => {
    const entries = entriesFor({ "2026-08-28": 120 });
    expect(comparePeriods(entries, TODAY, 7, GOALS).delta).toBeNull();
  });
});

describe("categoryBreakdown", () => {
  const categories: Category[] = [
    { id: "project", name: "پروژه", color: "sky", order: 0 },
    { id: "lang", name: "زبان", color: "violet", order: 1 },
  ];

  it("reports hours per category, and each one's share of the total", () => {
    const entries = [
      makeLogged({ day: TODAY, sourceId: "p", categoryId: "project", minutes: 120 }),
      makeLogged({ day: TODAY, sourceId: "l", categoryId: "lang", minutes: 180 }),
    ];

    const stats = categoryBreakdown(entries, categories, [TODAY]);
    expect(stats.map((s) => [s.name, s.minutes])).toEqual([
      ["زبان", 180],
      ["پروژه", 120],
    ]);
    expect(stats[0].share).toBeCloseTo(0.6);
  });

  it("leaves out items that carry no time at all", () => {
    const entries = [
      makeLogged({ day: TODAY, sourceId: "p", categoryId: "project", minutes: 60 }),
      makeLogged({ day: TODAY, sourceId: "l", categoryId: "lang", minutes: 0 }),
    ];

    const stats = categoryBreakdown(entries, categories, [TODAY]);
    expect(stats).toHaveLength(1);
    expect(stats[0].categoryId).toBe("project");
  });
});

describe("weekdayBreakdown", () => {
  it("averages each weekday against the goal that weekday carries", () => {
    // Saturday asks for six hours, every other day for the default five.
    const goals = makeGoals({
      weekdayGoalMinutes: [360, null, null, null, null, null, null],
    });
    // 2026-08-22 and 2026-08-29 are both Saturdays.
    const entries = entriesFor({ "2026-08-22": 180, "2026-08-29": 360 });
    const scores = computeDayScores(entries, lastDays(TODAY, 14), goals);

    const saturday = weekdayBreakdown(scores, goals, TODAY)[0];
    expect(saturday.sampleSize).toBe(2);
    expect(saturday.minutes).toBe(270);
    expect(saturday.goalMinutes).toBe(360);
    expect(saturday.ratio).toBeCloseTo(0.75);
  });
});
