export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

export type DayPlan = {
  enabled: boolean
  gameName: string
  time: string // "20:00"
  timezone: string // IANA TZ, e.g. "America/New_York"
  logoUrl?: string // object URL
  graphicUrl?: string // object URL
}

export type WeekPlan = {
  weekAnchorDate: string // ISO date like "2025-08-18" (any day within the week)
  weekStart: "sun" | "mon"
  days: Record<DayKey, DayPlan>
}
