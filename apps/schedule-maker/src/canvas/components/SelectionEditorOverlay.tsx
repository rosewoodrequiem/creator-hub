import type { FC } from 'react'

import { Button } from '@creator-hub/ui-kit'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type {
  ScheduleComponentWithProps,
  ScheduleSnapshot,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { ComponentEditorHost } from '../editors/ComponentEditorHost'

interface SelectionEditorOverlayProps {
  component: ScheduleComponentWithProps
  theme: Theme
  snapshot: ScheduleSnapshot
  canvasWidth: number
  canvasHeight: number
}

const PANEL_WIDTH = 360
const PANEL_HEIGHT = 420
const OFFSET = 24

export const SelectionEditorOverlay: FC<SelectionEditorOverlayProps> = ({
  component,
  theme,
  snapshot,
  canvasWidth,
  canvasHeight,
}) => {
  const position = computePosition(component, canvasWidth, canvasHeight)

  return (
    <div
      className="absolute z-[1000]"
      style={{
        left: position.left,
        top: position.top,
        pointerEvents: 'auto',
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="space-y-3">
        <LayerControls component={component} snapshot={snapshot} />
        <ComponentEditorHost
          component={component}
          theme={theme}
          snapshot={snapshot}
        />
      </div>
    </div>
  )
}

function computePosition(
  component: ScheduleComponentWithProps,
  canvasWidth: number,
  canvasHeight: number,
) {
  let left = component.x + component.width + OFFSET
  if (left + PANEL_WIDTH > canvasWidth - 16) {
    left = component.x - PANEL_WIDTH - OFFSET
  }
  if (left < 16) left = 16

  let top = component.y
  if (top + PANEL_HEIGHT > canvasHeight - 16) {
    top = canvasHeight - PANEL_HEIGHT - 16
  }
  if (top < 16) top = 16

  return { left, top }
}

interface LayerControlsProps {
  component: ScheduleComponentWithProps
  snapshot: ScheduleSnapshot
}

const LayerControls: FC<LayerControlsProps> = ({ component, snapshot }) => {
  if (!component.id) return null

  const ordered = [...snapshot.components].sort((a, b) => {
    const zDiff = (a.zIndex ?? 0) - (b.zIndex ?? 0)
    if (zDiff !== 0) return zDiff
    return (a.id ?? 0) - (b.id ?? 0)
  })
  const index = ordered.findIndex((item) => item.id === component.id)
  const isBack = index <= 0
  const isFront = index >= ordered.length - 1

  const move = (direction: Parameters<typeof db.reorderComponentZIndex>[1]) =>
    void db.reorderComponentZIndex(component.id!, direction)

  return (
    <div className="flex w-[320px] items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-xl">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500">
          Layer
        </div>
        <div className="text-sm font-semibold text-brand-ink">
          z-index {component.zIndex}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={isFront}
          onClick={() => move('front')}
        >
          Front
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isBack}
          onClick={() => move('back')}
        >
          Back
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isFront}
          onClick={() => move('forward')}
        >
          Up
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isBack}
          onClick={() => move('backward')}
        >
          Down
        </Button>
      </div>
    </div>
  )
}
