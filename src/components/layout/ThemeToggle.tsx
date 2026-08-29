"use client";

import { useActions, useSettings } from "@/lib/store/AppStore";
import type { ThemePreference } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

const OPTIONS: { value: ThemePreference; icon: IconName; label: string }[] = [
  { value: "light", icon: "sun", label: "روشن" },
  { value: "dark", icon: "moon", label: "تیره" },
  { value: "system", icon: "monitor", label: "سیستم" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme } = useSettings();
  const { updateSettings } = useActions();

  return (
    <div
      role="radiogroup"
      aria-label="حالت نمایش"
      className={cn(
        "flex gap-1 rounded-xl border border-line bg-surface-2 p-1",
        compact ? "w-auto" : "w-full",
      )}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => updateSettings({ theme: option.value })}
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg py-1.5 transition-all duration-150",
              compact && "px-2.5",
              active
                ? "bg-surface text-primary shadow-card"
                : "text-muted hover:text-fg-soft",
            )}
          >
            <Icon name={option.icon} size="1.05em" />
          </button>
        );
      })}
    </div>
  );
}
