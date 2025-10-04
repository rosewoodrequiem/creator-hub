import Dexie, { PromiseExtended } from 'dexie'
import relationships from 'dexie-relationships'

import { seed } from './seed'
import { DB } from '../../dexie'
import { Day } from '../../types/Day'
import { Week } from '../../types/Week'
import { emptyWeek } from './ScheduleMakerDB.helpers'
import { ImageRow } from './SheduleMakerDB.types'

const DB_NAME = 'schedule-maker'
export const CURRENT_SCHEDULE_KEY = 'currentScheduleId'

export class ScheduleMakerDB extends Dexie {
  constructor() {
    super(DB_NAME, { addons: [relationships] })

    this.version(1).stores({
      images: '++id',
      schedules: '++id, name, updatedAt',
      scheduleData: '++id, weekStart, weekOffset, timezone, heroUrl',
      scheduleDayPlan:
        '++id, day, gameName, time, gameGraphic -> images.id, enabled',
      components: '++id, scheduleId -> schedules.id, kind, zIndex, updatedAt',
      global: '++id, currentScheduleId -> schedules.id',
    })

    // 🔑 Bind tables at runtime (this is what interface merging doesn't do)
    this.images = this.table('images')
    this.schedules = this.table('schedules')
    this.scheduleData = this.table('scheduleData')
    this.scheduleDayPlan = this.table('scheduleDayPlan')
    this.components = this.table('components')
    this.global = this.table('global')

    this.on('populate', function (transaction) {
      seed(transaction)
    })
  }

  get scheduleId() {
    return this.global.get(1).then((g) => g?.currentScheduleId ?? null)
  }

  get weekStart() {
    return this.scheduleData.get(1).then((d) => d?.weekStart ?? Day.MON)
  }
  get weekAnchor() {
    return this.scheduleData.get(1).then((d) => d?.weekAnchor ?? new Date())
  }

  get heroUrl() {
    return this.scheduleData.get(1).then((d) => {
      const imageId = d?.heroUrl
      if (!imageId) return undefined
      return this.images.get(imageId).then((img) => img?.data)
    })
  }

  get timezone() {
    return this.scheduleData.get(1).then((d) => d?.timezone)
  }

  /**
   * 🗓️ Get all scheduleDayPlan rows for Mon–Sun.
   */
  get week(): PromiseExtended<Week> {
    const daysOrder = [
      Day.MON,
      Day.TUE,
      Day.WED,
      Day.THU,
      Day.FRI,
      Day.SAT,
      Day.SUN,
    ]

    return this.scheduleDayPlan
      .where('day')
      .anyOf(...daysOrder)
      .toArray()
      .then(async (rows) => {
        // collect unique image ids
        const ids = Array.from(
          new Set(
            rows
              .map((r) => r.gameGraphic)
              .filter((v): v is number => typeof v === 'number'),
          ),
        )

        // bulk fetch images and map id -> row
        const imgs = await this.images.bulkGet(ids)
        const imgMap = new Map<number, ImageRow | undefined>()
        ids.forEach((id, i) => imgMap.set(id, imgs[i]))

        // build a fresh week (never mutate a shared constant)
        const week: Week = { ...emptyWeek }

        for (const r of rows) {
          const imageUrl =
            typeof r.gameGraphic === 'number'
              ? imgMap.get(r.gameGraphic)?.data
              : undefined
          week[r.day] = { ...r, gameGraphic: imageUrl }
        }

        // ensure all 7 days exist even if missing in DB
        for (const d of daysOrder) {
          if (!week[d]) {
            console.warn(
              `Missing scheduleDayPlan for day ${d}, inserting default`,
            )
            const id = await this.scheduleDayPlan.add(defaultScheduleDay(d))
            const newDay = await this.scheduleDayPlan.get(id)
            week[d] = { ...newDay!, gameGraphic: undefined }
          }
        }

        return week
      })
  }
  /**
   * Toggle a day's enabled state
   * @param day Day enum
   * @throws Error if no plan found for the day
   */
  async toggleDayEnabled(day: Day, enabled: boolean) {
    return this.scheduleDayPlan.where({ day }).modify((plan) => {
      plan.enabled = enabled
    })
  }

  async uploadImage(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result
          if (typeof dataUrl !== 'string') {
            reject(new Error('FileReader failed to produce a valid data URL'))
            return
          }

          // Dexie .add() resolves to the generated primary key (number)
          const id = await this.images.add({ data: dataUrl })
          resolve(id)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }
}

export interface ScheduleMakerDB extends DB {}
export const db = new ScheduleMakerDB()
function defaultScheduleDay(d: Day): import('../../dexie').DBScheduleDayPlan {
  throw new Error('Function not implemented.')
}
