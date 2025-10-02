import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { merge } from "lodash"

import type { DayKey, DayPlan } from "../types"
import { DAY_KEYS } from "../utils/date"
import { HybridStorage } from "./hybridStorage"
import { DEFAULT_CONFIG, DEFAULT_DAY } from "./defaultConfig"
import type { ConfigState } from "./useConfig.types"

const storage = new HybridStorage()

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,

      setTemplate: (t) => set({ template: t }),
      setHeroUrl: (url) => set({ heroUrl: url }),
      setExportScale: (scale) => set({ exportScale: scale }),
      setWeekStart: (start) => set({ weekStart: start }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
      prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),

      updateWeek: (patch) => set((s) => ({ week: { ...s.week, ...patch } })),
      updateDay: (key, patch) =>
        set((s) => ({
          week: {
            ...s.week,
            days: {
              ...s.week.days,
              [key]: { ...s.week.days[key], ...patch },
            },
          },
        })),
      setDay: (key, next) =>
        set((s) => ({
          week: { ...s.week, days: { ...s.week.days, [key]: next } },
        })),
      resetDays: () =>
        set((s) => {
          const fresh = Object.fromEntries(
            DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]),
          ) as Record<DayKey, DayPlan>
          return { week: { ...s.week, days: fresh } }
        }),
    }),
    {
      name: "schedule-maker-config",
      storage: createJSONStorage(() => storage),
      version: 1,

      partialize: (s) => (JSON.parse(JSON.stringify(s))),

      merge: (persisted, current) => {
        const p = persisted as Partial<ConfigState> | undefined
        if (!p) return current

        return merge(current, p)
      },
    },
  ),
)
