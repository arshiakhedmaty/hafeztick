"use client";

import { type DayKey, addDays, formatDay, relativeDayLabel } from "@/lib/date/day";
import { Button, IconButton } from "@/components/ui/Button";

/** Date title with one-tap movement between days. */
export function DayHeader({
  day,
  today,
  onChange,
}: {
  day: DayKey;
  today: DayKey;
  onChange: (day: DayKey) => void;
}) {
  const isToday = day === today;

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-fg sm:text-2xl">
          {relativeDayLabel(day, today)}
        </h1>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {formatDay(day, { withWeekday: true, withYear: true })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isToday && (
          <Button size="sm" variant="soft" onClick={() => onChange(today)}>
            امروز
          </Button>
        )}
        <IconButton
          icon="chevron-end"
          label="روز قبل"
          size="sm"
          variant="outline"
          onClick={() => onChange(addDays(day, -1))}
        />
        <IconButton
          icon="chevron-start"
          label="روز بعد"
          size="sm"
          variant="outline"
          onClick={() => onChange(addDays(day, 1))}
        />
      </div>
    </header>
  );
}
