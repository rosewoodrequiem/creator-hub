import { Transaction } from 'dexie'

import { DBScheduleDayPlan } from '../../dexie'
import { Day } from '../../types/Day'

import { Schedule,ScheduleComponent } from './SheduleMakerDB.types'

function defaultSchedule(): Schedule {
  const now = Date.now()
  return {
    name: 'My First Schedule',
    createdAt: now,
    updatedAt: now,
    themeId: 'ElegantBlue',
  }
}

function defaultComponents(scheduleId: number): ScheduleComponent[] {
  const now = Date.now()
  return [
    {
      scheduleId,
      kind: 'text',
      position: { x: 40, y: 40 },
      size: { w: 600, h: 60 },
      zIndex: 1,
      props: { text: 'Schedule' },
      createdAt: now,
      updatedAt: now,
    },
    {
      scheduleId,
      kind: 'game-slot',
      position: { x: 40, y: 120 },
      size: { w: 600, h: 80 },
      zIndex: 2,
      props: { day: 'Mon', game: '' },
      createdAt: now,
      updatedAt: now,
    },
  ]
}

const defaultScheduleDay = (day: Day): DBScheduleDayPlan => ({
  gameName: '',
  day,
  time: '',
  enabled: false,
})

const defaultSchedulePlan = (): DBScheduleDayPlan[] => [
  defaultScheduleDay(Day.MON),
  defaultScheduleDay(Day.TUE),
  defaultScheduleDay(Day.WED),
  defaultScheduleDay(Day.THU),
  defaultScheduleDay(Day.FRI),
  defaultScheduleDay(Day.SAT),
  defaultScheduleDay(Day.SUN),
]

const defaultScheduleData = () => ({
  id: 1,
  weekStart: Day.MON,
  weekAnchor: new Date(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
})

const defaultGlobal = (scheduleId: number) => ({
  id: 1,
  currentScheduleId: scheduleId,
  exportScale: 2,
  sidebarOpen: true,
})

export async function seed(transaction: Transaction) {
  const schedule = defaultSchedule()
  const scheduleId = await transaction.schedules.put(schedule)

  const scheduleData = defaultScheduleData()
  const scheduleDayPlan = defaultSchedulePlan()
  const comps = defaultComponents(scheduleId)
  const global = defaultGlobal(scheduleId)

  await transaction.scheduleData.put(scheduleData)
  await transaction.scheduleDayPlan.bulkPut(scheduleDayPlan)
  await transaction.components.bulkPut(comps)
  await transaction.global.put(global)
  return scheduleId
}
