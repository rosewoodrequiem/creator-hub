import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { DayKey, DayPlan, WeekPlan } from "../types"
import { DAY_KEYS } from "../utils/date"

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

const DEFAULT_DAY: DayPlan = {
  enabled: false,
  gameName: "",
  time: "",
  timezone: BROWSER_TZ,
  logoUrl: undefined,
  graphicUrl: undefined,
}

type TemplateId = "ElegantBlue" // add more ids later

export type ConfigState = {
  week: WeekPlan
  template: TemplateId
  heroUrl?: string
  exportScale: number
  weekStart: "sun" | "mon"
  setTemplate: (t: TemplateId) => void
  setHeroUrl: (url?: string) => void
  setExportScale: (scale: number) => void
  setWeekStart: (start: "sun" | "mon") => void
  updateWeek: (patch: Partial<WeekPlan>) => void
  updateDay: (key: DayKey, patch: Partial<DayPlan>) => void
  setDay: (key: DayKey, next: DayPlan) => void
  resetDays: () => void
}

import { HybridStorage } from "./hybridStorage"

const storage = new HybridStorage()

function makeDefaultWeek(): WeekPlan {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const days = Object.fromEntries(
    DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]),
  ) as Record<DayKey, DayPlan>
  return { weekAnchorDate: iso, weekStart: "mon", days }
}

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      week: makeDefaultWeek(),
      template: "ElegantBlue",
      heroUrl: undefined,
      exportScale: 2,
      weekStart: "mon",

      setTemplate: (t) => set({ template: t }),
      setHeroUrl: (url) => set({ heroUrl: url }),
      setExportScale: (scale) => set({ exportScale: scale }),
      setWeekStart: (start) => set({ weekStart: start }),

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
    },
  ),
)
