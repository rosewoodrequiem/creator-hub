import React from 'react'
import DayAccordion from './DayAccordion'
import { Day } from '../../../types/Day'
import { useWeek } from '../../hooks/useWeek'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../store/schedule-maker-db/ScheduleMakerDB'
import { ScheduleDayPlan } from '../../../types/SheduleDayPlan'
import { DayPlanner } from '../../../store/api/DayPlanner'

interface DayEditorProps {
  days: Day[]
}

export const DayEditor: React.FC<DayEditorProps> = ({ days }) => {
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
