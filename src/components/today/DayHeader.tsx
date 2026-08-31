"use client";

import { type DayKey, addDays, formatDay, relativeDayLabel } from "@/lib/date/day";
import { Button, IconButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";

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
    <PageHeader
      title={relativeDayLabel(day, today)}
      subtitle={formatDay(day, { withWeekday: true, withYear: true })}
      action={
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
      }
    />
  );
}
