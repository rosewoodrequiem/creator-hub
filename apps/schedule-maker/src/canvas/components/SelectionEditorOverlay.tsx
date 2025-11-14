import type {
  ScheduleComponentWithProps,
  ScheduleSnapshot,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { ComponentEditorHost } from '../editors/ComponentEditorHost'

type Props = {
  component: ScheduleComponentWithProps
  theme: Theme
  snapshot: ScheduleSnapshot
  canvasWidth: number
  canvasHeight: number
}

const PANEL_WIDTH = 360
const PANEL_HEIGHT = 420
const OFFSET = 24

export function SelectionEditorOverlay({
  component,
  theme,
  snapshot,
  canvasWidth,
  canvasHeight,
}: Props) {
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
      <ComponentEditorHost
        component={component}
        theme={theme}
        snapshot={snapshot}
      />
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
