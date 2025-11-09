import { useState } from 'react'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type {
  ScheduleComponentWithProps,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { AssetPicker } from '../components/AssetPicker'
import { resolveThemeRadius } from '../theme/themeUtils'

type Props = {
  component: ScheduleComponentWithProps<'image'>
  theme: Theme
}

export function ImageComponentEditor({ component, theme }: Props) {
  const [updating, setUpdating] = useState(false)

  if (!component.id) return null

  const handleChange = async (patch: Partial<typeof component.props>) => {
    if (updating) return
    setUpdating(true)
    await db.updateComponentProps(component.id!, 'image', patch)
    setUpdating(false)
  }

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
          {component.props.imageUrl ? (
            <img
              src={component.props.imageUrl}
              alt={component.props.alt ?? ''}
              className="h-40 w-full object-cover"
              style={{
                borderRadius: resolveThemeRadius(
                  theme,
                  component.props.borderRadiusToken,
                  theme.radii.lg
                ),
              }}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-slate-400">
              No image selected
            </div>
          )}
        </div>
      </div>

      <AssetPicker
        selectedId={component.props.imageId ?? undefined}
        onSelect={(id) =>
          handleChange({ imageId: id ?? undefined, imageUrl: undefined })
        }
        label="Image"
      />

      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Object fit
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
          value={component.props.fit}
          onChange={(event) =>
            handleChange({
              fit: event.target.value as typeof component.props.fit,
            })
          }
        >
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
        </select>
      </label>

      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Opacity
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={component.props.opacity}
          onChange={(event) =>
            handleChange({ opacity: Number(event.target.value) })
          }
          className="mt-1 w-full"
        />
      </label>
    </div>
  )
}
