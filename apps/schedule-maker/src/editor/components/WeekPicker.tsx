import { Button } from '@creator-hub/ui-kit'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import { Day } from '../../types/Day'
import { toISODate, weekDates } from '../../utils/date'

export default function WeekPicker() {
  const weekStart = useLiveQuery(() => db.weekStart)
  const weekAnchor = useLiveQuery(() => db.weekAnchor)

  const anchorISO = weekAnchor ? toISODate(weekAnchor) : ''
  const dates = weekAnchor && weekStart ? weekDates(weekAnchor, weekStart) : []
  const range =
    dates.length === 7
      ? `${dates[0].toLocaleDateString()} – ${dates[6].toLocaleDateString()}`
      : 'Select a date'

  async function shiftWeeks(delta: number) {
    if (!weekAnchor) return
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() + delta * 7)
    await db.setWeekAnchor(d)
  }

  async function updateDayStart(dayStart: Day) {
    await db.setWeekStart(dayStart)
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Pick a week</div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Week starts on</label>
        <select
          className="rounded-lg border px-2 py-1"
          value={weekStart ?? Day.MON}
          onChange={(e) => updateDayStart(e.target.value as Day)}
        >
          <option value={Day.SUN}>Sunday</option>
          <option value={Day.MON}>Monday</option>
        </select>

        <label className="text-xs">Any date in that week</label>
        <input
          type="date"
          className="rounded-lg border px-2 py-1"
          value={anchorISO}
          onChange={async (e) => {
            const value = e.target.value
            if (!value) return
            await db.setWeekAnchor(new Date(value))
          }}
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
          onClick={() => db.setWeekAnchor(new Date())}
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
