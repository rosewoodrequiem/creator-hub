import { Button, FloatingPanel } from '@creator-hub/ui-kit'
import type { FC, ReactElement } from 'react'

import type {
  ScheduleComponentWithProps,
  ScheduleSnapshot,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { useCanvasStore } from '../state/useCanvasStore'
import { DayCardComponentEditor } from './DayCardComponentEditor'
import { ImageComponentEditor } from './ImageComponentEditor'

interface ComponentEditorHostProps {
  component: ScheduleComponentWithProps
  theme: Theme
  snapshot: ScheduleSnapshot
}

export const ComponentEditorHost: FC<ComponentEditorHostProps> = ({
  component,
  theme,
  snapshot,
}) => {
  const deselect = useCanvasStore((state) => state.deselect)

  let content: ReactElement | null = null
  let title = component.name

  switch (component.kind) {
    case 'image':
      content = <ImageComponentEditor component={component} theme={theme} />
      title = component.name || 'Image'
      break
    case 'day-card':
      content = (
        <DayCardComponentEditor
          component={component}
          theme={theme}
          snapshot={snapshot}
        />
      )
      title = component.name || 'Day card'
      break
    default:
      content = null
  }

  if (!content) return null

  return (
    <FloatingPanel
      title={title}
      subtitle="Tap components to customize them here."
      actions={
        <Button variant="ghost" size="sm" onClick={deselect}>
          Close
        </Button>
      }
    >
      {content}
    </FloatingPanel>
  )
}
