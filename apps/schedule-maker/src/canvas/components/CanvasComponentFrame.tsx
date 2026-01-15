import clsx from 'clsx'
import {
  type FC,
  type MutableRefObject,
  type PointerEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type { ScheduleComponent } from '../../store/schedule-maker-db/SheduleMakerDB.types'

interface CanvasComponentFrameProps
  extends PropsWithChildren<{
    component: ScheduleComponent
    selected?: boolean
    onSelect?: () => void
    canvasWidth: number
    canvasHeight: number
  }> {}

export const CanvasComponentFrame: FC<CanvasComponentFrameProps> = ({
  component,
  selected,
  onSelect,
  canvasWidth,
  canvasHeight,
  children,
}) => {
  if (component.visible === false) return null

  const { x, y, width, height, rotation, zIndex, locked, kind } = component
  const [isDragging, setIsDragging] = useState(false)
  const [draftPosition, setDraftPosition] = useState<{ x: number; y: number }>(
    () => ({ x, y }),
  )
  const pointerIdRef = useRef<number | null>(null)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragStartRef = useRef<{ x: number; y: number }>({ x, y })
  const holdReadyRef = useRef(!kind || kind !== 'text')
  const holdTimerRef = useRef<number | null>(null)
  const rafPersistRef = useRef<number | null>(null)
  const lastPersistedRef = useRef<{ x: number; y: number }>({ x, y })
  const hasDraggedRef = useRef(false)

  useEffect(() => {
    if (isDragging) return
    setDraftPosition({ x, y })
    lastPersistedRef.current = { x, y }
  }, [x, y, isDragging])

  return (
    <div
      className={clsx(
        'absolute rounded-xl transition ring-offset-2',
        selected ? 'ring-2 ring-pink-400' : 'ring-1 ring-transparent',
        locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
      )}
      style={{
        left: draftPosition.x,
        top: draftPosition.y,
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex,
        pointerEvents: 'auto',
        userSelect: isDragging ? 'none' : undefined,
      }}
      onPointerDown={(event) =>
        handlePointerDown(event, {
          component,
          canvasWidth,
          canvasHeight,
          onSelect,
          locked,
          setIsDragging,
          setDraftPosition,
          pointerIdRef,
          dragOffsetRef,
          dragStartRef,
          holdReadyRef,
          holdTimerRef,
          hasDraggedRef,
        })
      }
      onPointerMove={(event) =>
        handlePointerMove(event, {
          component,
          canvasWidth,
          canvasHeight,
          locked,
          setIsDragging,
          setDraftPosition,
          pointerIdRef,
          dragOffsetRef,
          dragStartRef,
          holdReadyRef,
          rafPersistRef,
          lastPersistedRef,
          hasDraggedRef,
        })
      }
      onPointerUp={(event) =>
        handlePointerUp(event, {
          component,
          canvasWidth,
          canvasHeight,
          locked,
          setIsDragging,
          setDraftPosition,
          pointerIdRef,
          dragOffsetRef,
          dragStartRef,
          holdReadyRef,
          holdTimerRef,
          rafPersistRef,
          lastPersistedRef,
          hasDraggedRef,
        })
      }
      onPointerCancel={() =>
        resetDragState({
          setIsDragging,
          setDraftPosition,
          pointerIdRef,
          holdTimerRef,
          holdReadyRef,
          hasDraggedRef,
          currentPosition: { x, y },
        })
      }
    >
      <div
        className="h-full w-full"
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.()
        }}
      >
        {children}
      </div>
    </div>
  )
}

function handlePointerDown(
  event: PointerEvent<HTMLDivElement>,
  params: PointerHandlerParams,
) {
  const {
    component,
    canvasWidth,
    canvasHeight,
    locked,
    onSelect,
    setIsDragging,
    setDraftPosition,
    pointerIdRef,
    dragOffsetRef,
    dragStartRef,
    holdReadyRef,
    holdTimerRef,
    hasDraggedRef,
  } = params
  if (locked) return
  if (component.visible === false || component.id == null) return

  onSelect?.()
  event.stopPropagation()

  const point = toCanvasPoint(event, canvasWidth, canvasHeight)
  if (!point) return

  pointerIdRef.current = event.pointerId
  dragStartRef.current = point
  dragOffsetRef.current = {
    x: point.x - component.x,
    y: point.y - component.y,
  }
  setDraftPosition({ x: component.x, y: component.y })
  holdReadyRef.current = component.kind !== 'text'

  if (component.kind === 'text') {
    holdTimerRef.current = window.setTimeout(() => {
      holdReadyRef.current = true
    }, 180)
  }

  hasDraggedRef.current = false
  setIsDragging(false)
}

function handlePointerMove(
  event: PointerEvent<HTMLDivElement>,
  params: PointerHandlerParams & {
    rafPersistRef: MutableRefObject<number | null>
    lastPersistedRef: MutableRefObject<{ x: number; y: number }>
    hasDraggedRef: MutableRefObject<boolean>
  },
) {
  const {
    component,
    canvasWidth,
    canvasHeight,
    locked,
    setIsDragging,
    setDraftPosition,
    pointerIdRef,
    dragOffsetRef,
    dragStartRef,
    holdReadyRef,
    rafPersistRef,
    lastPersistedRef,
    hasDraggedRef,
  } = params
  if (locked) return
  if (pointerIdRef.current !== event.pointerId) return
  if (component.id == null) return

  const point = toCanvasPoint(event, canvasWidth, canvasHeight)
  if (!point) return

  const distance =
    Math.abs(point.x - dragStartRef.current.x) +
    Math.abs(point.y - dragStartRef.current.y)

  const readyToDrag = holdReadyRef.current || distance > 6
  if (!readyToDrag) return

  if (!holdReadyRef.current && component.kind === 'text') {
    return
  }

  if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  if (distance > 2) {
    setIsDragging(true)
    hasDraggedRef.current = true
  }

  const next = clampPosition(
    {
      x: point.x - dragOffsetRef.current.x,
      y: point.y - dragOffsetRef.current.y,
    },
    component,
    canvasWidth,
    canvasHeight,
  )

  setDraftPosition(next)
  schedulePersist(next, component.id, rafPersistRef, lastPersistedRef)
  event.preventDefault()
}

function handlePointerUp(
  event: PointerEvent<HTMLDivElement>,
  params: PointerHandlerParams & {
    rafPersistRef: MutableRefObject<number | null>
    lastPersistedRef: MutableRefObject<{ x: number; y: number }>
    hasDraggedRef: MutableRefObject<boolean>
  },
) {
  const {
    component,
    canvasWidth,
    canvasHeight,
    locked,
    setIsDragging,
    setDraftPosition,
    pointerIdRef,
    dragOffsetRef,
    dragStartRef,
    holdReadyRef,
    holdTimerRef,
    rafPersistRef,
    lastPersistedRef,
    hasDraggedRef,
  } = params
  if (locked) return
  if (pointerIdRef.current !== event.pointerId) return
  if (component.id == null) return

  const point = toCanvasPoint(event, canvasWidth, canvasHeight)
  const next = point
    ? clampPosition(
        {
          x: point.x - dragOffsetRef.current.x,
          y: point.y - dragOffsetRef.current.y,
        },
        component,
        canvasWidth,
        canvasHeight,
      )
    : { x: component.x, y: component.y }

  const didDrag = hasDraggedRef.current

  resetDragState({
    setIsDragging,
    setDraftPosition,
    pointerIdRef,
    holdTimerRef,
    holdReadyRef,
    hasDraggedRef,
    currentPosition: next,
  })

  if (!didDrag) return
  if (
    next.x !== lastPersistedRef.current.x ||
    next.y !== lastPersistedRef.current.y
  ) {
    schedulePersist(next, component.id, rafPersistRef, lastPersistedRef)
  }
}

function clampPosition(
  position: { x: number; y: number },
  component: ScheduleComponent,
  canvasWidth: number,
  canvasHeight: number,
) {
  const maxX = Math.max(0, canvasWidth - component.width)
  const maxY = Math.max(0, canvasHeight - component.height)
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  }
}

function toCanvasPoint(
  event: PointerEvent<HTMLDivElement>,
  canvasWidth: number,
  canvasHeight: number,
) {
  const root = document.getElementById('capture-root')
  if (!root) return null
  const rect = root.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null

  const scaleX = canvasWidth / rect.width
  const scaleY = canvasHeight / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function schedulePersist(
  position: { x: number; y: number },
  componentId: number,
  rafPersistRef: MutableRefObject<number | null>,
  lastPersistedRef: MutableRefObject<{ x: number; y: number }>,
) {
  if (rafPersistRef.current != null) return
  rafPersistRef.current = requestAnimationFrame(() => {
    rafPersistRef.current = null
    lastPersistedRef.current = position
    void db.updateComponentLayout(componentId, position)
  })
}

function resetDragState({
  setIsDragging,
  setDraftPosition,
  pointerIdRef,
  holdTimerRef,
  holdReadyRef,
  hasDraggedRef,
  currentPosition,
}: {
  setIsDragging: (value: boolean) => void
  setDraftPosition: (value: { x: number; y: number }) => void
  pointerIdRef: MutableRefObject<number | null>
  holdTimerRef: MutableRefObject<number | null>
  holdReadyRef: MutableRefObject<boolean>
  hasDraggedRef: MutableRefObject<boolean>
  currentPosition: { x: number; y: number }
}) {
  setIsDragging(false)
  setDraftPosition(currentPosition)
  if (pointerIdRef.current != null) {
    pointerIdRef.current = null
  }
  if (holdTimerRef.current) {
    clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
  }
  holdReadyRef.current = true
  hasDraggedRef.current = false
}

type PointerHandlerParams = {
  component: ScheduleComponent
  canvasWidth: number
  canvasHeight: number
  locked?: boolean
  onSelect?: () => void
  setIsDragging: (value: boolean) => void
  setDraftPosition: (value: { x: number; y: number }) => void
  pointerIdRef: MutableRefObject<number | null>
  dragOffsetRef: MutableRefObject<{ x: number; y: number }>
  dragStartRef: MutableRefObject<{ x: number; y: number }>
  holdReadyRef: MutableRefObject<boolean>
  holdTimerRef: MutableRefObject<number | null>
  hasDraggedRef: MutableRefObject<boolean>
}
