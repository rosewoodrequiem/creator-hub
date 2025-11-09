import Dexie, { PromiseExtended } from 'dexie'
import relationships from 'dexie-relationships'

import { DB } from '../../dexie'
import { Day } from '../../types/Day'
import type { TemplateId } from '../../types/Template'
import { Week } from '../../types/Week'

import { emptyWeek } from './ScheduleMakerDB.helpers'
import { seed } from './seed'
import {
  ComponentKind,
  ComponentPropsMap,
  getDefaultComponentProps,
  GlobalRow,
  ImageComponentProps,
  ImageRow,
  Schedule,
  ScheduleComponent,
  ScheduleComponentProps,
  ScheduleComponentWithProps,
  ScheduleDay,
  ScheduleSnapshot,
  Theme,
} from './SheduleMakerDB.types'

const DB_NAME = 'schedule-maker'
const GLOBAL_ROW_ID = 1
const DEFAULT_TEMPLATE: TemplateId = 'ElegantBlue'
const DEFAULT_EXPORT_SCALE = 2
const DEFAULT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const DAYS_ORDER = [
  Day.MON,
  Day.TUE,
  Day.WED,
  Day.THU,
  Day.FRI,
  Day.SAT,
  Day.SUN,
]

export class ScheduleMakerDB extends Dexie implements DB {
  images!: DB['images']
  schedules!: DB['schedules']
  scheduleDays!: DB['scheduleDays']
  components!: DB['components']
  componentProps!: DB['componentProps']
  themes!: DB['themes']
  global!: DB['global']

  constructor() {
    super(DB_NAME, { addons: [relationships] })

    this.version(1).stores({
      images: '++id, name',
      themes: '++id, slug, name',
      schedules: '++id, name, themeId, updatedAt',
      scheduleDays: '++id, scheduleId, day',
      components: '++id, scheduleId, kind, zIndex, updatedAt',
      componentProps: '++id, componentId, kind',
      global: '++id, currentScheduleId',
    })

    this.images = this.table('images')
    this.themes = this.table('themes')
    this.schedules = this.table('schedules')
    this.scheduleDays = this.table('scheduleDays')
    this.components = this.table('components')
    this.componentProps = this.table('componentProps')
    this.global = this.table('global')

    this.on('populate', function (transaction) {
      seed(transaction)
    })
  }

  get scheduleId() {
    return this.ensureCurrentScheduleId()
  }

  get weekStart() {
    return this.ensureCurrentSchedule().then((s) => s.weekStart ?? Day.MON)
  }

  get weekAnchor() {
    return this.ensureCurrentSchedule().then((s) => new Date(s.weekAnchor))
  }

  get heroUrl() {
    return this.getHeroImageData()
  }

  get timezone() {
    return this.ensureCurrentSchedule().then(
      (s) => s.timezone ?? DEFAULT_TIMEZONE
    )
  }

  get exportScale() {
    return this.ensureGlobalRow().then(
      (g) => g.exportScale ?? DEFAULT_EXPORT_SCALE
    )
  }

  get currentTemplate(): PromiseExtended<TemplateId> {
    return Dexie.Promise.resolve().then(async () => {
      const schedule = await this.ensureCurrentSchedule()
      if (!schedule.themeId) return DEFAULT_TEMPLATE
      const theme = await this.themes.get(schedule.themeId)
      return theme?.slug ?? DEFAULT_TEMPLATE
    }) as PromiseExtended<TemplateId>
  }

  get week(): PromiseExtended<Week> {
    return Dexie.Promise.resolve().then(async () => {
      const scheduleId = await this.ensureCurrentScheduleId()
      if (!scheduleId) {
        return { ...emptyWeek }
      }

      const week: Week = { ...emptyWeek }
      const rows = await this.scheduleDays.where({ scheduleId }).toArray()

      if (rows.length < DAYS_ORDER.length) {
        await this.ensureScheduleDays(scheduleId, rows)
        return this.week
      }

      const imageIdSet = new Set<number>()
      for (const row of rows) {
        if (typeof row.imageId === 'number') imageIdSet.add(row.imageId)
        if (typeof row.backgroundImageId === 'number') {
          imageIdSet.add(row.backgroundImageId)
        }
      }
      const imageIds = Array.from(imageIdSet)

      const images = await this.images.bulkGet(imageIds)
      const imageMap = new Map<number, ImageRow | undefined>()
      imageIds.forEach((id, idx) => imageMap.set(id, images[idx]))

      for (const row of rows) {
        const gameGraphic =
          typeof row.imageId === 'number'
            ? imageMap.get(row.imageId)?.data
            : undefined
        const backgroundGraphic =
          typeof row.backgroundImageId === 'number'
            ? imageMap.get(row.backgroundImageId)?.data
            : undefined
        week[row.day] = {
          ...row,
          gameGraphic,
          backgroundGraphic,
        }
      }

      return week
    }) as PromiseExtended<Week>
  }

  async setWeekStart(day: Day) {
    const schedule = await this.ensureCurrentSchedule()
    await this.schedules.put({
      ...schedule,
      weekStart: day,
      updatedAt: Date.now(),
    })
  }

  async setWeekAnchor(anchor: Date) {
    const schedule = await this.ensureCurrentSchedule()
    await this.schedules.put({
      ...schedule,
      weekAnchor: anchor.toISOString(),
      updatedAt: Date.now(),
    })
  }

  async setTimezone(timezone: string) {
    const schedule = await this.ensureCurrentSchedule()
    await this.schedules.put({
      ...schedule,
      timezone,
      updatedAt: Date.now(),
    })
  }

  async setExportScale(scale: number) {
    const global = await this.ensureGlobalRow()
    await this.global.put({ ...global, exportScale: scale })
  }

  async setCurrentTemplate(template: TemplateId) {
    const schedule = await this.ensureCurrentSchedule()
    const theme = await this.themes.where('slug').equals(template).first()
    if (!theme?.id) {
      throw new Error(`Theme ${template} not found`)
    }

    await this.schedules.put({
      ...schedule,
      themeId: theme.id,
      updatedAt: Date.now(),
    })
  }

  async setHeroImage(file: File | null) {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) throw new Error('No schedule selected')

    const hero = await this.components
      .where({ scheduleId, kind: 'image' })
      .first()
    if (!hero?.id) return

    const imageId = file ? await this.uploadImage(file) : undefined
    await this.upsertImageComponentProps(hero.id, imageId)
  }

  async toggleDayEnabled(day: Day, enabled: boolean) {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) throw new Error('No schedule selected')

    const now = Date.now()
    await this.scheduleDays.where({ scheduleId, day }).modify((row) => {
      row.enabled = enabled
      row.updatedAt = now
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

          const createdAt = Date.now()
          const id = await this.images.add({
            data: dataUrl,
            name: file.name,
            createdAt,
          })
          resolve(id)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  async getComponentWithProps(componentId: number): Promise<{
    component: ScheduleComponent
    props: ScheduleComponentProps | undefined
  } | null> {
    const component = await this.components.get(componentId)
    if (!component) return null
    const props = await this.componentProps.where({ componentId }).first()
    return { component, props: props ?? undefined }
  }

  async updateComponentProps<K extends ComponentKind>(
    componentId: number,
    kind: K,
    patch: Partial<ComponentPropsMap[K]>
  ) {
    const component = await this.components.get(componentId)
    if (!component) {
      throw new Error(`Component ${componentId} not found`)
    }

    const resolvedKind = component.kind as K
    const now = Date.now()
    const existing = await this.componentProps.where({ componentId }).first()

    const base: ComponentPropsMap[K] =
      existing && (existing.kind as ComponentKind) === resolvedKind
        ? { ...(existing.data as ComponentPropsMap[K]) }
        : getDefaultComponentProps(resolvedKind)

    const data = { ...base, ...patch }

    if (existing?.id) {
      await this.componentProps.update(existing.id, {
        data,
        kind: resolvedKind,
        updatedAt: now,
      })
      return
    }

    await this.componentProps.add({
      componentId,
      kind: resolvedKind,
      data,
      createdAt: now,
      updatedAt: now,
    })
  }

  async updateScheduleDay(day: Day, patch: Partial<ScheduleDay>) {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) throw new Error('No schedule selected')
    const now = Date.now()

    await this.scheduleDays.where({ scheduleId, day }).modify((row) => {
      Object.assign(row, patch)
      row.updatedAt = now
    })
  }

  async getScheduleSnapshot(): Promise<ScheduleSnapshot | null> {
    const schedule = await this.ensureCurrentSchedule()
    if (!schedule?.id) return null

    const [theme, week] = await Promise.all([
      this.resolveTheme(schedule.themeId),
      this.week,
    ])

    const components = await this.components
      .where({ scheduleId: schedule.id })
      .toArray()

    const componentIds = components
      .map((component) => component.id)
      .filter((id): id is number => typeof id === 'number')

    const propsRows = componentIds.length
      ? await this.componentProps
          .where('componentId')
          .anyOf(componentIds)
          .toArray()
      : []

    const propsMap = new Map<number, ScheduleComponentProps>()
    propsRows.forEach((row) => propsMap.set(row.componentId, row))

    const assetIds = new Set<number>()
    for (const row of propsRows) {
      if (row.kind === 'image') {
        const data = row.data as ImageComponentProps
        if (typeof data.imageId === 'number') assetIds.add(data.imageId)
      }
      if (row.kind === 'day-card') {
        const data = row.data as ComponentPropsMap['day-card']
        if (typeof data.backgroundImageId === 'number') {
          assetIds.add(data.backgroundImageId)
        }
      }
    }

    const assetIdList = Array.from(assetIds)
    const assetRows = assetIdList.length
      ? await this.images.bulkGet(assetIdList)
      : []
    const assetMap = new Map<number, ImageRow | undefined>()
    assetIdList.forEach((id, idx) => assetMap.set(id, assetRows[idx]))

    const componentsWithProps: ScheduleComponentWithProps[] = components
      .filter((component) => component.visible !== false)
      .map((component) => {
        const stored =
          (component.id && propsMap.get(component.id)?.data) ??
          getDefaultComponentProps(component.kind)
        let props: ComponentPropsMap[typeof component.kind]

        if (component.kind === 'text') {
          props = { ...(stored as ComponentPropsMap['text']) }
        } else if (component.kind === 'image') {
          const typed = { ...(stored as ComponentPropsMap['image']) }
          if (typeof typed.imageId === 'number') {
            typed.imageUrl = assetMap.get(typed.imageId)?.data
          } else {
            typed.imageUrl = undefined
          }
          props = typed
        } else {
          const typed = { ...(stored as ComponentPropsMap['day-card']) }
          if (typeof typed.backgroundImageId === 'number') {
            typed.backgroundImageUrl = assetMap.get(
              typed.backgroundImageId
            )?.data
          } else {
            typed.backgroundImageUrl = undefined
          }
          props = typed
        }

        return {
          ...component,
          props,
        }
      })

    componentsWithProps.sort((a, b) => a.zIndex - b.zIndex)

    return { schedule, theme, week, components: componentsWithProps }
  }

  private async ensureScheduleDays(
    scheduleId: number,
    existing: ScheduleDay[]
  ) {
    const existingDays = new Set(existing.map((row) => row.day))
    const now = Date.now()
    const missing = DAYS_ORDER.filter((day) => !existingDays.has(day)).map(
      (day) => ({
        scheduleId,
        day,
        enabled: false,
        gameName: '',
        time: '',
        imageId: undefined,
        createdAt: now,
        updatedAt: now,
      })
    )

    if (missing.length > 0) {
      await this.scheduleDays.bulkAdd(missing)
    }
  }

  private async resolveTheme(themeId: number | null): Promise<Theme> {
    if (themeId) {
      const theme = await this.themes.get(themeId)
      if (theme) return theme
    }

    const fallback = await this.themes.toCollection().first()
    if (!fallback) {
      throw new Error(
        'No themes available. Seed the database before rendering the canvas.'
      )
    }

    return fallback
  }

  private async getHeroImageData() {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) return undefined

    const hero = await this.components
      .where({ scheduleId, kind: 'image' })
      .first()
    if (!hero?.id) return undefined

    const props = await this.componentProps
      .where({ componentId: hero.id })
      .first()
    const imageId = (props?.data as ImageComponentProps | undefined)?.imageId
    if (typeof imageId !== 'number') return undefined

    const image = await this.images.get(imageId)
    return image?.data
  }

  private async upsertImageComponentProps(
    componentId: number,
    imageId: number | undefined
  ) {
    const now = Date.now()
    const existing = await this.componentProps.where({ componentId }).first()
    const defaults: ImageComponentProps = {
      fit: 'contain',
      opacity: 1,
      borderRadiusToken: 'lg',
      alt: 'Hero artwork',
      imageId: undefined,
    }

    const previous = (existing?.data as ImageComponentProps | undefined) ?? {}
    const nextData: ImageComponentProps = {
      ...defaults,
      ...previous,
      imageId,
    }

    if (existing?.id) {
      await this.componentProps.update(existing.id, {
        data: nextData,
        updatedAt: now,
      })
      return
    }

    await this.componentProps.add({
      componentId,
      kind: 'image',
      data: nextData,
      createdAt: now,
      updatedAt: now,
    })
  }

  private async ensureGlobalRow(): Promise<GlobalRow> {
    let row = await this.global.get(GLOBAL_ROW_ID)
    if (!row) {
      row = {
        id: GLOBAL_ROW_ID,
        currentScheduleId: null,
        exportScale: DEFAULT_EXPORT_SCALE,
        sidebarOpen: true,
      }
      await this.global.put(row)
      return row
    }

    if (typeof row.exportScale !== 'number') {
      row.exportScale = DEFAULT_EXPORT_SCALE
    }

    if (typeof row.sidebarOpen !== 'boolean') {
      row.sidebarOpen = true
    }

    return row
  }

  private async ensureCurrentSchedule(): Promise<Schedule> {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (scheduleId) {
      const existing = await this.schedules.get(scheduleId)
      if (existing) return existing
    }

    const first = await this.schedules.toCollection().first()
    if (first?.id) {
      const global = await this.ensureGlobalRow()
      await this.global.put({ ...global, currentScheduleId: first.id })
      return first
    }

    const now = Date.now()
    const newId = await this.schedules.add({
      name: 'My Schedule',
      themeId: null,
      weekStart: Day.MON,
      weekAnchor: new Date().toISOString(),
      timezone: DEFAULT_TIMEZONE,
      createdAt: now,
      updatedAt: now,
    })

    const created = await this.schedules.get(newId)
    const global = await this.ensureGlobalRow()
    await this.global.put({ ...global, currentScheduleId: newId })
    return created!
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
