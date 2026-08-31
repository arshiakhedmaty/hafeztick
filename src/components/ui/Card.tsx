import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum } from "@/lib/utils/number";
import { Icon, type IconName } from "./Icon";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-surface",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          {icon && <Icon name={icon} size="1.05em" className="text-primary/70" />}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionTitle({
  children,
  count,
  action,
}: {
  children: ReactNode;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 px-1">
      <h3 className="hz-eyebrow flex items-center gap-2">
        {children}
        {count !== undefined && (
          <span className="hz-tnum rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px]">
            {faNum(count)}
          </span>
        )}
      </h3>
      {action}
    </div>
  );
}

/**
 * The top of every screen. The display face appears here and nowhere else on
 * the page, which is what keeps it feeling like a title rather than styling.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="hz-display truncate text-[26px] text-fg sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
