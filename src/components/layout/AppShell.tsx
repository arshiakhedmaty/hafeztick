"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ThemeToggle } from "./ThemeToggle";
import { BrandMark } from "./BrandMark";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "امروز", icon: "sun" },
  { href: "/week", label: "هفته", icon: "calendar" },
  { href: "/routines", label: "روتین‌ها", icon: "repeat" },
  { href: "/stats", label: "آمار", icon: "chart" },
  { href: "/settings", label: "تنظیمات", icon: "settings" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-surface/60 px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <BrandMark size={38} />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold text-fg">حافظ‌تیک</span>
            <span className="block text-[11px] text-muted">برنامه‌ریز شخصی</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-fg-soft hover:bg-surface-2",
                )}
              >
                <Icon name={item.icon} size="1.2em" />
                {item.label}
                {active && (
                  <span className="absolute inset-y-2 end-0 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-1">
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="text-[15px] font-bold text-fg">حافظ‌تیک</span>
          </Link>
          <ThemeToggle compact />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-150",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                      active && "bg-primary-soft",
                    )}
                  >
                    <Icon name={item.icon} size="1.15em" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
