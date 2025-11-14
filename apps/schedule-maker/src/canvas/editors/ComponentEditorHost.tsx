import { Button, FloatingPanel } from '@creator-hub/ui-kit'
import type { ReactNode } from 'react'

import type {
  ScheduleComponentWithProps,
  ScheduleSnapshot,
  Theme,
} from '../../store/schedule-maker-db/SheduleMakerDB.types'
import { useCanvasStore } from '../state/useCanvasStore'
import { DayCardComponentEditor } from './DayCardComponentEditor'
import { ImageComponentEditor } from './ImageComponentEditor'

type Props = {
  component: ScheduleComponentWithProps
  theme: Theme
  snapshot: ScheduleSnapshot
}

export function ComponentEditorHost({ component, theme, snapshot }: Props) {
  const deselect = useCanvasStore((state) => state.deselect)

  let content: ReactNode = null
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
