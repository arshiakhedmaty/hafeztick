"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum } from "@/lib/utils/number";
import {
  type DayKey,
  addDays,
  formatMonth,
  isSameJalaliMonth,
  jalaliMonthGrid,
  jalaliParts,
  shiftJalaliMonth,
  startOfWeek,
  todayKey,
} from "@/lib/date/day";
import { WEEKDAY_SHORT } from "@/lib/date/jalali";
import { Icon } from "./Icon";

/** Jalali month grid, Saturday-first, with the shortcuts people actually use. */
export function DayPicker({
  value,
  onChange,
  allowNone = false,
}: {
  value: DayKey | null;
  onChange: (day: DayKey | null) => void;
  allowNone?: boolean;
}) {
  const today = todayKey();
  const [view, setView] = useState<DayKey>(value ?? today);
  const grid = jalaliMonthGrid(view);

  const shortcuts: { label: string; day: DayKey | null }[] = [
    { label: "امروز", day: today },
    { label: "فردا", day: addDays(today, 1) },
    { label: "شنبه‌ی آینده", day: addDays(startOfWeek(today), 7) },
  ];
  if (allowNone) shortcuts.push({ label: "بدون تاریخ", day: null });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            onClick={() => {
              onChange(shortcut.day);
              if (shortcut.day) setView(shortcut.day);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] transition-colors",
              value === shortcut.day
                ? "border-transparent bg-primary-soft text-primary"
                : "border-line text-muted hover:text-fg-soft",
            )}
          >
            {shortcut.label}
          </button>
        ))}
      </div>

      <div className="rounded-field border border-line bg-surface-2/50 p-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="ماه قبل"
            onClick={() => setView(shiftJalaliMonth(view, -1))}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <Icon name="chevron-end" size="1.1em" />
          </button>
          <span className="text-[13px] font-medium text-fg">
            {formatMonth(view)}
          </span>
          <button
            type="button"
            aria-label="ماه بعد"
            onClick={() => setView(shiftJalaliMonth(view, 1))}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <Icon name="chevron-start" size="1.1em" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAY_SHORT.map((name) => (
            <span key={name} className="py-1 text-[11px] text-muted">
              {name}
            </span>
          ))}

          {grid.map((day) => {
            const inMonth = isSameJalaliMonth(day, view);
            const selected = day === value;
            const isToday = day === today;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onChange(day)}
                className={cn(
                  "hz-tnum aspect-square rounded-lg text-[12.5px] transition-colors",
                  !inMonth && "text-muted/40",
                  inMonth && !selected && "text-fg-soft hover:bg-surface",
                  selected &&
                    "bg-primary font-semibold text-primary-contrast hover:bg-primary-hover",
                  !selected && isToday && "ring-1 ring-primary/50",
                )}
              >
                {faNum(jalaliParts(day).jd)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
