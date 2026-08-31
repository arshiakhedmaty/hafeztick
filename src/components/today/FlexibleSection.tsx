"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum } from "@/lib/utils/number";
import { faClock, faDuration } from "@/lib/utils/duration";
import type { DayKey } from "@/lib/date/day";
import { entryId } from "@/lib/domain/types";
import { flexibleForWeekOf, routineById } from "@/lib/domain/selectors";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DurationField } from "@/components/ui/DurationField";
import { Checkbox } from "@/components/tasks/Checkbox";

/**
 * "n times a week" routines.
 *
 * They deliberately sit apart from the day's list: they are a weekly promise,
 * so not doing one today is not a miss and the UI should not imply that. The
 * hours logged against them still count towards the day, because time studied
 * is time studied whichever bucket the commitment lives in.
 */
export function FlexibleSection({ day }: { day: DayKey }) {
  const { data, actions } = useApp();
  const toast = useToast();
  const items = flexibleForWeekOf(data, day);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(0);

  if (items.length === 0) return null;

  const minutesToday = (routineId: string): number =>
    data.entries.find((entry) => entry.id === entryId(day, "routine", routineId))
      ?.minutes ?? 0;

  return (
    <section className="mb-5">
      <SectionTitle count={items.length}>سهم این هفته</SectionTitle>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const today = minutesToday(item.routineId);
          const doneToday = today > 0;
          const complete = item.done >= item.target;
          const routine = routineById(data, item.routineId);
          const open = editing === item.routineId;

          const start = () => {
            setDraft(today);
            setEditing(item.routineId);
          };

          const confirm = () => {
            if (!routine) return;
            actions.logFlexible(routine, day, draft);
            setEditing(null);
            if (draft > 0 && !doneToday) {
              toast({
                message:
                  item.done + 1 >= item.target
                    ? `${item.title}: سهم این هفته کامل شد`
                    : `${item.title}: ${faNum(item.done + 1)} از ${faNum(item.target)}`,
                icon: "check",
              });
            }
          };

          return (
            <div
              key={item.routineId}
              className={cn(
                "rounded-xl border bg-surface px-3 py-3 transition-colors",
                complete ? "border-accent/40" : "border-line",
              )}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={doneToday}
                  tone={complete ? "accent" : "primary"}
                  label={`${item.title} — ${
                    doneToday
                      ? `${faDuration(today, { short: true })} امروز`
                      : "امروز ثبت نشده"
                  }`}
                  onToggle={() => {
                    if (!routine) return;
                    if (doneToday) actions.logFlexible(routine, day, 0);
                    else start();
                  }}
                />

                <button
                  type="button"
                  onClick={start}
                  className="min-w-0 flex-1 text-start"
                >
                  <span className="block truncate text-[14px] text-fg">
                    {item.title}
                  </span>
                  <span className="hz-tnum mt-0.5 block text-[11px] text-muted">
                    {faNum(item.done)} از {faNum(item.target)} بار ·{" "}
                    {faDuration(item.minutes, { short: true, zero: "۰" })} این هفته
                  </span>
                </button>

                {doneToday ? (
                  <button
                    type="button"
                    onClick={start}
                    className="hz-tnum shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary"
                  >
                    {faClock(today)}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={start}
                    aria-label={`ثبت زمان ${item.title}`}
                    className="shrink-0 rounded-full border border-dashed border-line px-2 py-1 text-muted transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    <Icon name="clock" size="0.95em" />
                  </button>
                )}
              </div>

              {open ? (
                <div className="hz-rise mt-2.5 border-t border-line pt-2.5">
                  <DurationField
                    value={draft}
                    onChange={setDraft}
                    onSubmit={confirm}
                    autoFocus
                    compact
                  />
                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:text-fg-soft"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={confirm}
                      className="rounded-lg bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-contrast transition-colors hover:bg-primary-hover"
                    >
                      {draft > 0 ? "ثبت" : "پاک کردن"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex gap-1" aria-hidden="true">
                  {Array.from({ length: item.target }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-300",
                        index < item.done
                          ? complete
                            ? "bg-accent"
                            : "bg-primary"
                          : "bg-line-strong",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
