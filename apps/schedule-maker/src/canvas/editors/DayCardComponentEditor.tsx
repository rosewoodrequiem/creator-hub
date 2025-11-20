import { Button, ColorPalette } from '@creator-hub/ui-kit'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type {
  ScheduleComponentWithProps,
  ScheduleSnapshot,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { DAY_LABELS } from '../../utils/date'
import { AssetPicker } from '../components/AssetPicker'
import { resolveThemeColor } from '../theme/themeUtils'

type Props = {
  component: ScheduleComponentWithProps<'day-card'>
  theme: Theme
  snapshot: ScheduleSnapshot
}

export function DayCardComponentEditor({ component, theme, snapshot }: Props) {
  if (!component.id) return null

  const dayPlan = snapshot.week[component.props.day]

  const handleProps = (patch: Partial<typeof component.props>) => {
    void db.updateComponentProps(component.id!, 'day-card', patch)
  }

  const updateDayPlan = (patch: Partial<typeof dayPlan>) => {
    if (!patch) return
    void db.updateScheduleDay(component.props.day, patch)
  }

  const selectColor = (
    property: 'backgroundColorToken' | 'accentColorToken',
  ) => {
    return (value: string) => {
      const token =
        theme.colors.find((color) => color.value === value) ??
        theme.colors.find((color) => color.label === value)
      if (token) {
        handleProps({ [property]: token.id })
      }
    }
  }

  const backgroundColor = theme.colors.find(
    (color) => color.id === component.props.backgroundColorToken,
  )?.value
  const accentColor = theme.colors.find(
    (color) => color.id === component.props.accentColorToken,
  )?.value

  const titleFontSize = component.props.titleFontSize ?? 40
  const dayLabelFontSize = component.props.dayLabelFontSize ?? 16

  const applyDayLabelToAll = async () => {
    const patch = {
      dayLabelFontId: component.props.dayLabelFontId,
      dayLabelFontSize: component.props.dayLabelFontSize,
      dayLabelColorToken: component.props.dayLabelColorToken,
    }
    const targets = await db.components
      .filter(
        (item) =>
          item.kind === 'day-card' && item.scheduleId === component.scheduleId,
      )
      .toArray()
    await Promise.all(
      targets
        .filter((item) => item.id)
        .map((item) =>
          db.updateComponentProps(item.id!, 'day-card', patch),
        ),
    )
  }

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div className="flex items-center justify-between rounded-2xl bg-slate-100/60 p-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Day
          </div>
          <div className="text-base font-semibold text-brand-ink">
            {DAY_LABELS[component.props.day]}
          </div>
        </div>
        <Button
          variant={dayPlan?.enabled ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => updateDayPlan({ enabled: !dayPlan?.enabled })}
        >
          {dayPlan?.enabled ? 'Hide Day' : 'Show Day'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Stream Title
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/70 p-2"
            value={dayPlan?.gameName ?? ''}
            onChange={(event) =>
              updateDayPlan({ gameName: event.target.value })
            }
          />
        </label>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Time
          <input
            type="time"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/70 p-2"
            value={dayPlan?.time ?? ''}
            onChange={(event) => updateDayPlan({ time: event.target.value })}
          />
        </label>
      </div>

      <ColorPalette
        title="Background"
        colors={theme.colors.map((color) => ({
          label: color.label,
          value: color.value,
        }))}
        activeColor={backgroundColor}
        onSelect={selectColor('backgroundColorToken')}
      />

      <ColorPalette
        title="Accent"
        colors={theme.colors.map((color) => ({
          label: color.label,
          value: color.value,
        }))}
        activeColor={accentColor}
        onSelect={selectColor('accentColorToken')}
      />

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/60 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Title Style
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {titleFontSize}px ·{' '}
              {
                theme.fonts.find(
                  (font) => font.id === (component.props.titleFontId ?? 'heading'),
                )?.label ?? 'Heading'
              }
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Font Size
            <input
              type="number"
              min={8}
              max={200}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-2 py-1"
              value={titleFontSize}
              onChange={(event) =>
                handleProps({ titleFontSize: Number(event.target.value) || 0 })
              }
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Font
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-2 py-1"
              value={component.props.titleFontId ?? 'heading'}
              onChange={(event) =>
                handleProps({ titleFontId: event.target.value })
              }
            >
              {theme.fonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ColorPalette
          title="Title Color"
          colors={theme.colors.map((color) => ({
            label: color.label,
            value: color.value,
          }))}
          activeColor={resolveThemeColor(
            theme,
            component.props.titleColorToken ?? 'text',
            '#0f172a',
          )}
          onSelect={(value) => {
            const token =
              theme.colors.find((color) => color.value === value) ?? null
            handleProps({
              titleColorToken: token?.id ?? component.props.titleColorToken,
            })
          }}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/60 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Day Label Style
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {dayLabelFontSize}px ·{' '}
              {
                theme.fonts.find(
                  (font) =>
                    font.id === (component.props.dayLabelFontId ?? 'heading'),
                )?.label ?? 'Heading'
              }
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={applyDayLabelToAll}>
            Apply to all
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Font Size
            <input
              type="number"
              min={8}
              max={72}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-2 py-1"
              value={dayLabelFontSize}
              onChange={(event) =>
                handleProps({ dayLabelFontSize: Number(event.target.value) || 0 })
              }
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Font
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-2 py-1"
              value={component.props.dayLabelFontId ?? 'heading'}
              onChange={(event) =>
                handleProps({ dayLabelFontId: event.target.value })
              }
            >
              {theme.fonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ColorPalette
          title="Day Label Color"
          colors={theme.colors.map((color) => ({
            label: color.label,
            value: color.value,
          }))}
          activeColor={resolveThemeColor(
            theme,
            component.props.dayLabelColorToken ?? 'secondary',
            '#4b5563',
          )}
          onSelect={(value) => {
            const token =
              theme.colors.find((color) => color.value === value) ?? null
            handleProps({
              dayLabelColorToken:
                token?.id ?? component.props.dayLabelColorToken,
            })
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={component.props.showDate ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => handleProps({ showDate: !component.props.showDate })}
        >
          {component.props.showDate ? 'Hide Date' : 'Show Date'}
        </Button>
        <Button
          variant={component.props.showTime ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => handleProps({ showTime: !component.props.showTime })}
        >
          {component.props.showTime ? 'Hide Time' : 'Show Time'}
        </Button>
      </div>

      <AssetPicker
        label="Background image"
        selectedId={component.props.backgroundImageId ?? undefined}
        onSelect={(id) =>
          handleProps({
            backgroundImageId: id ?? undefined,
            backgroundImageUrl: undefined,
          })
        }
      />
    </div>
  )
}
