import { Day } from '../types/Day'

export const getDaysOrderedByWeekStart = (weekStart: Day): Day[] =>
  weekStart === Day.SUN
    ? [Day.SUN, Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT]
    : [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT, Day.SUN]
