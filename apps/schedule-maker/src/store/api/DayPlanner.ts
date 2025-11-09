import { Day } from '../../types/Day'
import { ScheduleDayPlan } from '../../types/SheduleDayPlan'
import { db } from '../schedule-maker-db/ScheduleMakerDB'
import type { ScheduleDay } from '../schedule-maker-db/SheduleMakerDB.types'

export const DayPlanner = async (day: Day) => {
  const scheduleId = await db.scheduleId
  if (!scheduleId) {
    throw new Error('No schedule available to edit')
  }

  const dayPlan = await db.scheduleDays.where({ scheduleId, day }).first()
  if (!dayPlan) {
    throw new Error(`No day plan found for day: ${day}`)
  }

  const setPlan = async (plan: Partial<ScheduleDayPlan>) => {
    if (!plan) return

    const { gameGraphic, imageId, ...rest } = plan
    const update: Partial<ScheduleDay> = {
      ...rest,
    }

    if (typeof imageId === 'number' || imageId === null) {
      update.imageId = imageId ?? undefined
    }

    if (gameGraphic === null || gameGraphic === undefined) {
      update.imageId = undefined
    }

    await db.scheduleDays.update(dayPlan.id!, {
      ...update,
      updatedAt: Date.now(),
    })
  }

  const setGameGraphic = async (file: File | null) => {
    if (file) {
      const id = await db.uploadImage(file)
      await db.scheduleDays.update(dayPlan.id!, {
        imageId: id,
        updatedAt: Date.now(),
      })
    } else {
      // Remove existing graphic
      await db.scheduleDays.update(dayPlan.id!, {
        imageId: undefined,
        updatedAt: Date.now(),
      })
    }
  }

  return { dayPlan, setPlan, setGameGraphic }
}
