import { Transaction } from "dexie"
import { ScheduleComponent, Schedule } from "./SheduleMakerDB.types"
import { Day } from "../../types/Day"

function defaultSchedule(): Schedule {
  const now = Date.now()
  return {
    name: "My First Schedule",
    createdAt: now,
    updatedAt: now,
    themeId: "ElegantBlue",
  }
}

function defaultComponents(scheduleId: number): ScheduleComponent[] {
  const now = Date.now()
  return [
    {
      scheduleId,
      kind: "text",
      position: { x: 40, y: 40 },
      size: { w: 600, h: 60 },
      zIndex: 1,
      props: { text: "Schedule" },
      createdAt: now,
      updatedAt: now,
    },
    {
      scheduleId,
      kind: "game-slot",
      position: { x: 40, y: 120 },
      size: { w: 600, h: 80 },
      zIndex: 2,
      props: { day: "Mon", game: "" },
      createdAt: now,
      updatedAt: now,
    },
  ]
}

const defaultScheduleDay = (day: Day) => ({
  gameName: "",
  day,
  time: "",
})

const defaultSchedulePlan = () => ([
  defaultScheduleDay(Day.MON),
  defaultScheduleDay(Day.TUE),
  defaultScheduleDay(Day.WED),
  defaultScheduleDay(Day.THU),
  defaultScheduleDay(Day.FRI),
  defaultScheduleDay(Day.SAT),
  defaultScheduleDay(Day.SUN),
])

const defaultScheduleData = () => ({
  weekStart: Day.MON,
  weekOffset: 0,
})

const defaultGlobal = (scheduleId: number) => ({
  currentScheduleId: scheduleId,
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

/*export async function ensureSeed(): Promise<string> {
  // Step 1: check if a current schedule is saved
  const currentId = localStorage.getItem(CURRENT_SCHEDULE_KEY)
  if (currentId) {
    const found = await db.schedules.get(currentId)
    if (found) {
      const compCount = await db.components
        .where({ scheduleId: currentId })
        .count()
      if (compCount > 0) return currentId // all good
    }
  }

  // Step 2: fall back to first existing schedule
  const first = await db.schedules.toCollection().first()
  if (first) {
    const compCount = await db.components
      .where({ scheduleId: first.id })
      .count()
    if (compCount === 0) {
      await db.components.bulkPut(defaultComponents(first.id))
    }
    localStorage.setItem(CURRENT_SCHEDULE_KEY, first.id)
    return first.id
  }

  // Step 3: seed brand-new default
  const schedule = defaultSchedule()
  //const comps = defaultComponents(schedule.id)
  await db.transaction("rw", db.schedules, db.components, async () => {
    await db.schedules.put(schedule)
    //await db.components.bulkPut(comps)
  })
  localStorage.setItem(CURRENT_SCHEDULE_KEY, schedule.id)
  return schedule.id
}*/
