import { describe, expect, it } from "vitest";
import {
  goalMinutesFor,
  goalMinutesForDays,
  resolvedWeekdayGoals,
  successMinutesFor,
} from "./goals";
import { weekDays } from "../date/day";
import { makeGoals } from "./test-utils";

const SATURDAY = "2026-08-29";
const SUNDAY = "2026-08-30";

describe("goalMinutesFor", () => {
  it("falls back to the default when a weekday has no goal of its own", () => {
    expect(goalMinutesFor(makeGoals(), SATURDAY)).toBe(300);
  });

  it("prefers the weekday's own goal", () => {
    const goals = makeGoals({
      weekdayGoalMinutes: [360, 240, null, null, null, null, null],
    });
    expect(goalMinutesFor(goals, SATURDAY)).toBe(360);
    expect(goalMinutesFor(goals, SUNDAY)).toBe(240);
  });

  it("treats an explicit zero as 'do not score this day'", () => {
    const goals = makeGoals({
      weekdayGoalMinutes: [0, null, null, null, null, null, null],
    });
    expect(goalMinutesFor(goals, SATURDAY)).toBe(0);
  });
});

describe("successMinutesFor", () => {
  it("is the configured share of that day's own goal", () => {
    // Six hours at 70% is four hours and twelve minutes.
    const goals = makeGoals({
      weekdayGoalMinutes: [360, null, null, null, null, null, null],
      successThreshold: 0.7,
    });
    expect(successMinutesFor(goals, SATURDAY)).toBe(252);
  });
});

describe("goalMinutesForDays", () => {
  it("adds up a week of independently configured days", () => {
    const goals = makeGoals({
      weekdayGoalMinutes: [360, 240, 300, 300, 300, 120, 0],
    });
    expect(goalMinutesForDays(goals, weekDays(SATURDAY))).toBe(1620);
  });
});

describe("resolvedWeekdayGoals", () => {
  it("shows what each weekday actually asks for", () => {
    const goals = makeGoals({
      weekdayGoalMinutes: [360, null, null, null, null, null, 0],
    });
    expect(resolvedWeekdayGoals(goals)).toEqual([360, 300, 300, 300, 300, 300, 0]);
  });
});
