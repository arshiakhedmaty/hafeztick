import { describe, expect, it } from "vitest";
import {
  gregorianToJalali,
  isJalaliLeapYear,
  jalaliMonthLength,
  jalaliToGregorian,
} from "./jalali";

describe("gregorianToJalali", () => {
  const cases: [number, number, number, number, number, number][] = [
    // gy, gm, gd, jy, jm, jd
    [1979, 2, 11, 1357, 11, 22],
    [2000, 1, 1, 1378, 10, 11],
    [2021, 3, 20, 1399, 12, 30], // last day of a leap Jalali year
    [2021, 3, 21, 1400, 1, 1], // Nowruz 1400
    [2026, 8, 29, 1405, 6, 7],
  ];

  it.each(cases)("%i-%i-%i -> %i/%i/%i", (gy, gm, gd, jy, jm, jd) => {
    expect(gregorianToJalali(gy, gm, gd)).toEqual({ jy, jm, jd });
  });

  it.each(cases)("round-trips %i-%i-%i", (gy, gm, gd) => {
    const jalali = gregorianToJalali(gy, gm, gd);
    expect(jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd)).toEqual({
      gy,
      gm,
      gd,
    });
  });

  it("round-trips every day across a full Jalali year", () => {
    let date = Date.UTC(2024, 2, 20); // inside 1402/1403
    for (let step = 0; step < 400; step += 1) {
      const current = new Date(date);
      const gy = current.getUTCFullYear();
      const gm = current.getUTCMonth() + 1;
      const gd = current.getUTCDate();

      const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
      expect(jalaliToGregorian(jy, jm, jd)).toEqual({ gy, gm, gd });
      expect(jd).toBeGreaterThanOrEqual(1);
      expect(jd).toBeLessThanOrEqual(jalaliMonthLength(jy, jm));

      date += 86_400_000;
    }
  });
});

describe("jalaliMonthLength", () => {
  it("gives 31 days to the first six months", () => {
    for (let month = 1; month <= 6; month += 1) {
      expect(jalaliMonthLength(1404, month)).toBe(31);
    }
  });

  it("gives 30 days to months seven through eleven", () => {
    for (let month = 7; month <= 11; month += 1) {
      expect(jalaliMonthLength(1404, month)).toBe(30);
    }
  });

  it("varies Esfand with the leap year", () => {
    expect(isJalaliLeapYear(1399)).toBe(true);
    expect(jalaliMonthLength(1399, 12)).toBe(30);
    expect(jalaliMonthLength(1400, 12)).toBe(29);
  });
});
