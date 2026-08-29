import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "soft" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-contrast hover:bg-primary-hover shadow-card active:scale-[.98]",
  soft: "bg-primary-soft text-primary hover:brightness-95 active:scale-[.98]",
  ghost: "text-fg-soft hover:bg-surface-2 active:scale-[.98]",
  outline:
    "border border-line bg-surface text-fg-soft hover:border-line-strong hover:bg-surface-2 active:scale-[.98]",
  danger: "bg-danger-soft text-danger hover:brightness-95 active:scale-[.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px] rounded-lg",
  md: "h-10 gap-2 px-4 text-sm rounded-xl",
  lg: "h-12 gap-2 px-5 text-[15px] rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  children?: ReactNode;
}

export function Button({
  variant = "soft",
  size = "md",
  icon,
  iconEnd,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-[background-color,border-color,transform,color] duration-150 disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size="1.15em" />}
      {children}
      {iconEnd && <Icon name={iconEnd} size="1.15em" />}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  variant?: Variant;
  size?: Size;
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10",
        "px-0",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? "1em" : "1.2em"} />
    </button>
  );
}
