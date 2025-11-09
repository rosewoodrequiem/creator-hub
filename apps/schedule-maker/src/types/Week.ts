import { Day } from './Day'
import { ScheduleDayPlan } from './SheduleDayPlan'

export type Week = {
  [Day.MON]: ScheduleDayPlan | null
  [Day.TUE]: ScheduleDayPlan | null
  [Day.WED]: ScheduleDayPlan | null
  [Day.THU]: ScheduleDayPlan | null
  [Day.FRI]: ScheduleDayPlan | null
  [Day.SAT]: ScheduleDayPlan | null
  [Day.SUN]: ScheduleDayPlan | null
}
