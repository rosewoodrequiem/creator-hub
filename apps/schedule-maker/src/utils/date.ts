import type { DayKey } from "../types"

export const DAY_KEYS: DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
]
export const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
}

export function startOfWeek(d: Date, weekStart: "sun" | "mon") {
  const day = d.getDay() // 0=Sun..6=Sat
  const shift = weekStart === "mon" ? (day === 0 ? -6 : 1 - day) : -day
  const s = new Date(d)
  s.setDate(d.getDate() + shift)
  s.setHours(0, 0, 0, 0)
  return s
}

export function weekDates(anchorISO: string, weekStart: "sun" | "mon") {
  const anchor = new Date(anchorISO)
  const start = startOfWeek(anchor, weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function toISODate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function fmtTime(date: Date, timeHHMM: string, tz: string) {
  const [hh, mm] = timeHHMM.split(":").map(Number)
  const dt = new Date(date)
  dt.setHours(hh || 0, mm || 0, 0, 0)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(dt)
}

export function fmtZone(date: Date, tz: string) {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
      year: "numeric",
      day: "numeric",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value || tz
  )
}

export function shortMonthDay(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d)
}
