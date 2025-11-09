import { Transaction } from 'dexie'

import { Day } from '../../types/Day'

import {
  Schedule,
  ScheduleComponent,
  ScheduleComponentProps,
  ScheduleDay,
  Theme,
} from './SheduleMakerDB.types'

const DAYS: Day[] = [
  Day.MON,
  Day.TUE,
  Day.WED,
  Day.THU,
  Day.FRI,
  Day.SAT,
  Day.SUN,
]

const DEFAULT_COLORS = [
  { id: 'primary', label: 'Primary', value: '#7aa5d6' },
  { id: 'secondary', label: 'Secondary', value: '#f9d8ff' },
  { id: 'text', label: 'Body Text', value: '#1d2430' },
  { id: 'background', label: 'Canvas', value: '#f4f8ff' },
  { id: 'card', label: 'Card', value: '#ffffff' },
]

const DEFAULT_FONTS = [
  { id: 'heading', label: 'Heading', family: 'Poppins, sans-serif' },
  { id: 'body', label: 'Body', family: 'Inter, sans-serif' },
]

const RADII = { none: 0, sm: 4, md: 12, lg: 24, pill: 999 }

function defaultTheme(now: number): Theme {
  return {
    slug: 'ElegantBlue',
    name: 'Elegant Blue',
    description: 'Soft gradients and friendly typography for VTuber schedules.',
    colors: DEFAULT_COLORS,
    fonts: DEFAULT_FONTS,
    radii: RADII,
    createdAt: now,
    updatedAt: now,
  }
}

function defaultSchedule(themeId: number | null, now: number): Schedule {
  return {
    name: 'My First Schedule',
    createdAt: now,
    updatedAt: now,
    themeId,
    weekStart: Day.MON,
    weekAnchor: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }
}

function defaultDays(scheduleId: number, now: number): ScheduleDay[] {
  return DAYS.map((day) => ({
    scheduleId,
    day,
    enabled: day === Day.MON || day === Day.WED || day === Day.FRI,
    gameName: '',
    time: '',
    imageId: undefined,
    backgroundColorToken: 'card',
    backgroundImageId: undefined,
    notes: null,
    createdAt: now,
    updatedAt: now,
  }))
}

type SeedComponent = ScheduleComponent & { metaDay?: Day }

function defaultComponents(scheduleId: number, now: number): SeedComponent[] {
  const base: SeedComponent[] = [
    {
      scheduleId,
      kind: 'text',
      name: 'Schedule Title',
      x: 120,
      y: 80,
      width: 1100,
      height: 180,
      rotation: 0,
      zIndex: 5,
      visible: true,
      locked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      scheduleId,
      kind: 'image',
      name: 'Hero Image',
      x: 1080,
      y: 0,
      width: 760,
      height: 1080,
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const dayComponents: SeedComponent[] = DAYS.map((day, index) => ({
    scheduleId,
    kind: 'day-card',
    name: `${day} Card`,
    x: 120,
    y: 280 + index * 110,
    width: 860,
    height: 100,
    rotation: 0,
    zIndex: 10,
    visible: true,
    locked: false,
    metaDay: day,
    createdAt: now,
    updatedAt: now,
  }))

  return [...base, ...dayComponents]
}

function defaultComponentProps(
  components: (SeedComponent & { id: number })[],
  now: number
): ScheduleComponentProps[] {
  return components.map((component) => {
    if (component.kind === 'text') {
      return {
        componentId: component.id!,
        kind: 'text',
        data: {
          text: 'Schedule',
          fontId: 'heading',
          fontSize: 120,
          colorToken: 'primary',
          align: 'left',
          letterSpacing: 0,
          lineHeight: 1,
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    if (component.kind === 'image') {
      return {
        componentId: component.id!,
        kind: 'image',
        data: {
          imageId: undefined,
          imageUrl: undefined,
          fit: 'contain',
          opacity: 1,
          borderRadiusToken: 'lg',
          alt: 'Hero artwork',
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    const day = component.metaDay ?? Day.MON
    return {
      componentId: component.id!,
      kind: 'day-card',
      data: {
        day,
        backgroundColorToken: 'card',
        backgroundImageId: undefined,
        backgroundImageUrl: undefined,
        accentColorToken: 'primary',
        borderRadiusToken: 'lg',
        showDate: true,
        showTime: true,
      },
      createdAt: now,
      updatedAt: now,
    }
  })
}

const defaultGlobal = (scheduleId: number) => ({
  id: 1,
  currentScheduleId: scheduleId,
  exportScale: 2,
  sidebarOpen: true,
})

export async function seed(transaction: Transaction) {
  const now = Date.now()
  const themeId = await transaction.themes.put(defaultTheme(now))
  const scheduleId = await transaction.schedules.put(
    defaultSchedule(themeId, now)
  )

  const days = defaultDays(scheduleId, now)
  await transaction.scheduleDays.bulkAdd(days)

  const seedComponents = defaultComponents(scheduleId, now)
  const componentsToInsert = seedComponents.map((seed) => {
    const { metaDay, ...component } = seed
    void metaDay
    return component
  })
  const componentIds = await transaction.components.bulkAdd(
    componentsToInsert,
    {
      allKeys: true,
    }
  )

  const componentsWithIds = seedComponents.map((component, index) => ({
    ...component,
    id: componentIds[index] as number,
  }))

  const props = defaultComponentProps(componentsWithIds, now)
  await transaction.componentProps.bulkAdd(props)

  const global = defaultGlobal(scheduleId)
  await transaction.global.put(global)

  return scheduleId
}
