import { describe, expect, it } from "vitest";
import { addDays, startOfWeek, weekdayIndex } from "../date/day";
import type { DayKey } from "../date/day";
import { DEFAULT_SETTINGS } from "../storage/defaults";
import { MILESTONES, SNOOZE_DAYS, nextInsight, suggestGoal } from "./insight";
import type { Settings } from "./types";
import { makeLogged } from "./test-utils";

const DAY = 24 * 60 * 60 * 1000;
const TODAY: DayKey = "2026-08-31";
const NOW = Date.UTC(2026, 7, 31, 9);

/**
 * Milestones are silenced by default: they fire off sheer accumulated hours,
 * so almost any fixture large enough to test something else also crosses one.
 * The milestone block opts back in explicitly.
 */
function settings(overrides: Partial<Settings> = {}): Settings {
  return {
    ...DEFAULT_SETTINGS,
    celebratedHours: MILESTONES[MILESTONES.length - 1],
    ...overrides,
  };
}

/** `count` days ending the day before `TODAY`, each with the same minutes. */
function run(count: number, minutes: number, endingBefore: DayKey = TODAY) {
  return Array.from({ length: count }, (_, i) =>
    makeLogged({
      day: addDays(endingBefore, -(count - i)),
      sourceId: `s${i}`,
      minutes,
    }),
  );
}

describe("suggestGoal", () => {
  it("rounds up to the next half hour", () => {
    expect(suggestGoal(131)).toBe(150);
    expect(suggestGoal(150)).toBe(150);
  });

  it("never suggests less than half an hour", () => {
    expect(suggestGoal(0)).toBe(30);
    expect(suggestGoal(4)).toBe(30);
  });
});

describe("goal-too-high", () => {
  it("speaks when a fortnight of days all fall far short", () => {
    const insight = nextInsight(
      { entries: run(20, 100), settings: settings({ dailyGoalMinutes: 300 }) },
      TODAY,
      NOW,
    );
    expect(insight).toEqual({
      kind: "goal-too-high",
      averageMinutes: 100,
      goalMinutes: 300,
      suggestedMinutes: 120,
    });
  });

  it("stays quiet when the goal is merely missed, not unreachable", () => {
    // 70% of the goal is a normal fortnight, not a broken target.
    const insight = nextInsight(
      { entries: run(20, 210), settings: settings({ dailyGoalMinutes: 300 }) },
      TODAY,
      NOW,
    );
    expect(insight?.kind).not.toBe("goal-too-high");
  });

  it("stays quiet before there is enough history to judge", () => {
    const insight = nextInsight(
      { entries: run(10, 30), settings: settings({ dailyGoalMinutes: 300 }) },
      TODAY,
      NOW,
    );
    expect(insight).toBeNull();
  });

  it("stays quiet when the suggestion would barely differ from the goal", () => {
    // A 60-minute goal missed badly still only suggests 30 minutes less.
    const insight = nextInsight(
      { entries: run(20, 20), settings: settings({ dailyGoalMinutes: 60 }) },
      TODAY,
      NOW,
    );
    expect(insight?.kind).not.toBe("goal-too-high");
  });

  it("stays away once dismissed, and comes back after the snooze", () => {
    const data = {
      entries: run(20, 100),
      settings: settings({
        dailyGoalMinutes: 300,
        insightSnoozedAt: { "goal-too-high": NOW - 3 * DAY },
      }),
    };
    expect(nextInsight(data, TODAY, NOW)).toBeNull();
    expect(
      nextInsight(data, TODAY, NOW + (SNOOZE_DAYS + 1) * DAY)?.kind,
    ).toBe("goal-too-high");
  });
});

describe("streak-broken", () => {
  /** A run of successful days, then one clear miss the day before today. */
  function brokenRun(length: number) {
    return [
      ...run(length, 300, addDays(TODAY, -1)),
      makeLogged({ day: addDays(TODAY, -1), sourceId: "miss", minutes: 20 }),
    ];
  }

  it("names the run that just ended", () => {
    const insight = nextInsight(
      { entries: brokenRun(6), settings: settings() },
      TODAY,
      NOW,
    );
    expect(insight).toMatchObject({ kind: "streak-broken", lostStreak: 6 });
  });

  it("reports the best run ever, not only the lost one", () => {
    const entries = [
      ...run(9, 300, addDays(TODAY, -12)),
      makeLogged({ day: addDays(TODAY, -12), sourceId: "gap", minutes: 10 }),
      ...brokenRun(4),
    ];
    const insight = nextInsight({ entries, settings: settings() }, TODAY, NOW);
    expect(insight).toMatchObject({ lostStreak: 4, bestStreak: 9 });
  });

  it("ignores a run too short to be worth mourning", () => {
    const insight = nextInsight(
      { entries: brokenRun(2), settings: settings() },
      TODAY,
      NOW,
    );
    expect(insight).toBeNull();
  });

  it("goes quiet once a successful day lands after the break", () => {
    const entries = [
      ...run(6, 300, addDays(TODAY, -2)),
      makeLogged({ day: addDays(TODAY, -2), sourceId: "miss", minutes: 20 }),
      makeLogged({ day: addDays(TODAY, -1), sourceId: "back", minutes: 300 }),
    ];
    expect(nextInsight({ entries, settings: settings() }, TODAY, NOW)).toBeNull();
  });

  it("never treats a rest day as the thing that broke the run", () => {
    const restDay = weekdayIndex(addDays(TODAY, -1));
    expect(
      nextInsight(
        { entries: brokenRun(6), settings: settings({ restDays: [restDay] }) },
        TODAY,
        NOW,
      ),
    ).toBeNull();
  });

  it("stops mentioning a break that is already a week old", () => {
    const entries = [
      ...run(6, 300, addDays(TODAY, -8)),
      makeLogged({ day: addDays(TODAY, -8), sourceId: "miss", minutes: 20 }),
    ];
    expect(nextInsight({ entries, settings: settings() }, TODAY, NOW)).toBeNull();
  });
});

describe("milestone", () => {
  it("marks the highest milestone crossed", () => {
    // 30 days × 5 hours = 150 hours, which passes 100 but not 200.
    const insight = nextInsight(
      { entries: run(30, 300), settings: settings({ celebratedHours: 0 }) },
      TODAY,
      NOW,
    );
    expect(insight).toMatchObject({ kind: "milestone", hours: 100 });
  });

  it("never repeats one already celebrated", () => {
    const insight = nextInsight(
      { entries: run(30, 300), settings: settings({ celebratedHours: 100 }) },
      TODAY,
      NOW,
    );
    expect(insight?.kind).not.toBe("milestone");
  });

  it("says nothing below the first milestone", () => {
    const insight = nextInsight(
      { entries: run(5, 60), settings: settings({ celebratedHours: 0 }) },
      TODAY,
      NOW,
    );
    expect(insight).toBeNull();
  });

  it("uses milestones that stay meaningful as they grow", () => {
    expect(MILESTONES[0]).toBe(10);
    const gaps = MILESTONES.map((m, i) => (i === 0 ? m : m - MILESTONES[i - 1]));
    expect(gaps.every((gap, i) => i === 0 || gap >= gaps[i - 1])).toBe(true);
  });
});

describe("strong-week", () => {
  // The first day of the current Persian week, so "last week" is unambiguous.
  const weekStart = startOfWeek(TODAY);
  const today = weekStart;
  // A goal these fixtures comfortably meet, so nothing else competes.
  const WEEK_SETTINGS = settings({ dailyGoalMinutes: 60 });

  function weekOf(offset: number, minutesPerDay: number) {
    return Array.from({ length: 7 }, (_, i) =>
      makeLogged({
        day: addDays(weekStart, offset + i),
        sourceId: `w${offset}d${i}`,
        minutes: minutesPerDay,
      }),
    );
  }

  it("celebrates a week that clearly beat the one before it", () => {
    const entries = [...weekOf(-14, 60), ...weekOf(-7, 120)];
    const insight = nextInsight({ entries, settings: WEEK_SETTINGS }, today, NOW);
    expect(insight).toMatchObject({
      kind: "strong-week",
      minutes: 840,
      previousMinutes: 420,
    });
  });

  it("ignores an improvement too small to mean anything", () => {
    const entries = [...weekOf(-14, 60), ...weekOf(-7, 65)];
    expect(
      nextInsight({ entries, settings: WEEK_SETTINGS }, today, NOW),
    ).toBeNull();
  });

  it("ignores a jump from a week that was barely used", () => {
    const entries = [...weekOf(-14, 2), ...weekOf(-7, 60)];
    expect(
      nextInsight({ entries, settings: WEEK_SETTINGS }, today, NOW),
    ).toBeNull();
  });

  it("stops once the new week is no longer news", () => {
    const entries = [...weekOf(-14, 60), ...weekOf(-7, 120)];
    const late = addDays(weekStart, 4);
    expect(nextInsight({ entries, settings: WEEK_SETTINGS }, late, NOW)).toBeNull();
  });
});

describe("priority", () => {
  it("puts an unreachable goal ahead of a celebration", () => {
    // 40 days at 100 minutes is 66 hours — past the 50-hour milestone — while
    // also being far under the goal.
    const insight = nextInsight(
      { entries: run(40, 100), settings: settings({ dailyGoalMinutes: 300 }) },
      TODAY,
      NOW,
    );
    expect(insight?.kind).toBe("goal-too-high");
  });

  it("falls through to the next candidate when the first is snoozed", () => {
    const insight = nextInsight(
      {
        entries: run(40, 100),
        settings: settings({
          dailyGoalMinutes: 300,
          celebratedHours: 0,
          insightSnoozedAt: { "goal-too-high": NOW - DAY },
        }),
      },
      TODAY,
      NOW,
    );
    expect(insight?.kind).toBe("milestone");
  });

  it("says nothing at all for a person whose goal simply fits", () => {
    const insight = nextInsight(
      { entries: run(9, 300), settings: settings() },
      TODAY,
      NOW,
    );
    expect(insight).toBeNull();
  });
});
