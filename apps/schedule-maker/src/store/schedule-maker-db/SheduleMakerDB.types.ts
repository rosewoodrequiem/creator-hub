import { Day } from '../../types/Day'
import type { TemplateId } from '../../types/Template'
import type { Week } from '../../types/Week'

export type ComponentKind = 'text' | 'image' | 'day-card'

export type ThemeColorToken = {
  id: string
  label: string
  value: string
}

export type ThemeFontToken = {
  id: string
  label: string
  family: string
}

export type ThemeRadiusScale = {
  none: number
  sm: number
  md: number
  lg: number
  pill: number
}

export type Theme = {
  id?: number
  slug: TemplateId
  name: string
  description?: string
  colors: ThemeColorToken[]
  fonts: ThemeFontToken[]
  radii: ThemeRadiusScale
  createdAt: number
  updatedAt: number
}

export type Schedule = {
  id?: number
  name: string
  themeId: number | null // FK -> themes.id
  weekStart: Day
  weekAnchor: string // ISO string for determinism
  timezone: string
  createdAt: number
  updatedAt: number
}

export type ScheduleDay = {
  id?: number
  scheduleId: number // FK -> schedules.id
  day: Day
  enabled: boolean
  gameName: string
  time: string
  imageId?: number | null // FK -> images.id
  backgroundColorToken?: string | null
  backgroundImageId?: number | null // FK -> images.id
  notes?: string | null
  createdAt: number
  updatedAt: number
}

export type BaseComponent = {
  id?: number
  scheduleId: number // FK -> schedules.id
  kind: ComponentKind
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  visible: boolean
  locked: boolean
  createdAt: number
  updatedAt: number
}

export type TextComponentProps = {
  text: string
  fontId: string
  fontSize: number
  colorToken: string
  align: 'left' | 'center' | 'right'
  letterSpacing?: number
  lineHeight?: number
}

export type ImageComponentProps = {
  imageId?: number | null
  imageUrl?: string | null
  fit: 'cover' | 'contain'
  opacity: number
  borderRadiusToken?: string
  alt?: string
}

export type DayCardComponentProps = {
  day: Day
  backgroundColorToken?: string | null
  backgroundImageId?: number | null
  backgroundImageUrl?: string | null
  accentColorToken?: string | null
  borderRadiusToken?: string
  showDate: boolean
  showTime: boolean
}

export type ComponentPropsMap = {
  text: TextComponentProps
  image: ImageComponentProps
  'day-card': DayCardComponentProps
}

export type ScheduleComponent<K extends ComponentKind = ComponentKind> =
  BaseComponent & {
    kind: K
  }

export type ScheduleComponentProps<K extends ComponentKind = ComponentKind> = {
  id?: number
  componentId: number // FK -> components.id
  kind: K
  data: ComponentPropsMap[K]
  createdAt: number
  updatedAt: number
}

export type ImageRow = {
  id?: number
  data: string
  name?: string | null
  createdAt: number
}

export type GlobalRow = {
  id?: number
  currentScheduleId: number | null
  exportScale: number
  sidebarOpen: boolean
}

export type ScheduleComponentWithProps<
  K extends ComponentKind = ComponentKind,
> = ScheduleComponent<K> & {
  props: ComponentPropsMap[K]
}

export type ScheduleSnapshot = {
  schedule: Schedule
  theme: Theme
  week: Week
  components: ScheduleComponentWithProps[]
}

export function getDefaultComponentProps<K extends ComponentKind>(
  kind: K,
): ComponentPropsMap[K] {
  const defaults: ComponentPropsMap = {
    text: {
      text: 'Schedule',
      fontId: 'heading',
      fontSize: 72,
      colorToken: 'primary',
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.1,
    },
    image: {
      imageId: undefined,
      imageUrl: undefined,
      fit: 'contain',
      opacity: 1,
      borderRadiusToken: 'lg',
      alt: 'Image',
    },
    'day-card': {
      day: Day.MON,
      backgroundColorToken: 'card',
      backgroundImageId: undefined,
      backgroundImageUrl: undefined,
      accentColorToken: 'primary',
      borderRadiusToken: 'lg',
      showDate: true,
      showTime: true,
    },
  }

  return defaults[kind] as ComponentPropsMap[K]
}
