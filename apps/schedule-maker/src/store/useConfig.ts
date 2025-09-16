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
  weekOffset: number
  sidebarOpen: boolean
  setTemplate: (t: TemplateId) => void
  setHeroUrl: (url?: string) => void
  setExportScale: (scale: number) => void
  setWeekStart: (start: "sun" | "mon") => void
  updateWeek: (patch: Partial<WeekPlan>) => void
  updateDay: (key: DayKey, patch: Partial<DayPlan>) => void
  setDay: (key: DayKey, next: DayPlan) => void
  resetDays: () => void
  toggleSidebar: () => void
  nextWeek: () => void
  prevWeek: () => void
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
      weekOffset: 0,
      sidebarOpen: true,

      setTemplate: (t) => set((state) => ({ ...state, template: t })),
      setHeroUrl: (url) => set((state) => ({ ...state, heroUrl: url })),
      setExportScale: (scale) =>
        set((state) => ({ ...state, exportScale: scale })),
      setWeekStart: (start) => set((state) => ({ ...state, weekStart: start })),
      toggleSidebar: () => set((s) => ({ ...s, sidebarOpen: !s.sidebarOpen })),
      nextWeek: () => set((s) => ({ ...s, weekOffset: s.weekOffset + 1 })),
      prevWeek: () => set((s) => ({ ...s, weekOffset: s.weekOffset - 1 })),

      updateWeek: (patch) =>
        set((s) => ({ ...s, week: { ...s.week, ...patch } })),
      updateDay: (key, patch) =>
        set((s) => ({
          ...s,
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
          ...s,
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
      onRehydrateStorage: () => {
        return (rehydratedState: ConfigState | undefined, error) => {
          if (error) {
            console.error("Error rehydrating store:", error)
            return
          }

          console.log("Rehydrating with state:", {
            hasState: !!rehydratedState,
            hasHeroUrl: !!rehydratedState?.heroUrl,
            heroUrlType: typeof rehydratedState?.heroUrl,
          })

          if (rehydratedState) {
            // Get current state
            const currentState = useConfig.getState()

            // Create new state with careful merging
            const newState = {
              ...currentState, // Start with current state
              ...rehydratedState, // Apply rehydrated state
              heroUrl: rehydratedState.heroUrl, // Explicitly set heroUrl
              template: rehydratedState.template || currentState.template,
              exportScale:
                rehydratedState.exportScale || currentState.exportScale,
              weekStart: rehydratedState.weekStart || currentState.weekStart,
              week: {
                ...currentState.week, // Preserve week structure
                ...rehydratedState.week, // Apply rehydrated week data
                days: {
                  ...currentState.week.days, // Preserve days structure
                  ...rehydratedState.week.days, // Apply rehydrated days
                },
              },
            }

            console.log("About to apply state:", {
              hasHeroUrl: !!newState.heroUrl,
              heroUrlType: typeof newState.heroUrl,
              heroUrlValue: newState.heroUrl?.substring(0, 20),
            })

            useConfig.setState(newState)
          }
        }
      },
    },
  ),
)
