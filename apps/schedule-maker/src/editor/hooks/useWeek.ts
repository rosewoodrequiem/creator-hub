import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import { Day } from '../../types/Day'
import { useCallback } from 'react'

export const useWeek = () => {
  const week = useLiveQuery(() => db.week)
  const weekStart = useLiveQuery(() => db.weekStart)
  const weekAnchor = useLiveQuery(() => db.weekAnchor)

  const getDateFromDay = useCallback((day: Day) => {
    if (!week || !weekAnchor) return null

    const startIdx = weekStart === Day.SUN ? 0 : 1
    const diffFromStart =
      [Day.SUN, Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT].indexOf(
        day,
      ) - startIdx
    const date = new Date(weekAnchor)
    date.setDate(weekAnchor?.getDate() + diffFromStart)
    return date
  }, [])

  return {
    week,
    getDateFromDay,
  }
}
