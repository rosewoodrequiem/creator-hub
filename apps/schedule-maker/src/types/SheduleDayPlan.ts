import type { ScheduleDay } from '../store/schedule-maker-db/SheduleMakerDB.types'

export type ScheduleDayPlan = ScheduleDay & {
  gameGraphic?: string
  backgroundGraphic?: string
}
