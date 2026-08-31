"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum } from "@/lib/utils/number";
import {
  MAX_ENTRY_MINUTES,
  clampMinutes,
  faGoal,
  joinMinutes,
  splitMinutes,
} from "@/lib/utils/duration";
import { Icon } from "@/components/ui/Icon";

const PRESETS = [30, 60, 90, 120, 180] as const;

/**
 * How every number gets into HafezTick: two boxes, hours and minutes.
 *
 * There is deliberately no timer. A student measures their study time with a
 * clock, a phone, or a sense of the afternoon; asking them to keep a browser
 * tab running to be counted would make the app less accurate, not more. So the
 * app records what the user reports and gets out of the way.
 *
 * The two fields keep their own text while focused — typing "0" over an hour
 * value must not snap back to the previous number mid-keystroke — and only
 * normalise on blur.
 */
export function DurationField({
  value,
  onChange,
  autoFocus = false,
  presets = true,
  max = MAX_ENTRY_MINUTES,
  compact = false,
  onSubmit,
  onCancel,
  name,
}: {
  /** Minutes. */
  value: number;
  onChange: (minutes: number) => void;
  autoFocus?: boolean;
  presets?: boolean;
  max?: number;
  compact?: boolean;
  onSubmit?: () => void;
  /** Escape from inside the field, so the row can close without the mouse. */
  onCancel?: () => void;
  /**
   * What this duration belongs to, e.g. a weekday. Several of these fields can
   * appear on one screen, and without it every one announces itself as plain
   * «ساعت» — which tells a screen-reader user nothing about which is which.
   */
  name?: string;
}) {
  const label = (part: string) => (name ? `${name} — ${part}` : part);
  const parts = splitMinutes(value);
  const [text, setText] = useState({
    hours: String(parts.hours),
    minutes: String(parts.minutes),
    /** The value these strings were last reconciled against. */
    from: value,
  });

  // A change from the outside — a preset, a reset, a different entry — wins
  // over whatever is half-typed. Adjusting during render rather than in an
  // effect keeps the inputs from flashing the stale value for one frame.
  if (text.from !== value) {
    setText({
      hours: String(parts.hours),
      minutes: String(parts.minutes),
      from: value,
    });
  }

  const setHourText = (hours: string) =>
    setText((current) => ({ ...current, hours }));
  const setMinuteText = (minutes: string) =>
    setText((current) => ({ ...current, minutes }));

  /** Typing writes straight through, so the caller always sees live minutes. */
  const commit = (hours: string, minutes: string) => {
    const total = joinMinutes(Number(hours) || 0, Number(minutes) || 0);
    const next = clampMinutes(total, max);
    setText({ hours, minutes, from: next });
    onChange(next);
  };

  const box = cn(
    "hz-tnum w-full rounded-field border border-line bg-surface text-center text-fg outline-none transition-colors hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20",
    compact ? "px-2 py-1.5 text-[13px]" : "px-3 py-2.5 text-[15px] font-semibold",
  );

  const numeric = {
    type: "text" as const,
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
    onFocus: (event: React.FocusEvent<HTMLInputElement>) =>
      event.target.select(),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
      if (event.key === "Escape" && onCancel) {
        event.preventDefault();
        onCancel();
      }
    },
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-1.5">
          <input
            {...numeric}
            autoFocus={autoFocus}
            aria-label={label("ساعت")}
            value={text.hours}
            onChange={(event) =>
              commit(
                event.target.value.replace(/\D/g, "").slice(0, 2),
                text.minutes,
              )
            }
            onBlur={() => setHourText(String(splitMinutes(value).hours))}
            className={box}
          />
          <span className="shrink-0 text-[12px] text-muted">ساعت</span>
        </label>

        <label className="flex flex-1 items-center gap-1.5">
          <input
            {...numeric}
            aria-label={label("دقیقه")}
            value={text.minutes}
            onChange={(event) =>
              commit(
                text.hours,
                event.target.value.replace(/\D/g, "").slice(0, 3),
              )
            }
            onBlur={() => setMinuteText(String(splitMinutes(value).minutes))}
            className={box}
          />
          <span className="shrink-0 text-[12px] text-muted">دقیقه</span>
        </label>
      </div>

      {presets && (
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(clampMinutes(preset, max))}
              className={cn(
                "hz-tnum rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                value === preset
                  ? "border-transparent bg-primary-soft text-primary"
                  : "border-line text-muted hover:text-fg-soft",
              )}
            >
              {faGoal(preset)}
            </button>
          ))}

          <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />

          <button
            type="button"
            aria-label={label("پانزده دقیقه بیشتر")}
            onClick={() => onChange(clampMinutes(value + 15, max))}
            className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] text-muted transition-colors hover:text-fg-soft"
          >
            <Icon name="plus" size="0.9em" />
            {faNum(15)}
          </button>
        </div>
      )}
    </div>
  );
}
