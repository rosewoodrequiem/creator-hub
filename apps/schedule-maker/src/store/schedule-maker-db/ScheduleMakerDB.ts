import Dexie, { PromiseExtended } from 'dexie'
import relationships from 'dexie-relationships'

import { seed } from './seed'
import { DB } from '../../dexie'
import { Day } from '../../types/Day'
import { Week } from '../../types/Week'
import { emptyWeek } from './ScheduleMakerDB.helpers'
import { ImageRow } from './SheduleMakerDB.types'
import type { TemplateId } from '../../types/Template'

const DB_NAME = 'schedule-maker'
const GLOBAL_ROW_ID = 1
const SCHEDULE_DATA_ROW_ID = 1
const DEFAULT_TEMPLATE: TemplateId = 'ElegantBlue'
const DEFAULT_EXPORT_SCALE = 2
const DEFAULT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export class ScheduleMakerDB extends Dexie {
  constructor() {
    super(DB_NAME, { addons: [relationships] })

    this.version(1).stores({
      images: '++id',
      schedules: '++id, name, updatedAt',
      scheduleData: '++id, weekStart, weekAnchor, timezone, heroUrl',
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
    return this.ensureCurrentScheduleId()
  }

  get weekStart() {
    return this.ensureScheduleDataRow().then((d) => d.weekStart ?? Day.MON)
  }
  get weekAnchor() {
    return this.ensureScheduleDataRow().then((d) => d.weekAnchor ?? new Date())
  }

  get heroUrl() {
    return this.ensureScheduleDataRow().then((d) => {
      const imageId = d.heroUrl
      if (!imageId) return undefined
      return this.images.get(imageId).then((img) => img?.data)
    })
  }

  get timezone() {
    return this.ensureScheduleDataRow().then(
      (d) => d.timezone ?? DEFAULT_TIMEZONE
    )
  }

  get exportScale() {
    return this.ensureGlobalRow().then(
      (g) => g.exportScale ?? DEFAULT_EXPORT_SCALE
    )
  }

  get currentTemplate() {
    return this.ensureCurrentScheduleId().then(async (id) => {
      if (!id) return DEFAULT_TEMPLATE
      const schedule = await this.schedules.get(id)
      return schedule?.themeId ?? DEFAULT_TEMPLATE
    })
  }

  async setWeekStart(day: Day) {
    const data = await this.ensureScheduleDataRow()
    await this.scheduleData.put({ ...data, weekStart: day })
  }

  async setWeekAnchor(anchor: Date) {
    const data = await this.ensureScheduleDataRow()
    await this.scheduleData.put({ ...data, weekAnchor: new Date(anchor) })
  }

  async setExportScale(scale: number) {
    const global = await this.ensureGlobalRow()
    await this.global.put({ ...global, exportScale: scale })
  }

  async setCurrentTemplate(template: TemplateId) {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) throw new Error('No schedule available to update')
    await this.schedules.update(scheduleId, {
      themeId: template,
      updatedAt: Date.now(),
    })
  }

  async setHeroImage(file: File | null) {
    const data = await this.ensureScheduleDataRow()
    if (file) {
      const id = await this.uploadImage(file)
      await this.scheduleData.put({ ...data, heroUrl: id })
      return
    }

    await this.scheduleData.put({ ...data, heroUrl: undefined })
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
              .filter((v): v is number => typeof v === 'number')
          )
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
              `Missing scheduleDayPlan for day ${d}, inserting default`
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

  private async ensureGlobalRow() {
    let row = await this.global.get(GLOBAL_ROW_ID)
    let needsUpdate = false
    if (!row) {
      row = {
        id: GLOBAL_ROW_ID,
        currentScheduleId: null,
        exportScale: DEFAULT_EXPORT_SCALE,
        sidebarOpen: true,
      }
      needsUpdate = true
    } else {
      const next = { ...row }
      if (typeof next.exportScale !== 'number') {
        next.exportScale = DEFAULT_EXPORT_SCALE
        needsUpdate = true
      }
      if (typeof next.sidebarOpen !== 'boolean') {
        next.sidebarOpen = true
        needsUpdate = true
      }
      row = next
    }

    if (needsUpdate) await this.global.put(row)
    return row
  }

  private async ensureScheduleDataRow() {
    let row = await this.scheduleData.get(SCHEDULE_DATA_ROW_ID)
    let needsUpdate = false
    if (!row) {
      row = {
        id: SCHEDULE_DATA_ROW_ID,
        weekStart: Day.MON,
        weekAnchor: new Date(),
        timezone: DEFAULT_TIMEZONE,
      }
      needsUpdate = true
    } else {
      const next = { ...row }
      if (!next.weekStart) {
        next.weekStart = Day.MON
        needsUpdate = true
      }
      if (!next.weekAnchor) {
        next.weekAnchor = new Date()
        needsUpdate = true
      }
      if (!next.timezone) {
        next.timezone = DEFAULT_TIMEZONE
        needsUpdate = true
      }
      row = next
    }

    if (needsUpdate) await this.scheduleData.put(row)
    return row
  }

  private async ensureCurrentScheduleId(): Promise<number | null> {
    const global = await this.ensureGlobalRow()
    if (global.currentScheduleId) return global.currentScheduleId

    const fallback = await this.schedules.toCollection().first()
    if (fallback?.id != null) {
      await this.global.put({ ...global, currentScheduleId: fallback.id })
      return fallback.id
    }

    return null
  }
}

export interface ScheduleMakerDB extends DB {}
export const db = new ScheduleMakerDB()
function defaultScheduleDay(d: Day): import('../../dexie').DBScheduleDayPlan {
  return {
    day: d,
    gameName: '',
    time: '',
    enabled: false,
  }
}
