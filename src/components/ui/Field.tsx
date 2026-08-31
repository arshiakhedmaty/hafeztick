"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

const CONTROL =
  "w-full rounded-field border border-line bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-muted/70 transition-colors duration-150 hover:border-line-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg-soft">
        {children}
      </label>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
}

export function TextField({ label, hint, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <div>
      {label && (
        <Label htmlFor={rest.id ?? id} hint={hint}>
          {label}
        </Label>
      )}
      <input id={rest.id ?? id} className={cn(CONTROL, className)} {...rest} />
    </div>
  );
}

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <div>
      {label && <Label htmlFor={rest.id ?? id}>{label}</Label>}
      <textarea
        id={rest.id ?? id}
        rows={3}
        className={cn(CONTROL, "resize-none leading-relaxed", className)}
        {...rest}
      />
    </div>
  );
}

export interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function SelectField({ label, className, children, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <div>
      {label && <Label htmlFor={rest.id ?? id}>{label}</Label>}
      <select id={rest.id ?? id} className={cn(CONTROL, "pl-8", className)} {...rest}>
        {children}
      </select>
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** Compact single-choice control used for priority, theme, repeat kind, … */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex gap-1 rounded-field border border-line bg-surface-2 p-1"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-surface text-fg shadow-card"
                  : "text-muted hover:text-fg-soft",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-field px-1 py-2 text-start transition-colors hover:bg-surface-2"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-card transition-[inset-inline-start] duration-200",
            checked ? "start-[22px]" : "start-0.5",
          )}
        />
      </span>
    </button>
  );
}
