import clsx from 'clsx'
import type { PropsWithChildren } from 'react'

import type { ScheduleComponent } from '../../store/schedule-maker-db/SheduleMakerDB.types'

type CanvasComponentFrameProps = PropsWithChildren<{
  component: ScheduleComponent
  selected?: boolean
  onSelect?: () => void
}>

export function CanvasComponentFrame({
  component,
  selected,
  onSelect,
  children,
}: CanvasComponentFrameProps) {
  if (component.visible === false) return null

  const { x, y, width, height, rotation, zIndex } = component

  return (
    <div
      className={clsx(
        'absolute rounded-xl transition ring-offset-2',
        selected ? 'ring-2 ring-pink-400' : 'ring-1 ring-transparent'
      )}
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
    >
      {children}
    </div>
  )
}
