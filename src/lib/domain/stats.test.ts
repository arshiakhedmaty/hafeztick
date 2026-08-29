import { describe, expect, it } from "vitest";
import { lastDays } from "../date/day";
import { computeDayScores, comparePeriods, computeStreaks } from "./stats";
import { makeEntry } from "./test-utils";

const TODAY = "2026-08-29"; // Saturday

/** Builds one done/missed entry per listed day. */
function entriesFor(days: Record<string, boolean>) {
  return Object.entries(days).map(([day, done]) =>
    makeEntry({ day, sourceId: day, status: done ? "done" : "pending" }),
  );
}

describe("computeStreaks", () => {
  const settings = { dailyGoal: 0.7, restDays: [] as number[] };

  it("counts consecutive successful days back from today", () => {
    const entries = entriesFor({
      "2026-08-26": true,
      "2026-08-27": true,
      "2026-08-28": true,
      "2026-08-29": true,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10));

    expect(computeStreaks(scores, settings, TODAY).current).toBe(4);
  });

  it("does not let an unfinished today break the streak", () => {
    const entries = entriesFor({
      "2026-08-27": true,
      "2026-08-28": true,
      "2026-08-29": false, // today, still open
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10));

    expect(computeStreaks(scores, settings, TODAY).current).toBe(2);
  });

  it("breaks on a missed day that is not today", () => {
    const entries = entriesFor({
      "2026-08-26": true,
      "2026-08-27": false,
      "2026-08-28": true,
      "2026-08-29": true,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10));

    expect(computeStreaks(scores, settings, TODAY).current).toBe(2);
  });

  it("treats days with no plan as neutral", () => {
    const entries = entriesFor({
      "2026-08-26": true,
      // 2026-08-27 has nothing planned at all
      "2026-08-28": true,
      "2026-08-29": true,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10));

    expect(computeStreaks(scores, settings, TODAY).current).toBe(3);
  });

  it("does not break a streak on a configured rest day", () => {
    // 2026-08-28 is a Friday (weekday index 6).
    const entries = entriesFor({
      "2026-08-26": true,
      "2026-08-27": true,
      "2026-08-28": false,
      "2026-08-29": true,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 10));

    expect(computeStreaks(scores, { dailyGoal: 0.7, restDays: [6] }, TODAY).current).toBe(3);
    expect(computeStreaks(scores, settings, TODAY).current).toBe(1);
  });

  it("remembers the best streak even after it is broken", () => {
    const entries = entriesFor({
      "2026-08-20": true,
      "2026-08-21": true,
      "2026-08-22": true,
      "2026-08-23": false,
      "2026-08-29": true,
    });
    const scores = computeDayScores(entries, lastDays(TODAY, 20));
    const streaks = computeStreaks(scores, settings, TODAY);

    expect(streaks.best).toBe(3);
    expect(streaks.current).toBe(1);
  });
});

describe("comparePeriods", () => {
  it("compares the last window against the one before it", () => {
    const entries = [
      // previous week: one done, one missed -> 50%
      ...entriesFor({ "2026-08-17": true, "2026-08-18": false }),
      // current week: both done -> 100%
      ...entriesFor({ "2026-08-27": true, "2026-08-28": true }),
    ];

    const comparison = comparePeriods(entries, TODAY, 7);
    expect(comparison.current).toBe(1);
    expect(comparison.previous).toBe(0.5);
    expect(comparison.delta).toBeCloseTo(0.5);
  });

  it("reports no delta when a side has no data", () => {
    const entries = entriesFor({ "2026-08-28": true });
    expect(comparePeriods(entries, TODAY, 7).delta).toBeNull();
  });
});
