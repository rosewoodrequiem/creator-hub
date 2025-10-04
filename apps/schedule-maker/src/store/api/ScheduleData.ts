import { db } from '../schedule-maker-db/ScheduleMakerDB'

export const ScheduleData = async () => {
  const scheduleData = await db.scheduleData.get(1)
  if (!scheduleData) {
    throw new Error('No schedule data found')
  }

  return {
    setHeroUrl: async (file: File | null) => {
      if (file) {
        const id = await db.uploadImage(file)

        await await db.scheduleData.update(scheduleData.id!, {
          heroUrl: id,
        })
      } else {
        // Remove existing graphic
        await db.scheduleData.update(scheduleData.id!, {
          heroUrl: undefined,
        })
      }
    },
  }
}
