import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function EmptyState({
  icon = "sparkle",
  title,
  description,
  action,
  compact = false,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col items-center gap-2 px-4 py-8 text-center"
          : "flex flex-col items-center gap-3 px-4 py-14 text-center"
      }
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
        <Icon name={icon} size="1.4em" />
      </span>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && (
        <p className="max-w-xs text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
