import { create } from "zustand"
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

type ScheduleState = {
  weekOffset: number
  sidebarOpen: boolean
  week: WeekPlan
  template: TemplateId
  heroUrl?: string // optional override for the big right-side hero
  setTemplate: (t: TemplateId) => void
  setHeroUrl: (url?: string) => void
  updateWeek: (patch: Partial<WeekPlan>) => void
  updateDay: (key: DayKey, patch: Partial<DayPlan>) => void
  setDay: (key: DayKey, next: DayPlan) => void
  resetDays: () => void
  nextWeek: () => void
  prevWeek: () => void
}

function makeDefaultWeek(): WeekPlan {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const days = Object.fromEntries(
    DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]),
  ) as Record<DayKey, DayPlan>
  return { weekAnchorDate: iso, weekStart: "mon", days }
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  week: makeDefaultWeek(),
  template: "ElegantBlue",
  heroUrl: undefined,
  weekOffset: 0,
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
  prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),

  setTemplate: (t) => set({ template: t }),
  setHeroUrl: (url) => set({ heroUrl: url }),

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
}))
