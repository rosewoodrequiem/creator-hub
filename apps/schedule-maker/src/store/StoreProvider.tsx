import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useMemo,
} from "react"
import { type StoreApi, useStore } from "zustand"
import { type ConfigState, createConfigStore } from "./useConfigStore"

const StoreContext = createContext<StoreApi<ConfigState> | null>(null)

export interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const storeRef = useRef<StoreApi<ConfigState> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createConfigStore()
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  )
}

function useStoreContext() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("Missing StoreProvider in the tree")
  return store
}

export function useConfigStore<T = ConfigState>(
  selector?: (state: ConfigState) => T,
): T {
  const store = useStoreContext()
  const memoizedSelector = useMemo(
    () => selector || ((state: ConfigState) => state as T),
    [selector],
  )

  return useStore(store, memoizedSelector)
}
