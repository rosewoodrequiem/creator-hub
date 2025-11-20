import type { ReactNode } from 'react'

import type {
  ComponentKind,
  Schedule,
  ScheduleComponentWithProps,
  ScheduleSnapshot,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { Day } from '../../types/Day'
import {
  DAY_LABELS,
  fmtTime,
  fmtZone,
  shortMonthDay,
  weekDates,
} from '../../utils/date'
import { InlineTextBlock } from '../components/inline-text-block/InlineTextBlock'
import {
  resolveThemeColor,
  resolveThemeFont,
  resolveThemeRadius,
} from '../theme/themeUtils'

const DAYS_SEQUENCE: Day[] = [
  Day.MON,
  Day.TUE,
  Day.WED,
  Day.THU,
  Day.FRI,
  Day.SAT,
  Day.SUN,
]

type RendererProps<K extends ComponentKind> = {
  component: ScheduleComponentWithProps<K>
  theme: Theme
  schedule: Schedule
  snapshot: ScheduleSnapshot
}

type Renderer = (props: RendererProps<ComponentKind>) => ReactNode

function isTextComponent(
  component: ScheduleComponentWithProps,
): component is ScheduleComponentWithProps<'text'> {
  return component.kind === 'text'
}

function isImageComponent(
  component: ScheduleComponentWithProps,
): component is ScheduleComponentWithProps<'image'> {
  return component.kind === 'image'
}

function isDayCardComponent(
  component: ScheduleComponentWithProps,
): component is ScheduleComponentWithProps<'day-card'> {
  return component.kind === 'day-card'
}

const textRenderer: Renderer = ({ component, theme }) => {
  if (!isTextComponent(component)) return null
  return (
    <InlineTextBlock key={component.id} component={component} theme={theme} />
  )
}

const imageRenderer: Renderer = ({ component, theme }) => {
  if (!isImageComponent(component)) return null
  const props = component.props
  const radius = resolveThemeRadius(
    theme,
    props.borderRadiusToken,
    theme.radii.lg,
  )
  const background = resolveThemeColor(theme, 'card', '#e2e8f0')

  const content = props.imageUrl ? (
    <img
      src={props.imageUrl}
      alt={props.alt ?? ''}
      className="h-full w-full"
      style={{
        objectFit: props.fit,
        opacity: props.opacity,
      }}
    />
  ) : (
    <div className="h-full w-full" style={{ background }} />
  )

  return (
    <div
      className="h-full w-full overflow-hidden"
      style={{
        borderRadius: radius,
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
      }}
    >
      {content}
    </div>
  )
}

const dayCardRenderer: Renderer = ({
  component,
  theme,
  schedule,
  snapshot,
}) => {
  if (!isDayCardComponent(component)) return null
  const props = component.props
  const day = props.day ?? Day.MON
  const dayData = snapshot.week[day]
  const enabled = !!dayData?.enabled

  const anchor = new Date(schedule.weekAnchor)
  const dates = weekDates(anchor, schedule.weekStart)
  const idx = DAYS_SEQUENCE.indexOf(day)
  const dateValue = idx >= 0 ? dates[idx] : null

  const when =
    enabled && dayData?.time && dateValue
      ? fmtTime(dateValue, dayData.time, schedule.timezone)
      : 'Time TBD'
  const zone =
    enabled && dateValue
      ? fmtZone(dateValue, schedule.timezone)
      : schedule.timezone
  const formattedDate = shortMonthDay(dateValue ?? null)
  const backgroundColor = resolveThemeColor(
    theme,
    props.backgroundColorToken ?? dayData?.backgroundColorToken ?? 'card',
    '#ffffff',
  )
  const accent = resolveThemeColor(
    theme,
    props.accentColorToken ?? 'primary',
    '#7aa5d6',
  )
  const radius = resolveThemeRadius(
    theme,
    props.borderRadiusToken ?? 'lg',
    theme.radii.lg,
  )
  const textColor = resolveThemeColor(theme, 'text', '#0f172a')
  const zoneColor = resolveThemeColor(theme, 'secondary', '#64748b')

  const backgroundImage =
    props.backgroundImageUrl ??
    dayData?.backgroundGraphic ??
    dayData?.gameGraphic

  return (
    <div
      className="relative flex h-full w-full items-center overflow-hidden"
      style={{
        borderRadius: radius,
        border: `1px solid ${accent}33`,
        background: backgroundColor,
        filter: enabled ? 'none' : 'grayscale(0.8)',
        opacity: enabled ? 1 : 0.5,
        boxShadow: '0 20px 80px rgba(15, 23, 42, 0.1)',
      }}
    >
      <div className="flex h-full flex-1 flex-col justify-center gap-4 px-10">
        <div
          className="text-sm uppercase tracking-[0.4em]"
          style={{ color: zoneColor }}
        >
          {DAY_LABELS[day]}
        </div>
        <div
          className="text-5xl font-extrabold"
          style={{
            color: textColor,
            fontFamily: resolveThemeFont(
              theme,
              'heading',
              'Poppins, sans-serif',
            ),
          }}
        >
          {dayData?.gameName?.trim() || 'Untitled Stream'}
        </div>
        {props.showDate && (
          <div className="text-2xl font-semibold" style={{ color: accent }}>
            {formattedDate}
          </div>
        )}
        {props.showTime && (
          <div className="text-xl font-medium" style={{ color: zoneColor }}>
            {when} · {zone}
          </div>
        )}
      </div>
      <div className="relative h-full w-[40%] flex-shrink-0 overflow-hidden">
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: enabled ? 1 : 0.4 }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${backgroundColor})`,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(15,23,42,0.7) 0%, transparent 100%)',
          }}
        />
      </div>
    </div>
  )
}

export const componentRegistry: Record<ComponentKind, Renderer> = {
  text: textRenderer,
  image: imageRenderer,
  'day-card': dayCardRenderer,
}
