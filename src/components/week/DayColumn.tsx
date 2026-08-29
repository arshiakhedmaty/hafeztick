"use client";

import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { type DayKey, compareDays, jalaliParts } from "@/lib/date/day";
import { WEEKDAY_NAMES } from "@/lib/date/jalali";
import type { Entry } from "@/lib/domain/types";
import { entriesForDay } from "@/lib/domain/selectors";
import { scoreDay } from "@/lib/domain/scoring";
import { useApp } from "@/lib/store/AppStore";
import { Checkbox } from "@/components/tasks/Checkbox";
import { ProgressBar } from "@/components/ui/ProgressRing";
import { Icon } from "@/components/ui/Icon";

/** One day of the week board: compact, scannable, still fully interactive. */
export function DayColumn({
  day,
  today,
  onAdd,
  onOpenTask,
}: {
  day: DayKey;
  today: DayKey;
  onAdd: (day: DayKey) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const { data, actions } = useApp();
  const entries = entriesForDay(data, day, today);
  const score = scoreDay(day, entries);
  const parts = jalaliParts(day);

  const isToday = day === today;
  const isPast = compareDays(day, today) < 0;

  return (
    <div
      className={cn(
        "flex min-h-44 flex-col rounded-xl border bg-surface p-3 transition-colors",
        isToday ? "border-primary/50 ring-1 ring-primary/20" : "border-line",
        isPast && "bg-surface/60",
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-[12.5px] font-semibold",
            isToday ? "text-primary" : "text-fg-soft",
          )}
        >
          {WEEKDAY_NAMES[parts.weekday]}
        </span>
        <span className="hz-tnum text-[11px] text-muted">{faNum(parts.jd)}</span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <ProgressBar
          value={score.ratio ?? 0}
          tone={score.ratio !== null && score.ratio >= 1 ? "accent" : "primary"}
          className="flex-1"
        />
        <span className="hz-tnum w-8 shrink-0 text-end text-[10.5px] text-muted">
          {score.ratio === null ? "—" : `${faPercent(score.ratio)}٪`}
        </span>
      </div>

      <ul className="flex-1 space-y-1">
        {entries.map((entry: Entry) => {
          const done = entry.status === "done";
          return (
            <li key={entry.id} className="flex items-center gap-2">
              <Checkbox
                size="sm"
                checked={done}
                label={entry.title}
                onToggle={() => actions.toggleEntry(entry)}
              />
              <button
                type="button"
                onClick={() =>
                  entry.sourceType === "task" && onOpenTask(entry.sourceId)
                }
                className={cn(
                  "min-w-0 flex-1 truncate text-start text-[12.5px] leading-5 transition-colors",
                  done
                    ? "text-muted line-through decoration-muted/60"
                    : "text-fg-soft hover:text-fg",
                  entry.status === "skipped" && "opacity-55 line-through",
                )}
              >
                {entry.title}
              </button>
            </li>
          );
        })}

        {entries.length === 0 && (
          <li className="py-3 text-center text-[11px] text-muted/70">خالی</li>
        )}
      </ul>

      {!isPast && (
        <button
          type="button"
          onClick={() => onAdd(day)}
          className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-1.5 text-[11.5px] text-muted transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Icon name="plus" size="0.95em" />
          کار
        </button>
      )}
    </div>
  );
}
