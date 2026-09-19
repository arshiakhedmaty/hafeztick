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
import { CategoryPicker } from "./CategoryPicker";

/** What the inline field is doing: piling time on, or correcting the total. */
type FieldMode = "add" | "edit";

/**
 * One planned item, the time that went into it, and whether it is finished.
 *
 * Those last two are deliberately separate. Typing a duration says "I spent
 * this long on it" and nothing more — the number is added to whatever the item
 * already carries, so an hour this morning and an hour tonight make two hours
 * and the item stays open in between. Only the tick says "I am done with this".
 * Conflating the two meant a language session disappeared from the day the
 * first time any time was recorded against it.
 */
export function EntryRow({
  entry,
  index = 0,
  onEdit,
  showDayHint,
}: {
  entry: Entry;
  index?: number;
  onEdit?: (entry: Entry) => void;
  showDayHint?: string;
}) {
  const { data, actions } = useApp();
  const toast = useToast();

  const category = categoryById(data, entry.categoryId);
  const hasTime = entry.minutes > 0;
  const done = entry.status === "done";
  const skipped = entry.status === "skipped";
  const isTask = entry.sourceType === "task";
  const canRestructure = isTask;

  const [field, setField] = useState<FieldMode | null>(null);
  const [draft, setDraft] = useState(0);
  const [picking, setPicking] = useState(false);

  const openAdd = () => {
    setDraft(0);
    setField("add");
  };

  const openEdit = () => {
    setDraft(entry.minutes);
    setField("edit");
  };

  const confirm = () => {
    const previous = entry.minutes;
    const undo = {
      label: "برگرداندن",
      onClick: () => actions.logEntry(entry, previous),
    };

    if (field === "add") {
      if (draft > 0) {
        actions.addTime(entry, draft);
        toast({
          message: `${faDuration(draft, { short: true })} اضافه شد — مجموع ${faDuration(
            previous + draft,
            { short: true },
          )}`,
          icon: "clock",
          action: undo,
        });
      }
    } else {
      actions.logEntry(entry, draft);
      toast({
        message:
          draft > 0
            ? `مجموع به ${faDuration(draft, { short: true })} تغییر کرد`
            : "زمان پاک شد",
        icon: draft > 0 ? "clock" : "close",
        action: undo,
      });
    }

    setField(null);
  };

  const menuItems: MenuItem[] = [];

  if (!skipped) {
    menuItems.push({ label: "افزودن زمان (L)", icon: "clock", onClick: openAdd });
  }

  if (hasTime) {
    menuItems.push({ label: "اصلاح مجموع زمان", icon: "pencil", onClick: openEdit });
    menuItems.push({
      label: "پاک کردن زمان",
      icon: "close",
      onClick: () => {
        const previous = entry.minutes;
        actions.clearEntry(entry);
        toast({
          message: "زمان پاک شد",
          icon: "close",
          action: {
            label: "برگرداندن",
            onClick: () => actions.logEntry(entry, previous),
          },
        });
      },
    });
  }

  if (canRestructure) {
    menuItems.push({
      label: category ? "تغییر دسته‌بندی" : "انتخاب دسته‌بندی",
      icon: "inbox",
      onClick: () => setPicking(true),
    });

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
      setField(null);
    },
  });

  if (canRestructure) {
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

  /**
   * L opens this row's time field, Escape closes it.
   *
   * Matched on `event.code`, not `event.key`: on a Persian layout the L key
   * produces «م», and a shortcut that stops working when you switch layout is
   * worse than none. Keys are ignored while a field inside the row has focus,
   * so typing a duration never triggers them.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    const target = event.target as HTMLElement;
    const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

    if (event.code === "Escape" && field) {
      event.preventDefault();
      setField(null);
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === "KeyL" && !skipped) {
      event.preventDefault();
      openAdd();
    }
  };

  const statusLabel = done
    ? "انجام شد"
    : hasTime
      ? `${faDuration(entry.minutes, { short: true })} ثبت شده، هنوز باز است`
      : "بدون زمان";

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      onKeyDown={onKeyDown}
      className={cn(
        "group rounded-xl border border-transparent px-2.5 py-2.5 transition-colors duration-200",
        field ? "border-line bg-surface-2/60" : "hover:border-line hover:bg-surface-2/60",
        skipped && "opacity-55",
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={done}
          onToggle={() => actions.toggleEntryDone(entry)}
          label={`${entry.title} — ${statusLabel}`}
        />

        <button
          type="button"
          onClick={openAdd}
          disabled={skipped}
          className="min-w-0 flex-1 text-start"
        >
          <span
            className={cn(
              "block truncate text-[14px] leading-6 transition-colors duration-300",
              done ? "text-fg-soft line-through decoration-line-strong" : "text-fg",
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
          {hasTime ? (
            <button
              type="button"
              onClick={openAdd}
              title={`${faDuration(entry.minutes)} — برای افزودن زمان بزن`}
              className="hz-tnum rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {faClock(entry.minutes)}
            </button>
          ) : (
            !skipped && (
              <button
                type="button"
                onClick={openAdd}
                title="ثبت زمان (کلید L)"
                className="flex items-center gap-1 rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] text-muted transition-colors hover:border-primary/60 hover:text-primary"
              >
                <Icon name="clock" size="0.95em" />
                ثبت زمان
              </button>
            )
          )}

          {entry.priority === "high" && !done && (
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

          <CategoryChip
            name={category?.name ?? null}
            color={category ? categoryVar(category.color) : null}
            onClick={canRestructure ? () => setPicking(true) : undefined}
          />

          <div className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
            <Menu items={menuItems} />
          </div>
        </div>
      </div>

      {field && (
        <div className="hz-rise mt-2.5 border-t border-line pt-2.5">
          {field === "add" && hasTime && (
            <p className="hz-tnum mb-2 text-[11.5px] text-muted">
              مجموع فعلی {faDuration(entry.minutes, { short: true })}
              {draft > 0 && (
                <span className="text-primary">
                  {" "}
                  ← {faDuration(entry.minutes + draft, { short: true })}
                </span>
              )}
            </p>
          )}

          <DurationField
            value={draft}
            onChange={setDraft}
            onSubmit={confirm}
            onCancel={() => setField(null)}
            autoFocus
            compact
          />

          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setField(null)}
              className="rounded-lg px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:text-fg-soft"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={field === "add" && draft === 0}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-45"
            >
              {field === "edit" ? (draft > 0 ? "ثبت" : "پاک کردن") : "افزودن"}
            </button>
          </div>
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

/**
 * The category badge, which doubles as the way to set one.
 *
 * An uncategorised item shows a dashed outline rather than nothing at all, so
 * the gap is visible and tappable instead of being a feature you have to know
 * about. On phones only the dot survives — the row has no width to spare.
 */
function CategoryChip({
  name,
  color,
  onClick,
}: {
  name: string | null;
  color: string | null;
  onClick?: () => void;
}) {
  if (!name && !onClick) return null;

  const content = (
    <>
      <span
        className={cn(
          "size-1.5 rounded-full",
          !color && "border border-dashed border-line-strong",
        )}
        style={color ? { backgroundColor: color } : undefined}
      />
      <span className="hidden sm:inline">{name ?? "دسته"}</span>
    </>
  );

  const className = cn(
    "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] text-muted",
    name ? "bg-surface-2" : "border border-dashed border-line",
    onClick && "transition-colors hover:text-fg-soft",
    onClick && (name ? "hover:bg-line" : "hover:border-primary/50 hover:text-primary"),
  );

  if (!onClick) return <span className={className}>{content}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      title={name ? `دسته‌بندی: ${name}` : "انتخاب دسته‌بندی"}
      aria-label={name ? `دسته‌بندی: ${name}` : "انتخاب دسته‌بندی"}
      className={className}
    >
      {content}
    </button>
  );
}
