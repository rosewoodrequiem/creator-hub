import { useLiveQuery } from 'dexie-react-hooks'
import { Day } from '../../../types/Day'
import { db } from '../../../store/schedule-maker-db/ScheduleMakerDB'

interface DayChecklistProps {
  days: Day[]
}
export const DayChecklist: React.FunctionComponent<DayChecklistProps> = ({
  days,
}) => {
  const week = useLiveQuery(() => db.week)
  const handleToggleDay = async (day: Day, enabled: boolean) => {
    await db.toggleDayEnabled(day, enabled)
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Streaming days</div>
      <div className="flex flex-wrap gap-2">
        {days.map((key) => {
          const enabled = week?.[key]?.enabled
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 select-none ${
                enabled ? 'bg-blue-500 text-black' : 'bg-white text-black'
              } hover:brightness-105`}
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={Boolean(enabled)}
                onChange={(e) => handleToggleDay(key, e.target.checked)}
              />
              <span className="text-sm">{key}</span>
            </label>
          )
        })}
      </div>
      <div className="text-xs text-[--color-muted,#64748b]">
        Check days you’re streaming, then expand any day to edit details.
      </div>
    </div>
  )
}
