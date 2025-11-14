import Dexie, { PromiseExtended } from 'dexie'
import relationships from 'dexie-relationships'

import { DB } from '../../dexie'
import { Day } from '../../types/Day'
import type { TemplateId } from '../../types/Template'
import { Week } from '../../types/Week'
import { emptyWeek } from './ScheduleMakerDB.helpers'
import {
  ComponentKind,
  ComponentPropsMap,
  FilteredScheduleState,
  GlobalRow,
  ImageComponentProps,
  ImageRow,
  Schedule,
  ScheduleComponent,
  ScheduleComponentProps,
  ScheduleComponentWithProps,
  ScheduleDay,
  ScheduleSnapshot,
  SnapshotRow,
  Theme,
  getDefaultComponentProps,
} from './SheduleMakerDB.types'
import { seed } from './seed'

const DB_NAME = 'schedule-maker'
const GLOBAL_ROW_ID = 1
const DEFAULT_TEMPLATE: TemplateId = 'ElegantBlue'
const DEFAULT_EXPORT_SCALE = 2
const DEFAULT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const FALLBACK_THEME = {
  slug: DEFAULT_TEMPLATE,
  name: 'Elegant Blue',
  description: 'Soft gradients and friendly typography for VTuber schedules.',
  colors: [
    { id: 'primary', label: 'Primary', value: '#7aa5d6' },
    { id: 'secondary', label: 'Secondary', value: '#f9d8ff' },
    { id: 'text', label: 'Body Text', value: '#1d2430' },
    { id: 'background', label: 'Canvas', value: '#f4f8ff' },
    { id: 'card', label: 'Card', value: '#ffffff' },
  ],
  fonts: [
    { id: 'heading', label: 'Heading', family: 'Poppins, sans-serif' },
    { id: 'body', label: 'Body', family: 'Inter, sans-serif' },
  ],
  radii: { none: 0, sm: 4, md: 12, lg: 24, pill: 999 },
}

const DAYS_ORDER = [
  Day.MON,
  Day.TUE,
  Day.WED,
  Day.THU,
  Day.FRI,
  Day.SAT,
  Day.SUN,
]

const SNAPSHOT_DEBOUNCE_MS = 800
const SNAPSHOT_HISTORY_LIMIT = 50

export class ScheduleMakerDB extends Dexie implements DB {
  images!: DB['images']
  schedules!: DB['schedules']
  scheduleDays!: DB['scheduleDays']
  components!: DB['components']
  componentProps!: DB['componentProps']
  themes!: DB['themes']
  global!: DB['global']
  snapshots!: DB['snapshots']

  private snapshotTimer: ReturnType<typeof setTimeout> | null = null
  private pendingSnapshotReason: string | null = null
  private latestSnapshotState: FilteredScheduleState | null = null
  private latestSnapshotHash: string | null = null
  private snapshotBaselinePromise: Promise<void> | null = null
  private isRestoringSnapshot = false

  constructor() {
    super(DB_NAME, { addons: [relationships] })

    const baseStores = {
      images: '++id, name',
      themes: '++id, slug, name',
      schedules: '++id, name, themeId, updatedAt',
      scheduleDays: '++id, scheduleId, day',
      components: '++id, scheduleId, kind, zIndex, updatedAt',
      componentProps: '++id, componentId, kind',
      global: '++id, currentScheduleId',
    }

    this.version(1).stores(baseStores)
    this.version(2).stores({
      ...baseStores,
      snapshots: '++id, scheduleId, createdAt',
    })

    this.images = this.table('images')
    this.themes = this.table('themes')
    this.schedules = this.table('schedules')
    this.scheduleDays = this.table('scheduleDays')
    this.components = this.table('components')
    this.componentProps = this.table('componentProps')
    this.global = this.table('global')
    this.snapshots = this.table('snapshots')

    this.on('populate', function (transaction) {
      seed(transaction)
    })

    void this.initializeSnapshotBaseline()
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
      (s) => s.timezone ?? DEFAULT_TIMEZONE,
    )
  }

  get exportScale() {
    return this.ensureGlobalRow().then(
      (g) => g.exportScale ?? DEFAULT_EXPORT_SCALE,
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
    this.requestSnapshotCapture('week-start')
  }

  async setWeekAnchor(anchor: Date) {
    const schedule = await this.ensureCurrentSchedule()
    await this.schedules.put({
      ...schedule,
      weekAnchor: anchor.toISOString(),
      updatedAt: Date.now(),
    })
    this.requestSnapshotCapture('week-anchor')
  }

  async setTimezone(timezone: string) {
    const schedule = await this.ensureCurrentSchedule()
    await this.schedules.put({
      ...schedule,
      timezone,
      updatedAt: Date.now(),
    })
    this.requestSnapshotCapture('timezone')
  }

  async setExportScale(scale: number) {
    const global = await this.ensureGlobalRow()
    await this.global.put({ ...global, exportScale: scale })
    this.requestSnapshotCapture('export-scale')
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
    this.requestSnapshotCapture('theme')
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
    this.requestSnapshotCapture('hero-image')
  }

  async toggleDayEnabled(day: Day, enabled: boolean) {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) throw new Error('No schedule selected')

    const now = Date.now()
    await this.scheduleDays.where({ scheduleId, day }).modify((row) => {
      row.enabled = enabled
      row.updatedAt = now
    })
    this.requestSnapshotCapture('day-toggle')
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
    patch: Partial<ComponentPropsMap[K]>,
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
    } else {
      await this.componentProps.add({
        componentId,
        kind: resolvedKind,
        data,
        createdAt: now,
        updatedAt: now,
      })
    }

    this.requestSnapshotCapture('component-props')
  }

  async updateScheduleDay(day: Day, patch: Partial<ScheduleDay>) {
    const scheduleId = await this.ensureCurrentScheduleId()
    if (!scheduleId) throw new Error('No schedule selected')
    const now = Date.now()

    await this.scheduleDays.where({ scheduleId, day }).modify((row) => {
      Object.assign(row, patch)
      row.updatedAt = now
    })
    this.requestSnapshotCapture('schedule-day')
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
              typed.backgroundImageId,
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

  requestSnapshotCapture(reason?: string) {
    if (this.isRestoringSnapshot) return
    if (reason) {
      this.pendingSnapshotReason = reason
    }
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer)
    }
    this.snapshotTimer = setTimeout(() => {
      this.snapshotTimer = null
      const pendingReason = this.pendingSnapshotReason
      this.pendingSnapshotReason = null
      void this.captureSnapshot(pendingReason)
    }, SNAPSHOT_DEBOUNCE_MS)
  }

  async undo(): Promise<boolean> {
    const global = await this.ensureGlobalRow()
    const cursorId = global.snapshotCursorId
    const scheduleId =
      global.snapshotCursorScheduleId ?? (await this.ensureCurrentScheduleId())
    if (!scheduleId || cursorId == null) return false

    const current = await this.snapshots.get(cursorId)
    if (!current?.prev) return false

    await this.applySnapshotState(current.prev)

    const previousRow = await this.snapshots
      .where('scheduleId')
      .equals(scheduleId)
      .and((row) => (row.id ?? 0) < cursorId)
      .last()

    await this.global.put({
      ...global,
      snapshotCursorId: previousRow?.id ?? null,
      snapshotCursorScheduleId: scheduleId,
    })

    return true
  }

  async redo(): Promise<boolean> {
    const global = await this.ensureGlobalRow()
    const scheduleId =
      global.snapshotCursorScheduleId ?? (await this.ensureCurrentScheduleId())
    if (!scheduleId) return false

    const cursorId = global.snapshotCursorId ?? 0

    const nextRow = await this.snapshots
      .where('scheduleId')
      .equals(scheduleId)
      .and((row) => (row.id ?? 0) > cursorId)
      .first()

    if (!nextRow) return false

    await this.applySnapshotState(nextRow.next)

    await this.global.put({
      ...global,
      snapshotCursorId: nextRow.id ?? null,
      snapshotCursorScheduleId: scheduleId,
    })

    return true
  }

  async canUndo(): Promise<boolean> {
    const global = await this.ensureGlobalRow()
    if (global.snapshotCursorId == null) return false
    const row = await this.snapshots.get(global.snapshotCursorId)
    return !!row?.prev
  }

  async canRedo(): Promise<boolean> {
    const global = await this.ensureGlobalRow()
    const scheduleId =
      global.snapshotCursorScheduleId ?? (await this.ensureCurrentScheduleId())
    if (!scheduleId) return false
    const cursorId = global.snapshotCursorId ?? 0
    const nextRow = await this.snapshots
      .where('scheduleId')
      .equals(scheduleId)
      .and((row) => (row.id ?? 0) > cursorId)
      .first()
    return !!nextRow
  }

  private async initializeSnapshotBaseline() {
    await this.ensureSnapshotBaseline()
  }

  private async ensureSnapshotBaseline() {
    if (this.latestSnapshotState) return
    if (!this.snapshotBaselinePromise) {
      this.snapshotBaselinePromise = (async () => {
        const initial = await this.exportFilteredState()
        if (initial) {
          this.latestSnapshotState = initial
          this.latestSnapshotHash = this.serializeState(initial)
        }
      })().finally(() => {
        this.snapshotBaselinePromise = null
      })
    }
    await this.snapshotBaselinePromise
  }

  private async captureSnapshot(reason?: string | null) {
    await this.ensureSnapshotBaseline()
    const nextState = await this.exportFilteredState()
    if (!nextState?.schedule.id) return

    const nextHash = this.serializeState(nextState)
    if (this.latestSnapshotHash === nextHash) return

    const prevState = this.latestSnapshotState
    const prevClone = prevState ? this.cloneState(prevState) : null
    const nextClone = this.cloneState(nextState)
    const scheduleId = nextState.schedule.id

    const global = await this.ensureGlobalRow()
    const shouldPrune = global.snapshotCursorScheduleId === scheduleId
    await this.pruneSnapshotsAfterCursor(
      scheduleId,
      shouldPrune ? (global.snapshotCursorId ?? null) : undefined,
    )

    const id = await this.snapshots.add({
      scheduleId,
      prev: prevClone,
      next: nextClone,
      createdAt: Date.now(),
      reason: reason ?? null,
    } satisfies SnapshotRow)

    await this.global.put({
      ...global,
      snapshotCursorId: id,
      snapshotCursorScheduleId: scheduleId,
    })

    await this.trimSnapshotHistory(scheduleId)

    this.latestSnapshotState = nextState
    this.latestSnapshotHash = nextHash
  }

  private async exportFilteredState(): Promise<FilteredScheduleState | null> {
    const schedule = await this.ensureCurrentSchedule()
    if (!schedule?.id) return null
    const scheduleId = schedule.id

    const [global, scheduleDays, components] = await Promise.all([
      this.ensureGlobalRow(),
      this.scheduleDays.where({ scheduleId }).toArray(),
      this.components.where({ scheduleId }).toArray(),
    ])

    const componentIds = components
      .map((component) => component.id)
      .filter((id): id is number => typeof id === 'number')

    const componentProps = componentIds.length
      ? await this.componentProps
          .where('componentId')
          .anyOf(componentIds)
          .toArray()
      : []

    const cloneSchedule = { ...schedule }
    const cloneDays = scheduleDays
      .map((row) => ({ ...row }))
      .sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day))
    const cloneComponents = components
      .map((row) => ({ ...row }))
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    const cloneProps = componentProps
      .map((row) => ({ ...row }))
      .sort((a, b) => (a.componentId ?? 0) - (b.componentId ?? 0))

    return {
      schedule: cloneSchedule,
      global: {
        currentScheduleId: global.currentScheduleId,
        exportScale: global.exportScale,
        sidebarOpen: global.sidebarOpen,
      },
      scheduleDays: cloneDays,
      components: cloneComponents,
      componentProps: cloneProps,
    }
  }

  private async applySnapshotState(state: FilteredScheduleState) {
    if (!state.schedule.id) return
    const scheduleId = state.schedule.id

    this.isRestoringSnapshot = true
    try {
      await this.transaction(
        'rw',
        [
          this.schedules,
          this.scheduleDays,
          this.components,
          this.componentProps,
          this.global,
        ],
        async () => {
          await this.schedules.put(state.schedule)

          const global = await this.ensureGlobalRow()
          await this.global.put({
            ...global,
            currentScheduleId: state.global.currentScheduleId,
            exportScale: state.global.exportScale,
            sidebarOpen: state.global.sidebarOpen,
          })

          await this.scheduleDays.where({ scheduleId }).delete()
          if (state.scheduleDays.length) {
            await this.scheduleDays.bulkPut(state.scheduleDays)
          }

          const existingComponentIds = await this.components
            .where({ scheduleId })
            .primaryKeys()

          if (existingComponentIds.length) {
            await this.componentProps
              .where('componentId')
              .anyOf(existingComponentIds as number[])
              .delete()
          }

          await this.components.where({ scheduleId }).delete()
          if (state.components.length) {
            await this.components.bulkPut(state.components)
          }

          if (state.componentProps.length) {
            await this.componentProps.bulkPut(state.componentProps)
          }
        },
      )
      this.latestSnapshotState = this.cloneState(state)
      this.latestSnapshotHash = this.serializeState(state)
    } finally {
      this.isRestoringSnapshot = false
    }
  }

  private async pruneSnapshotsAfterCursor(
    scheduleId: number,
    cursorId: number | null | undefined,
  ) {
    if (cursorId === undefined) return
    const collection = this.snapshots.where('scheduleId').equals(scheduleId)
    if (cursorId == null) {
      await collection.delete()
      return
    }
    await collection.and((row) => (row.id ?? 0) > cursorId).delete()
  }

  private async trimSnapshotHistory(scheduleId: number) {
    const total = await this.snapshots
      .where('scheduleId')
      .equals(scheduleId)
      .count()
    if (total <= SNAPSHOT_HISTORY_LIMIT) return
    const excess = total - SNAPSHOT_HISTORY_LIMIT
    const staleRows = await this.snapshots
      .orderBy('id')
      .filter((row) => row.scheduleId === scheduleId)
      .limit(excess)
      .toArray()
    const staleIds = staleRows
      .map((row) => row.id)
      .filter((id): id is number => typeof id === 'number')
    if (staleIds.length) {
      await this.snapshots.bulkDelete(staleIds)
    }
  }

  private serializeState(state: FilteredScheduleState) {
    return JSON.stringify(state)
  }

  private cloneState<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
  }

  private async ensureScheduleDays(
    scheduleId: number,
    existing: ScheduleDay[],
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
      }),
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
    if (fallback) return fallback

    const now = Date.now()
    const newId = await this.themes.add({
      ...FALLBACK_THEME,
      createdAt: now,
      updatedAt: now,
    })
    const created = await this.themes.get(newId)
    if (!created) {
      throw new Error('Failed to create fallback theme record')
    }
    return created
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
    imageId: number | undefined,
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
    const canWrite = Dexie.currentTransaction?.mode !== 'readonly'
    if (!row) {
      row = {
        id: GLOBAL_ROW_ID,
        currentScheduleId: null,
        exportScale: DEFAULT_EXPORT_SCALE,
        sidebarOpen: true,
        snapshotCursorId: null,
        snapshotCursorScheduleId: null,
      }
      if (canWrite) {
        await this.global.put(row)
      }
      return row
    }

    const next: GlobalRow = { ...row }
    let mutated = false

    if (typeof next.exportScale !== 'number') {
      next.exportScale = DEFAULT_EXPORT_SCALE
      mutated = true
    }

    if (typeof next.sidebarOpen !== 'boolean') {
      next.sidebarOpen = true
      mutated = true
    }

    if (next.snapshotCursorId === undefined) {
      next.snapshotCursorId = null
      mutated = true
    }

    if (next.snapshotCursorScheduleId === undefined) {
      next.snapshotCursorScheduleId = null
      mutated = true
    }

    if (mutated && canWrite) {
      await this.global.put(next)
      return next
    }

    return mutated ? next : row
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
