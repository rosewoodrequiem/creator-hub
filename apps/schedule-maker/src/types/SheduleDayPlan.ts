import { DBScheduleDayPlan } from '../dexie'

export type ScheduleDayPlan = Omit<DBScheduleDayPlan, 'gameGraphic'> & {
  gameGraphic?: string
}
