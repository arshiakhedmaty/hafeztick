import { describe, expect, it } from "vitest";
import {
  clampMinutes,
  faClock,
  faDuration,
  faGoal,
  joinMinutes,
  parseDuration,
  splitMinutes,
} from "./duration";

describe("splitMinutes / joinMinutes", () => {
  it("round-trips a duration", () => {
    expect(splitMinutes(150)).toEqual({ hours: 2, minutes: 30 });
    expect(joinMinutes(2, 30)).toBe(150);
  });

  it("normalises minutes past the hour", () => {
    expect(joinMinutes(1, 90)).toBe(150);
  });

  it("never goes negative", () => {
    expect(splitMinutes(-40)).toEqual({ hours: 0, minutes: 0 });
    expect(joinMinutes(-2, -10)).toBe(0);
  });
});

describe("clampMinutes", () => {
  it("caps a single item at a day", () => {
    expect(clampMinutes(60 * 40)).toBe(24 * 60);
  });

  it("turns nonsense into zero rather than NaN", () => {
    expect(clampMinutes(Number.NaN)).toBe(0);
  });
});

describe("formatting", () => {
  it("writes the dense clock form with a padded minute", () => {
    expect(faClock(125)).toBe("۲:۰۵");
  });

  it("writes the spoken form, dropping empty parts", () => {
    expect(faDuration(150)).toBe("۲ ساعت و ۳۰ دقیقه");
    expect(faDuration(120)).toBe("۲ ساعت");
    expect(faDuration(45)).toBe("۴۵ دقیقه");
  });

  it("lets the caller name zero", () => {
    expect(faDuration(0, { zero: "۰" })).toBe("۰");
  });

  it("keeps round goals round", () => {
    expect(faGoal(360)).toBe("۶ ساعت");
    expect(faGoal(330)).toBe("۵٫۵ ساعت");
    expect(faGoal(0)).toBe("بدون هدف");
  });
});

describe("parseDuration", () => {
  it("reads a clock value", () => {
    expect(parseDuration("2:30")).toBe(150);
  });

  it("reads Persian digits", () => {
    expect(parseDuration("۲:۳۰")).toBe(150);
  });

  it("reads a bare number as hours", () => {
    expect(parseDuration("3")).toBe(180);
    expect(parseDuration("1.5")).toBe(90);
  });

  it("reads an explicit minute value", () => {
    expect(parseDuration("90د")).toBe(90);
  });

  it("returns null on nonsense, so the caller can keep what it had", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("سلام")).toBeNull();
  });
});
