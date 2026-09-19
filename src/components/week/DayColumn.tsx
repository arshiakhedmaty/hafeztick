"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { categoryVar } from "@/lib/utils/colors";
import { faClock, faDuration, faGoal } from "@/lib/utils/duration";
import { barValue, progressTone } from "@/lib/utils/progress";
import { type DayKey, compareDays, jalaliParts } from "@/lib/date/day";
import { WEEKDAY_NAMES } from "@/lib/date/jalali";
import type { Entry } from "@/lib/domain/types";
import { categoryById, entriesForDay } from "@/lib/domain/selectors";
import { isSuccessfulDay, scoreDay } from "@/lib/domain/scoring";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Menu } from "@/components/ui/Menu";
import { CategoryPicker } from "@/components/tasks/CategoryPicker";
import { ProgressBar } from "@/components/ui/ProgressRing";
import { Icon } from "@/components/ui/Icon";
import { DayFlower } from "./DayFlower";

/** One day of the week board: compact, scannable, still fully interactive. */
export function DayColumn({
  day,
  today,
  onAdd,
  onLog,
  onEdit,
}: {
  day: DayKey;
  today: DayKey;
  onAdd: (day: DayKey) => void;
  onLog: (entry: Entry) => void;
  onEdit: (entry: Entry) => void;
}) {
  const { data } = useApp();
  const entries = entriesForDay(data, day, today);
  const score = scoreDay(day, entries, data.settings);
  const successful = isSuccessfulDay(score, data.settings);
  const parts = jalaliParts(day);

  const isToday = day === today;
  const isPast = compareDays(day, today) < 0;

  return (
    <div
      className={cn(
        "flex min-h-44 flex-col rounded-xl border bg-surface p-3 transition-colors",
        isToday ? "border-primary/50 ring-1 ring-primary/20" : "border-line",
        successful && !isToday && "border-accent/40",
        isPast && "bg-surface/60",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span
            className={cn(
              "block truncate text-[12.5px] font-semibold",
              isToday ? "text-primary" : "text-fg-soft",
            )}
          >
            {WEEKDAY_NAMES[parts.weekday]}
          </span>
          <span className="hz-tnum block text-[11px] text-muted">
            {faNum(parts.jd)}
          </span>
        </div>

        <DayFlower
          weekday={parts.weekday}
          ratio={score.ratio}
          successful={successful}
          size={30}
          label={`${WEEKDAY_NAMES[parts.weekday]} — ${faDuration(score.minutes, {
            short: true,
            zero: "۰ دقیقه",
          })} از ${faGoal(score.goalMinutes)}`}
        />
      </div>

      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span
          title={faDuration(score.minutes, { zero: "بدون زمان" })}
          className={cn(
            "hz-tnum text-[15px] font-semibold",
            score.minutes > 0 ? "text-fg" : "text-muted",
          )}
        >
          {score.minutes > 0 ? faClock(score.minutes) : "—"}
        </span>
        <span className="hz-tnum shrink-0 text-[10.5px] text-muted">
          {score.goalMinutes === 0
            ? "بدون هدف"
            : `از ${faGoal(score.goalMinutes)}`}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <ProgressBar
          value={barValue(score.ratio)}
          tone={progressTone(score.ratio)}
          className="flex-1"
        />
        <span className="hz-tnum w-8 shrink-0 text-end text-[10.5px] text-muted">
          {score.ratio === null ? "—" : `${faPercent(score.ratio)}٪`}
        </span>
      </div>

      <ul className="flex-1 space-y-0.5">
        {/* Past days are editable here too. A day you forgot to fill in is the
            most common reason to open the board at all, and a board you can
            only read is a board that slowly goes out of date. */}
        {entries.map((entry: Entry) => (
          <WeekEntry key={entry.id} entry={entry} onLog={onLog} onEdit={onEdit} />
        ))}

        {entries.length === 0 && (
          <li className="py-3 text-center text-[11px] text-muted/70">خالی</li>
        )}
      </ul>

      <button
        type="button"
        onClick={() => onAdd(day)}
        className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-1.5 text-[11.5px] text-muted transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Icon name="plus" size="0.95em" />
        {isPast ? "ثبت کار" : "کار"}
      </button>
    </div>
  );
}

/**
 * One line of a day column: which area of life it belongs to, and its time.
 *
 * The board answers "where did my week go?", and at this size a category tells
 * you that far faster than a title does — «زبان» reads at a glance where
 * «تمرین درس هفتم گرامر» truncates to nothing useful. The title is still one
 * tap away, as the heading of the dialog this row opens.
 */
function WeekEntry({
  entry,
  onLog,
  onEdit,
}: {
  entry: Entry;
  onLog: (entry: Entry) => void;
  onEdit: (entry: Entry) => void;
}) {
  const { data, actions } = useApp();
  const toast = useToast();

  const [picking, setPicking] = useState(false);

  const category = categoryById(data, entry.categoryId);
  const logged = entry.minutes > 0;
  const label = category?.name ?? entry.title;
  const canRestructure = entry.sourceType === "task";

  return (
    <li className="group/row flex items-center gap-1">
      <button
        type="button"
        onClick={() => onLog(entry)}
        title={entry.title}
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-1 text-start transition-colors hover:bg-surface-2"
      >
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            !category && "border border-dashed border-line-strong",
          )}
          style={category ? { backgroundColor: categoryVar(category.color) } : undefined}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[12.5px] leading-5 transition-colors",
            logged ? "text-fg-soft" : "text-muted",
            entry.status === "done" && "line-through decoration-line-strong",
            entry.status === "skipped" && "opacity-55 line-through",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "hz-tnum shrink-0 text-[11px]",
            logged ? "font-semibold text-primary" : "text-muted/60",
          )}
        >
          {logged ? faClock(entry.minutes) : "—"}
        </span>
      </button>

      {canRestructure && (
        <div className="opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100 max-sm:opacity-100">
          <Menu
            label={`گزینه‌های ${entry.title}`}
            items={[
              { label: "ثبت زمان", icon: "clock", onClick: () => onLog(entry) },
              {
                label: category ? "تغییر دسته‌بندی" : "انتخاب دسته‌بندی",
                icon: "inbox",
                onClick: () => setPicking(true),
              },
              { label: "ویرایش", icon: "pencil", onClick: () => onEdit(entry) },
              {
                label: "حذف",
                icon: "trash",
                danger: true,
                onClick: () => {
                  actions.deleteTask(entry.sourceId);
                  toast({
                    message: "کار حذف شد",
                    icon: "trash",
                    action: { label: "برگرداندن", onClick: () => actions.undo() },
                  });
                },
              },
            ]}
          />
        </div>
      )}

      <CategoryPicker
        open={picking}
        title={entry.title}
        value={entry.categoryId}
        onSelect={(categoryId) => {
          actions.updateTask(entry.sourceId, { categoryId });
          toast({ message: "دسته‌بندی به‌روز شد", icon: "check" });
        }}
        onClose={() => setPicking(false)}
      />
    </li>
  );
}
