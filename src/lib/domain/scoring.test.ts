import { describe, expect, it } from "vitest";
import {
  averageMinutes,
  averageRatio,
  flexibleProgressForWeek,
  isSuccessfulDay,
  scoreDay,
  scoreWeek,
} from "./scoring";
import { makeEntry, makeGoals, makeLogged, makeRoutine } from "./test-utils";

const DAY = "2026-08-29"; // Saturday
const GOALS = makeGoals(); // five hours a day, 70% makes it a success

describe("scoreDay", () => {
  it("returns null when the day carries no hour goal", () => {
    const goals = makeGoals({ dailyGoalMinutes: 0 });
    const entries = [makeLogged({ day: DAY, minutes: 120 })];
    expect(scoreDay(DAY, entries, goals).ratio).toBeNull();
  });

  it("returns null when nothing was planned and nothing was logged", () => {
    expect(scoreDay(DAY, [], GOALS).ratio).toBeNull();
  });

  it("scores logged minutes against that day's goal", () => {
    const entries = [
      makeLogged({ day: DAY, sourceId: "a", minutes: 120 }),
      makeLogged({ day: DAY, sourceId: "b", minutes: 120 }),
    ];
    const score = scoreDay(DAY, entries, GOALS);

    expect(score.minutes).toBe(240);
    expect(score.goalMinutes).toBe(300);
    expect(score.ratio).toBeCloseTo(0.8);
  });

  it("ignores how many items carried the time", () => {
    const one = scoreDay(DAY, [makeLogged({ day: DAY, minutes: 180 })], GOALS);
    const many = scoreDay(
      DAY,
      [
        makeLogged({ day: DAY, sourceId: "a", minutes: 60 }),
        makeLogged({ day: DAY, sourceId: "b", minutes: 60 }),
        makeLogged({ day: DAY, sourceId: "c", minutes: 60 }),
      ],
      GOALS,
    );
    expect(one.ratio).toBe(many.ratio);
  });

  it("does not credit a planned item that carries no time", () => {
    const entries = [
      makeEntry({ day: DAY, sourceId: "a" }),
      makeEntry({ day: DAY, sourceId: "b" }),
      makeEntry({ day: DAY, sourceId: "c" }),
      makeLogged({ day: DAY, sourceId: "d", minutes: 60 }),
    ];
    const score = scoreDay(DAY, entries, GOALS);

    // Four planned items, one of them logged: 60 of 300 minutes, not 25%.
    expect(score.totalCount).toBe(4);
    expect(score.loggedCount).toBe(1);
    expect(score.ratio).toBeCloseTo(0.2);
  });

  it("keeps over-delivery visible instead of capping at the goal", () => {
    const score = scoreDay(DAY, [makeLogged({ day: DAY, minutes: 420 })], GOALS);
    expect(score.ratio).toBeCloseTo(1.4);
  });

  it("leaves skipped entries out of the count and out of the time", () => {
    const entries = [
      makeLogged({ day: DAY, sourceId: "a", minutes: 150 }),
      makeEntry({ day: DAY, sourceId: "b", status: "skipped", minutes: 90 }),
    ];
    const score = scoreDay(DAY, entries, GOALS);

    expect(score.minutes).toBe(150);
    expect(score.totalCount).toBe(1);
    expect(score.skippedCount).toBe(1);
  });

  it("counts weekly-quota time towards the day, but not as a day item", () => {
    const entries = [
      makeLogged({ day: DAY, sourceId: "a", minutes: 60 }),
      makeLogged({ day: DAY, sourceId: "gym", minutes: 90, scope: "week" }),
    ];
    const score = scoreDay(DAY, entries, GOALS);

    expect(score.minutes).toBe(150);
    expect(score.totalCount).toBe(1);
  });

  it("ignores entries belonging to another day", () => {
    const entries = [
      makeLogged({ day: DAY, sourceId: "a", minutes: 60 }),
      makeLogged({ day: "2026-08-28", sourceId: "b", minutes: 300 }),
    ];
    expect(scoreDay(DAY, entries, GOALS).minutes).toBe(60);
  });

  it("uses the weekday's own goal when one is set", () => {
    // Saturday is weekday 0; six hours there, the default elsewhere.
    const goals = makeGoals({
      weekdayGoalMinutes: [360, null, null, null, null, null, null],
    });
    const score = scoreDay(DAY, [makeLogged({ day: DAY, minutes: 180 })], goals);

    expect(score.goalMinutes).toBe(360);
    expect(score.ratio).toBeCloseTo(0.5);
  });
});

describe("isSuccessfulDay", () => {
  it("needs the configured share of that day's hour goal", () => {
    // Saturday asks for six hours; at 70% that is 4h12m.
    const goals = makeGoals({
      weekdayGoalMinutes: [360, null, null, null, null, null, null],
    });
    const just = scoreDay(DAY, [makeLogged({ day: DAY, minutes: 252 })], goals);
    const short = scoreDay(DAY, [makeLogged({ day: DAY, minutes: 251 })], goals);

    expect(isSuccessfulDay(just, goals)).toBe(true);
    expect(isSuccessfulDay(short, goals)).toBe(false);
  });

  it("is never true for a day without a goal", () => {
    const goals = makeGoals({ dailyGoalMinutes: 0 });
    const score = scoreDay(DAY, [makeLogged({ day: DAY, minutes: 600 })], goals);
    expect(isSuccessfulDay(score, goals)).toBe(false);
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

  it("counts only the days inside the week, and their minutes", () => {
    const routine = makeRoutine({
      id: "gym",
      repeat: { kind: "flexible", timesPerWeek: 3 },
    });
    const entries = [
      makeLogged({ day: "2026-08-29", sourceType: "routine", sourceId: "gym", minutes: 45, scope: "week" }),
      makeLogged({ day: "2026-09-01", sourceType: "routine", sourceId: "gym", minutes: 60, scope: "week" }),
      makeLogged({ day: "2026-08-22", sourceType: "routine", sourceId: "gym", minutes: 90, scope: "week" }),
    ];

    const [progress] = flexibleProgressForWeek([routine], entries, week);
    expect(progress.done).toBe(2);
    expect(progress.minutes).toBe(105);
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
        makeLogged({ day, sourceType: "routine", sourceId: "walk", minutes: 30, scope: "week" }),
      );

    expect(flexibleProgressForWeek([routine], entries, week)[0].ratio).toBe(1);
  });
});

describe("scoreWeek", () => {
  it("sums the week's minutes against the week's hour budget", () => {
    const days = ["2026-08-29", "2026-08-30"];
    const scores = [
      scoreDay(days[0], [makeLogged({ day: days[0], minutes: 300 })], GOALS),
      scoreDay(days[1], [makeLogged({ day: days[1], minutes: 120 })], GOALS),
    ];

    const week = scoreWeek(scores, GOALS);
    expect(week.minutes).toBe(420);
    expect(week.goalMinutes).toBe(600);
    expect(week.ratio).toBeCloseTo(0.7);
    // 300/300 clears the threshold, 120/300 does not.
    expect(week.successfulDays).toBe(1);
    expect(week.plannedDays).toBe(2);
  });
});

describe("averages", () => {
  it("skip days that were never scored", () => {
    const scores = [
      scoreDay("2026-08-27", [makeLogged({ day: "2026-08-27", minutes: 300 })], GOALS),
      scoreDay("2026-08-28", [], GOALS),
      scoreDay("2026-08-29", [makeEntry({ day: "2026-08-29" })], GOALS),
    ];

    expect(averageRatio(scores)).toBe(0.5);
    expect(averageMinutes(scores)).toBe(150);
  });
});
