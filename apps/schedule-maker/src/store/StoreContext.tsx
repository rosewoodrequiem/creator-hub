import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  useCallback,
} from "react";
import { type StoreApi } from "zustand";
import { createConfigStore, type ConfigState } from "./useConfigStore";

const StoreContext = createContext<StoreApi<ConfigState> | null>(null);

export interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const storeRef = useRef<StoreApi<ConfigState> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createConfigStore();
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

function useStoreApi() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Missing StoreProvider in the tree");
  return store;
}

export function useConfigStore<T>(selector: (state: ConfigState) => T): T;
export function useConfigStore(): ConfigState;
export function useConfigStore<T>(selector?: (state: ConfigState) => T) {
  const store = useStoreApi();

  const getSnapshot = useCallback(() => {
    return selector ? selector(store.getState()) : store.getState();
  }, [store, selector]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
