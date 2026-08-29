import { describe, expect, it } from "vitest";
import {
  averageRatio,
  flexibleProgressForWeek,
  scoreDay,
  scoreWeek,
} from "./scoring";
import { makeEntry, makeRoutine } from "./test-utils";

const DAY = "2026-08-29";

describe("scoreDay", () => {
  it("returns null when nothing was planned", () => {
    expect(scoreDay(DAY, []).ratio).toBeNull();
  });

  it("weights entries by priority", () => {
    const entries = [
      makeEntry({ day: DAY, sourceId: "a", priority: "high", status: "done" }),
      makeEntry({ day: DAY, sourceId: "b", priority: "low", status: "pending" }),
    ];
    // high = 2 done, low = 0.5 pending -> 2 / 2.5
    expect(scoreDay(DAY, entries).ratio).toBeCloseTo(0.8);
  });

  it("leaves skipped entries out of the denominator", () => {
    const entries = [
      makeEntry({ day: DAY, sourceId: "a", status: "done" }),
      makeEntry({ day: DAY, sourceId: "b", status: "skipped" }),
    ];
    const score = scoreDay(DAY, entries);
    expect(score.ratio).toBe(1);
    expect(score.totalCount).toBe(1);
    expect(score.skippedCount).toBe(1);
  });

  it("ignores entries from other days and weekly-scope entries", () => {
    const entries = [
      makeEntry({ day: DAY, sourceId: "a", status: "done" }),
      makeEntry({ day: "2026-08-28", sourceId: "b", status: "pending" }),
      makeEntry({ day: DAY, sourceId: "c", scope: "week", status: "done" }),
    ];
    const score = scoreDay(DAY, entries);
    expect(score.totalCount).toBe(1);
    expect(score.ratio).toBe(1);
  });
});

describe("flexibleProgressForWeek", () => {
  const week = [
    "2026-08-29",
    "2026-08-30",
    "2026-08-31",
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
  ];

  it("counts only the ticks inside the week", () => {
    const routine = makeRoutine({
      id: "gym",
      repeat: { kind: "flexible", timesPerWeek: 3 },
    });
    const entries = [
      makeEntry({ day: "2026-08-29", sourceType: "routine", sourceId: "gym", status: "done", scope: "week" }),
      makeEntry({ day: "2026-09-01", sourceType: "routine", sourceId: "gym", status: "done", scope: "week" }),
      makeEntry({ day: "2026-08-22", sourceType: "routine", sourceId: "gym", status: "done", scope: "week" }),
    ];

    const [progress] = flexibleProgressForWeek([routine], entries, week);
    expect(progress.done).toBe(2);
    expect(progress.target).toBe(3);
    expect(progress.ratio).toBeCloseTo(2 / 3);
  });

  it("caps the ratio at one when over-delivered", () => {
    const routine = makeRoutine({
      id: "walk",
      repeat: { kind: "flexible", timesPerWeek: 1 },
    });
    const entries = week
      .slice(0, 3)
      .map((day) =>
        makeEntry({ day, sourceType: "routine", sourceId: "walk", status: "done", scope: "week" }),
      );

    expect(flexibleProgressForWeek([routine], entries, week)[0].ratio).toBe(1);
  });
});

describe("scoreWeek", () => {
  it("adds weekly targets to the weekly denominator", () => {
    const dayScores = [scoreDay(DAY, [makeEntry({ day: DAY, status: "done" })])];
    const flexible = [
      {
        routineId: "gym",
        title: "ورزش",
        target: 3,
        done: 1,
        weight: 1,
        ratio: 1 / 3,
        doneDays: [DAY],
      },
    ];

    const week = scoreWeek(dayScores, flexible, 0.7);
    // 1 done day-weight + 1 flexible tick, out of 1 + 3
    expect(week.ratio).toBeCloseTo(0.5);
    expect(week.successfulDays).toBe(1);
    expect(week.plannedDays).toBe(1);
  });
});

describe("averageRatio", () => {
  it("skips days that had no plan", () => {
    const scores = [
      scoreDay("2026-08-27", [makeEntry({ day: "2026-08-27", status: "done" })]),
      scoreDay("2026-08-28", []),
      scoreDay("2026-08-29", [makeEntry({ day: "2026-08-29", status: "pending" })]),
    ];
    expect(averageRatio(scores)).toBe(0.5);
  });
});
