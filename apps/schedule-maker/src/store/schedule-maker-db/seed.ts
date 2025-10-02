import { CURRENT_SCHEDULE_KEY, db } from "./ScheduleMakerDB"
import { ScheduleComponent, Schedule } from "./SheduleMakerDB.types"

function defaultSchedule(): Schedule {
  const id = crypto.randomUUID()
  const now = Date.now()
  return {
    id,
    name: "My First Schedule",
    createdAt: now,
    updatedAt: now,
    themeId: "ElegantBlue",
  }
}

function defaultComponents(scheduleId: string): ScheduleComponent[] {
  const now = Date.now()
  return [
    {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

export async function ensureSeed(): Promise<string> {
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
}
