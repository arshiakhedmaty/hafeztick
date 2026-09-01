import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import type { AppData } from "@/lib/domain/types";
import type { DataRepository } from "@/lib/storage/repository";
import { AppStoreProvider } from "@/lib/store/AppStore";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * A repository that lives only for the length of a test, so component tests
 * exercise the real store rather than a stand-in for it.
 */
export function memoryRepository(initial: AppData | null = null): DataRepository {
  let data = initial;
  return {
    load: () => data,
    save: (next) => {
      data = next;
    },
    clear: () => {
      data = null;
    },
  };
}

export function renderApp(ui: ReactElement, data: AppData | null = null) {
  const repository = memoryRepository(data);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppStoreProvider repository={repository}>
        <ToastProvider>{children}</ToastProvider>
      </AppStoreProvider>
    );
  }

  return { repository, ...render(ui, { wrapper: Wrapper }) };
}
