"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon, type IconName } from "./Icon";

interface ToastOptions {
  message: string;
  icon?: IconName;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      // Only one toast at a time: ticking fast should not build a wall.
      setToasts([{ ...options, id }]);
      const timer = window.setTimeout(
        () => dismiss(id),
        options.duration ?? 3600,
      );
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="hz-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-float"
          >
            {toast.icon && (
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Icon name={toast.icon} size="1.05em" />
              </span>
            )}
            <p className="min-w-0 flex-1 truncate text-[13px] text-fg">
              {toast.message}
            </p>
            {toast.action && (
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-primary-soft"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
