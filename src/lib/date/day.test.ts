import { describe, expect, it } from "vitest";
import {
  addDays,
  diffDays,
  formatDay,
  jalaliMonthStart,
  lastDays,
  rangeKeys,
  relativeDayLabel,
  shiftJalaliMonth,
  startOfWeek,
  weekDays,
  weekdayIndex,
} from "./day";

describe("weekdayIndex", () => {
  it("treats Saturday as the first day of the week", () => {
    expect(weekdayIndex("2026-08-29")).toBe(0); // Saturday
    expect(weekdayIndex("2026-08-30")).toBe(1); // Sunday
    expect(weekdayIndex("2026-09-04")).toBe(6); // Friday
  });
});

describe("startOfWeek", () => {
  it("returns the Saturday of that week", () => {
    expect(startOfWeek("2026-09-02")).toBe("2026-08-29");
    expect(startOfWeek("2026-08-29")).toBe("2026-08-29");
    expect(startOfWeek("2026-09-04")).toBe("2026-08-29");
  });

  it("produces seven consecutive days", () => {
    const days = weekDays("2026-09-02");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-08-29");
    expect(days[6]).toBe("2026-09-04");
  });
});

describe("day arithmetic", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("measures signed distance", () => {
    expect(diffDays("2026-09-01", "2026-08-30")).toBe(2);
    expect(diffDays("2026-08-30", "2026-09-01")).toBe(-2);
  });

  it("builds inclusive ranges", () => {
    expect(rangeKeys("2026-08-29", "2026-09-01")).toEqual([
      "2026-08-29",
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });

  it("ends lastDays on the given day", () => {
    const days = lastDays("2026-08-29", 3);
    expect(days).toEqual(["2026-08-27", "2026-08-28", "2026-08-29"]);
  });
});

describe("Jalali month navigation", () => {
  it("moves whole months regardless of their length", () => {
    const shahrivar = jalaliMonthStart("2026-08-29"); // 1 Shahrivar 1405
    const mehr = shiftJalaliMonth(shahrivar, 1);
    const mordad = shiftJalaliMonth(shahrivar, -1);

    expect(formatDay(shahrivar, { withYear: true })).toBe("۱ شهریور ۱۴۰۵");
    expect(formatDay(mehr, { withYear: true })).toBe("۱ مهر ۱۴۰۵");
    expect(formatDay(mordad, { withYear: true })).toBe("۱ مرداد ۱۴۰۵");
  });

  it("wraps across the Jalali new year", () => {
    const farvardin = jalaliMonthStart("2026-04-01");
    expect(formatDay(shiftJalaliMonth(farvardin, -1), { withYear: true })).toBe(
      "۱ اسفند ۱۴۰۴",
    );
  });
});

describe("formatting", () => {
  it("writes dates with Persian digits", () => {
    expect(formatDay("2026-08-29")).toBe("۷ شهریور");
    expect(formatDay("2026-08-29", { withWeekday: true, withYear: true })).toBe(
      "شنبه، ۷ شهریور ۱۴۰۵",
    );
  });

  it("uses relative labels near today", () => {
    expect(relativeDayLabel("2026-08-29", "2026-08-29")).toBe("امروز");
    expect(relativeDayLabel("2026-08-28", "2026-08-29")).toBe("دیروز");
    expect(relativeDayLabel("2026-08-30", "2026-08-29")).toBe("فردا");
    expect(relativeDayLabel("2026-09-05", "2026-08-29")).toContain("شهریور");
  });
});
