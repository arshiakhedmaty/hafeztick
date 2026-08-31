import { describe, expect, it } from "vitest";
import { scoreDay, isSuccessfulDay } from "@/lib/domain/scoring";
import { computeStreaks, computeDayScores, weekdayBreakdown } from "@/lib/domain/stats";
import { materializeThrough, syncDay } from "@/lib/domain/schedule";
import { normalize } from "@/lib/storage/repository";
import { createEmptyData } from "@/lib/storage/defaults";
import { makeGoals, makeLogged, makeEntry, makeRoutine } from "@/lib/domain/test-utils";
import { lastDays, addDays } from "@/lib/date/day";

const G = makeGoals();
const D = "2026-08-29";

describe("adversarial input", () => {
  it("survives a negative duration in stored data", () => {
    const s = scoreDay(D, [makeEntry({ day: D, minutes: -600 })], G);
    expect(s.minutes).toBe(0);
    expect(s.ratio).toBe(0);
  });

  it("survives a missing minutes field from an older record", () => {
    const broken = { ...makeEntry({ day: D }) } as Record<string, unknown>;
    delete broken.minutes;
    expect(() =>
      scoreDay(D, [broken as never], G),
    ).not.toThrow();
  });

  it("does not divide by a zero goal", () => {
    const s = scoreDay(D, [makeLogged({ day: D, minutes: 300 })],
      makeGoals({ dailyGoalMinutes: 0 }));
    expect(s.ratio).toBeNull();
    expect(Number.isFinite(s.minutes)).toBe(true);
  });

  it("a threshold of zero does not make an empty day successful", () => {
    const goals = makeGoals({ successThreshold: 0 });
    const empty = scoreDay(D, [], goals);
    expect(isSuccessfulDay(empty, goals)).toBe(false);
  });

  it("normalise repairs a corrupt weekday goal array without throwing", () => {
    const out = normalize({
      ...createEmptyData(),
      settings: { weekdayGoalMinutes: "not an array", successThreshold: 99 },
    });
    expect(out?.settings.weekdayGoalMinutes).toHaveLength(7);
    expect(out?.settings.successThreshold).toBeLessThanOrEqual(1);
  });
});

describe("clock oddities", () => {
  it("materialising when the stored day is in the future does not loop", () => {
    const data = { ...createEmptyData(), lastMaterializedDay: addDays(D, 30) };
    const out = materializeThrough(data, D);
    expect(out.lastMaterializedDay).toBe(D);
  });

  it("a long absence backfills without unbounded work", () => {
    const data = {
      ...createEmptyData(),
      routines: [makeRoutine({ startDay: "2020-01-01" })],
      lastMaterializedDay: "2020-01-01",
    };
    const t0 = Date.now();
    const out = materializeThrough(data, D);
    expect(Date.now() - t0).toBeLessThan(500);
    // Capped, not six years of entries.
    expect(out.entries.length).toBeLessThanOrEqual(130);
  });

  it("syncDay is idempotent", () => {
    const data = { ...createEmptyData(), routines: [makeRoutine()] };
    const once = syncDay([], data, D, D);
    const twice = syncDay(once, data, D, D);
    expect(twice).toHaveLength(once.length);
  });
});

describe("streaks", () => {
  it("an empty history has no streak and does not throw", () => {
    const scores = computeDayScores([], lastDays(D, 30), G);
    const s = computeStreaks(scores, { successThreshold: 0.7, restDays: [] }, D);
    expect(s).toEqual({ current: 0, best: 0, neutralInCurrent: 0 });
  });

  it("every weekday marked as rest never breaks or extends", () => {
    const entries = lastDays(D, 5).map((day) => makeLogged({ day, sourceId: day, minutes: 10 }));
    const scores = computeDayScores(entries, lastDays(D, 10), G);
    const s = computeStreaks(scores, { successThreshold: 0.7, restDays: [0,1,2,3,4,5,6] }, D);
    expect(s.current).toBe(0);
  });
});

describe("weekdayBreakdown", () => {
  it("reports no data rather than NaN for a weekday never studied", () => {
    const stats = weekdayBreakdown([], G, D);
    expect(stats).toHaveLength(7);
    for (const s of stats) {
      expect(s.ratio).toBeNull();
      expect(s.minutes).toBeNull();
    }
  });
});
