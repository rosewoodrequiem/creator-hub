import type { WeekPlan, DayKey, DayPlan } from "../types"
import { DAY_KEYS } from "../utils/date"
import type { ConfigProps } from "./useConfig.types"

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

export const DEFAULT_DAY: DayPlan = {
  enabled: false,
  gameName: "",
  time: "",
  timezone: BROWSER_TZ,
  logoUrl: undefined,
  graphicUrl: undefined,
}

function makeDefaultWeek(): WeekPlan {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const days = Object.fromEntries(
    DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]),
  ) as Record<DayKey, DayPlan>
  return { weekAnchorDate: iso, weekStart: "mon", days }
}

export const DEFAULT_CONFIG: ConfigProps = {
  week: makeDefaultWeek(),
  template: "ElegantBlue",
  heroUrl: undefined,
  exportScale: 2,
  weekStart: "mon",
  weekOffset: 0,
  sidebarOpen: true,
}
