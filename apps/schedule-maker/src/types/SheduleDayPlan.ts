import { DBScheduleDayPlan } from '../dexie'

export type ScheduleDayPlan = DBScheduleDayPlan & {
  gameGraphic?: string
}
