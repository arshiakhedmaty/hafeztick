"use client";

import { type FormEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { categoryVar } from "@/lib/utils/colors";
import type { DayKey } from "@/lib/date/day";
import type { Priority } from "@/lib/domain/types";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "کم" },
  { value: "normal", label: "معمولی" },
  { value: "high", label: "مهم" },
];

/**
 * Capture in one line. Extra choices (category, priority) only appear once the
 * user starts typing, so the common case stays a single field and Enter.
 */
export function QuickAdd({
  day,
  placeholder = "یک کار جدید بنویس…",
  autoFocus = false,
}: {
  day: DayKey | null;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { data, actions } = useApp();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("normal");

  const expanded = title.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    actions.addTask({ title: trimmed, day, categoryId, priority });
    setTitle("");
    setPriority("normal");
    inputRef.current?.focus();
    toast({ message: "اضافه شد", icon: "plus" });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-card border border-line bg-surface p-2 shadow-card transition-shadow focus-within:shadow-float"
    >
      <div className="flex items-center gap-2">
        {/*
          The plus reads as the button, so it has to behave like one. Empty,
          it puts the cursor in the field; once something is typed it submits,
          which is what a person who reaches for a plus twice expects.
        */}
        <button
          type={expanded ? "submit" : "button"}
          onClick={expanded ? undefined : () => inputRef.current?.focus()}
          aria-label={expanded ? "افزودن کار" : "نوشتن کار جدید"}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-primary-contrast"
        >
          <Icon name="plus" size="1.15em" />
        </button>
        <input
          ref={inputRef}
          value={title}
          autoFocus={autoFocus}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={placeholder}
          aria-label="کار جدید"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-fg outline-none placeholder:text-muted/70"
        />
        {expanded && (
          <button
            type="submit"
            className="hz-fade shrink-0 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-contrast transition-colors hover:bg-primary-hover"
          >
            افزودن
          </button>
        )}
      </div>

      {expanded && (
        <div className="hz-rise mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              categoryId === null
                ? "border-line-strong bg-surface-2 text-fg-soft"
                : "border-line text-muted hover:text-fg-soft",
            )}
          >
            بدون دسته
          </button>

          {data.categories.map((category) => {
            const active = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(active ? null : category.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  active
                    ? "border-transparent text-fg"
                    : "border-line text-muted hover:text-fg-soft",
                )}
                style={
                  active
                    ? {
                        backgroundColor: `color-mix(in oklab, ${categoryVar(category.color)} 16%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: categoryVar(category.color) }}
                />
                {category.name}
              </button>
            );
          })}

          <span className="mx-1 h-4 w-px bg-line" />

          {PRIORITIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPriority(option.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                priority === option.value
                  ? "border-transparent bg-primary-soft text-primary"
                  : "border-line text-muted hover:text-fg-soft",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
