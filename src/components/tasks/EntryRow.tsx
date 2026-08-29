"use client";

import { cn } from "@/lib/utils/cn";
import { categoryVar } from "@/lib/utils/colors";
import { addDays } from "@/lib/date/day";
import type { Entry } from "@/lib/domain/types";
import { categoryById } from "@/lib/domain/selectors";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Icon } from "@/components/ui/Icon";
import { Checkbox } from "./Checkbox";

export function EntryRow({
  entry,
  index = 0,
  editable = true,
  onEdit,
  showDayHint,
}: {
  entry: Entry;
  index?: number;
  /** Past days are history: they can be ticked, but not restructured. */
  editable?: boolean;
  onEdit?: (entry: Entry) => void;
  showDayHint?: string;
}) {
  const { data, actions } = useApp();
  const toast = useToast();

  const category = categoryById(data, entry.categoryId);
  const done = entry.status === "done";
  const skipped = entry.status === "skipped";

  const toggle = () => {
    actions.toggleEntry(entry);
    if (!done) {
      toast({
        message: "انجام شد",
        icon: "check",
        action: {
          label: "برگرداندن",
          onClick: () => actions.setEntryStatus(entry, "pending"),
        },
      });
    }
  };

  const menuItems: MenuItem[] = [];

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
    onClick: () => actions.setEntryStatus(entry, skipped ? "pending" : "skipped"),
  });

  if (editable && entry.sourceType === "task") {
    menuItems.push({
      label: "حذف",
      icon: "trash",
      danger: true,
      onClick: () => {
        actions.deleteTask(entry.sourceId);
        toast({ message: "کار حذف شد", icon: "trash" });
      },
    });
  }

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors duration-200",
        "hover:border-line hover:bg-surface-2/60",
        skipped && "opacity-55",
      )}
    >
      <Checkbox
        checked={done}
        onToggle={toggle}
        label={`${entry.title} — ${done ? "انجام شده" : "انجام نشده"}`}
      />

      <button
        type="button"
        onClick={toggle}
        className="min-w-0 flex-1 text-start"
      >
        <span
          className={cn(
            "block truncate text-[14px] leading-6 transition-[color,opacity] duration-300",
            done ? "text-muted line-through decoration-muted/60" : "text-fg",
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
        {entry.priority === "high" && !done && (
          <span
            title="مهم"
            aria-label="مهم"
            className="text-accent"
          >
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
    </li>
  );
}
