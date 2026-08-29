"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { DayKey } from "../date/day";
import type { Settings } from "../domain/types";
import type { DataRepository } from "../storage/repository";
import { AppStore, type StoreSnapshot } from "./store";

interface AppContextValue extends StoreSnapshot {
  actions: AppStore;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Thin React binding over {@link AppStore}. All logic lives in the store, so
 * components only read a snapshot and call actions.
 */
export function AppStoreProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: DataRepository;
}) {
  const [store] = useState(() => new AppStore(repository));

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const value = useMemo<AppContextValue>(
    () => ({ ...snapshot, actions: store }),
    [snapshot, store],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside <AppStoreProvider>");
  }
  return context;
}

export function useSettings(): Settings {
  return useApp().data.settings;
}

export function useActions(): AppStore {
  return useApp().actions;
}

export function useToday(): DayKey {
  return useApp().today;
}
