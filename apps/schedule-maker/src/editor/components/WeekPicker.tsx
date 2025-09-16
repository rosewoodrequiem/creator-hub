import React from "react"
import { useScheduleStore } from "../../store/useScheduleStore"
import { toISODate, weekDates } from "../../utils/date"
import Button from "../ui/Button"

export default function WeekPicker() {
  const weekStart = useScheduleStore((s) => s.week.weekStart)
  const anchorISO = useScheduleStore((s) => s.week.weekAnchorDate)
  const updateWeek = useScheduleStore((s) => s.updateWeek)

  const dates = weekDates(anchorISO, weekStart)
  const range = `${dates[0].toLocaleDateString()} – ${dates[6].toLocaleDateString()}`

  function shiftWeeks(delta: number) {
    const d = new Date(anchorISO)
    d.setDate(d.getDate() + delta * 7)
    updateWeek({ weekAnchorDate: toISODate(d) })
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Pick a week</div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Week starts on</label>
        <select
          className="rounded-lg border px-2 py-1"
          value={weekStart}
          onChange={(e) => updateWeek({ weekStart: e.target.value as any })}
        >
          <option value="sun">Sunday</option>
          <option value="mon">Monday</option>
        </select>

        <label className="text-xs">Any date in that week</label>
        <input
          type="date"
          className="rounded-lg border px-2 py-1"
          value={anchorISO}
          onChange={(e) => updateWeek({ weekAnchorDate: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="border bg-white hover:bg-[#f3f4f6]"
          onClick={() => shiftWeeks(-1)}
        >
          ← Prev week
        </Button>
        <Button
          className="border bg-white hover:bg-[#f3f4f6]"
          onClick={() => shiftWeeks(1)}
        >
          Next week →
        </Button>
        <Button
          className="border bg-white hover:bg-[#f3f4f6]"
          onClick={() => updateWeek({ weekAnchorDate: toISODate(new Date()) })}
        >
          This week
        </Button>
      </div>

      <div className="text-xs text-[--color-muted,#64748b]">
        Week range: {range}
      </div>
    </div>
  )
}
