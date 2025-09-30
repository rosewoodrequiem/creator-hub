import type { WeekPlan, DayKey, DayPlan } from "../types"

type TemplateId = "ElegantBlue"

export type ConfigProps = {
  week: WeekPlan
  template: TemplateId
  heroUrl?: string
  exportScale: number
  weekStart: "sun" | "mon"
  weekOffset: number
  sidebarOpen: boolean
}

export type ConfigState = ConfigProps & {
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
