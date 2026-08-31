"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { categoryVar } from "@/lib/utils/colors";
import { faClock, faDuration } from "@/lib/utils/duration";
import { addDays } from "@/lib/date/day";
import type { Entry } from "@/lib/domain/types";
import { categoryById } from "@/lib/domain/selectors";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Icon } from "@/components/ui/Icon";
import { DurationField } from "@/components/ui/DurationField";
import { Checkbox } from "./Checkbox";

/**
 * One planned item, and the time that went into it.
 *
 * The row has two states. Unlogged, it is an invitation: tapping anywhere opens
 * a small hours/minutes field right under the title. Logged, it shows the
 * duration as the row's headline number, and tapping that number reopens the
 * field to correct it. Nothing here counts an item — the only thing that leaves
 * this row is a number of minutes.
 */
export function EntryRow({
  entry,
  index = 0,
  editable = true,
  onEdit,
  showDayHint,
}: {
  entry: Entry;
  index?: number;
  /** Past days are history: they can still be logged, but not restructured. */
  editable?: boolean;
  onEdit?: (entry: Entry) => void;
  showDayHint?: string;
}) {
  const { data, actions } = useApp();
  const toast = useToast();

  const category = categoryById(data, entry.categoryId);
  const logged = entry.minutes > 0;
  const skipped = entry.status === "skipped";

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(entry.minutes);

  const startEditing = () => {
    setDraft(entry.minutes);
    setOpen(true);
  };

  const confirm = () => {
    const previous = entry.minutes;
    actions.logEntry(entry, draft);
    setOpen(false);

    if (draft > 0) {
      toast({
        message: `${entry.title}: ${faDuration(draft, { short: true })} ثبت شد`,
        icon: "check",
        action: {
          label: "برگرداندن",
          onClick: () => actions.logEntry(entry, previous),
        },
      });
    }
  };

  const menuItems: MenuItem[] = [];

  if (logged) {
    menuItems.push({
      label: "ویرایش زمان",
      icon: "clock",
      onClick: startEditing,
    });
    menuItems.push({
      label: "پاک کردن زمان",
      icon: "close",
      onClick: () => {
        actions.clearEntry(entry);
        toast({ message: "زمان پاک شد", icon: "close" });
      },
    });
  }

  if (editable && entry.sourceType === "task") {
    if (onEdit) {
      menuItems.push({ label: "ویرایش", icon: "pencil", onClick: () => onEdit(entry) });
    }
    menuItems.push({
      label: "انتقال به فردا",
      icon: "chevron-start",
      onClick: () => {
        actions.moveTask(entry.sourceId, addDays(entry.day, 1));
        toast({ message: "به فردا منتقل شد", icon: "calendar" });
      },
    });
    menuItems.push({
      label: "انتقال به سبد کارها",
      icon: "inbox",
      onClick: () => {
        actions.moveTask(entry.sourceId, null);
        toast({ message: "به سبد کارها رفت", icon: "inbox" });
      },
    });
  }

  menuItems.push({
    label: skipped ? "برگرداندن به برنامه" : "امروز لازم نبود",
    icon: "skip",
    onClick: () => {
      actions.setEntryStatus(entry, skipped ? "pending" : "skipped");
      setOpen(false);
    },
  });

  if (editable && entry.sourceType === "task") {
    menuItems.push({
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
    });
  }

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "group rounded-xl border border-transparent px-2.5 py-2.5 transition-colors duration-200",
        open ? "border-line bg-surface-2/60" : "hover:border-line hover:bg-surface-2/60",
        skipped && "opacity-55",
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={logged}
          onToggle={() => (logged ? actions.clearEntry(entry) : startEditing())}
          label={`${entry.title} — ${
            logged ? `${faDuration(entry.minutes, { short: true })} ثبت شده` : "بدون زمان"
          }`}
        />

        <button
          type="button"
          onClick={startEditing}
          disabled={skipped}
          className="min-w-0 flex-1 text-start"
        >
          <span
            className={cn(
              "block truncate text-[14px] leading-6 transition-colors duration-300",
              logged ? "text-fg-soft" : "text-fg",
              skipped && "line-through decoration-muted/60",
            )}
          >
            {entry.title}
          </span>
          {showDayHint && (
            <span className="mt-0.5 block text-[11px] text-muted">{showDayHint}</span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {logged ? (
            <button
              type="button"
              onClick={startEditing}
              title={faDuration(entry.minutes)}
              className="hz-tnum rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {faClock(entry.minutes)}
            </button>
          ) : (
            !skipped && (
              <button
                type="button"
                onClick={startEditing}
                className="flex items-center gap-1 rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] text-muted transition-colors hover:border-primary/60 hover:text-primary"
              >
                <Icon name="clock" size="0.95em" />
                ثبت زمان
              </button>
            )
          )}

          {entry.priority === "high" && !logged && (
            <span title="مهم" aria-label="مهم" className="text-accent">
              <Icon name="flame" size="0.95em" />
            </span>
          )}

          {entry.sourceType === "routine" && (
            <span
              title="روتین"
              aria-label="روتین"
              className="text-muted/70 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Icon name="repeat" size="0.95em" />
            </span>
          )}

          {category && (
            <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: categoryVar(category.color) }}
              />
              <span className="hidden sm:inline">{category.name}</span>
            </span>
          )}

          <div className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
            <Menu items={menuItems} />
          </div>
        </div>
      </div>

      {open && (
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
              onClick={() => setOpen(false)}
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
      )}
    </li>
  );
}
