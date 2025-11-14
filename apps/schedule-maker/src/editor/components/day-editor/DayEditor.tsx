import { useLiveQuery } from 'dexie-react-hooks'

import { DayPlanner } from '../../../store/api/DayPlanner'
import { db } from '../../../store/schedule-maker-db/ScheduleMakerDB'
import { Day } from '../../../types/Day'
import { ScheduleDayPlan } from '../../../types/SheduleDayPlan'
import { useWeek } from '../../hooks/useWeek'

import DayAccordion from './DayAccordion'

interface DayEditorProps {
  days: Day[]
}

export function DayEditor({ days }: DayEditorProps) {
  const { week, getDateFromDay } = useWeek()
  const timezone = useLiveQuery(() => db.timezone)

  const handleUpdateDayPlan = async (
    day: Day,
    next: Partial<ScheduleDayPlan>,
  ) => {
    const dayPlanner = await DayPlanner(day)
    return dayPlanner.setPlan(next)
  }

  const handleUpdateGameGraphic = async (day: Day, file?: File) => {
    const dayPlanner = await DayPlanner(day)
    return dayPlanner.setGameGraphic(file || null)
  }

  return (
    <div className="space-y-3 pt-2 pb-8">
      {days.map((key) => {
        const plan = week?.[key]
        if (!plan?.enabled) return null

        const date = getDateFromDay(key)

        return (
          <DayAccordion
            key={key}
            dayKey={key}
            date={date}
            plan={plan}
            timezone={timezone}
            onChange={(next) => handleUpdateDayPlan(key, next)}
            onGrapicChange={(file) => handleUpdateGameGraphic(key, file)}
            onDisable={() => handleUpdateDayPlan(key, { enabled: false })}
          />
        )
      })}
    </div>
  )
}
