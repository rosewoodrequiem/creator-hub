import type { DBScheduleDayPlan } from '../../dexie'
import { Day } from '../../types/Day'
import { ScheduleDayPlan } from '../../types/SheduleDayPlan'
import { db } from '../schedule-maker-db/ScheduleMakerDB'

export const DayPlanner = async (day: Day) => {
  const dayPlan = await db.scheduleDayPlan.where({ day }).first()
  if (!dayPlan) {
    throw new Error(`No day plan found for day: ${day}`)
  }

  const setPlan = async (plan: Partial<ScheduleDayPlan>) => {
    if (!plan) return

    const { gameGraphic, ...rest } = plan
    const update: Partial<DBScheduleDayPlan> = { ...rest }

    if (typeof gameGraphic === 'number') {
      update.gameGraphic = gameGraphic
    }

    await db.scheduleDayPlan.update(dayPlan.id!, update)
  }

  const setGameGraphic = async (file: File | null) => {
    if (file) {
      const id = await db.uploadImage(file)

      await db.scheduleDayPlan.update(dayPlan.id!, {
        gameGraphic: id,
      })
    } else {
      // Remove existing graphic
      await db.scheduleDayPlan.update(dayPlan.id!, {
        gameGraphic: undefined,
      })
    }
  }

  return { dayPlan, setPlan, setGameGraphic }
}
