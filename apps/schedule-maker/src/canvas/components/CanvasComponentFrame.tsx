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
  const { x, y, width, height, rotation, zIndex, locked, kind } = component
  const frameRef = useRef<HTMLDivElement>(null)
  const getIsEditing = () => isComponentEditing(component, frameRef)
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
  const suppressClickRef = useRef(false)

  useEffect(() => {
    if (isDragging) return
    const incoming = { x, y }
    const lastPersisted = lastPersistedRef.current
    const draft = draftPosition

    // If props are stale relative to our last persisted position, keep showing the
    // optimistic position until the DB-driven snapshot catches up.
    if (
      lastPersisted &&
      (incoming.x !== lastPersisted.x || incoming.y !== lastPersisted.y)
    ) {
      return
    }

    if (draft.x === incoming.x && draft.y === incoming.y) {
      lastPersistedRef.current = incoming
      return
    }

    setDraftPosition(incoming)
    lastPersistedRef.current = incoming
  }, [x, y, isDragging, draftPosition])

  if (component.visible === false) return null

  return (
    <div
      ref={frameRef}
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
          currentPosition: draftPosition,
          pointerIdRef,
          dragOffsetRef,
          dragStartRef,
          holdReadyRef,
          holdTimerRef,
          hasDraggedRef,
          suppressClickRef,
          isEditing: getIsEditing,
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
          currentPosition: draftPosition,
          pointerIdRef,
          dragOffsetRef,
          dragStartRef,
          holdReadyRef,
          holdTimerRef,
          rafPersistRef,
          lastPersistedRef,
          hasDraggedRef,
          suppressClickRef,
          isDragging,
          isEditing: getIsEditing,
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
          currentPosition: draftPosition,
          pointerIdRef,
          dragOffsetRef,
          dragStartRef,
          holdReadyRef,
          holdTimerRef,
          rafPersistRef,
          lastPersistedRef,
          hasDraggedRef,
          suppressClickRef,
          isEditing: getIsEditing,
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
          suppressClickRef,
          currentPosition: { x, y },
        })
      }
      onClick={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault()
          suppressClickRef.current = false
          return
        }
        if (component.kind !== 'text') {
          event.stopPropagation()
          onSelect?.()
        }
      }}
    >
      <div
        className="h-full w-full"
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
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
    isEditing,
    setIsDragging,
    setDraftPosition,
    currentPosition,
    pointerIdRef,
    dragOffsetRef,
    dragStartRef,
    holdReadyRef,
    holdTimerRef,
    hasDraggedRef,
  } = params
  if (locked) return
  if (isEditing()) return
  if (component.visible === false || component.id == null) return

  event.stopPropagation()

  const point = toCanvasPoint(event, canvasWidth, canvasHeight)
  if (!point) return

  pointerIdRef.current = event.pointerId
  dragStartRef.current = point
  dragOffsetRef.current = {
    x: point.x - currentPosition.x,
    y: point.y - currentPosition.y,
  }
  setDraftPosition({ x: currentPosition.x, y: currentPosition.y })
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
    isEditing: () => boolean
  },
) {
  const {
    component,
    canvasWidth,
    canvasHeight,
    locked,
    setIsDragging,
    setDraftPosition,
    currentPosition,
    pointerIdRef,
    dragOffsetRef,
    holdReadyRef,
    dragStartRef,
    rafPersistRef,
    lastPersistedRef,
    hasDraggedRef,
    isEditing,
  } = params
  if (locked) return
  if (isEditing()) return
  if (pointerIdRef.current !== event.pointerId) return
  if (component.id == null) return

  const point = toCanvasPoint(event, canvasWidth, canvasHeight)
  if (!point) return

  const origin = dragStartRef.current ?? currentPosition
  const distance = Math.abs(point.x - origin.x) + Math.abs(point.y - origin.y)

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

  const unclamped = {
    x: point.x - dragOffsetRef.current.x,
    y: point.y - dragOffsetRef.current.y,
  }
  const next = clampPosition(unclamped, component, canvasWidth, canvasHeight)

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
    isEditing: () => boolean
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
    holdReadyRef,
    holdTimerRef,
    rafPersistRef,
    lastPersistedRef,
    hasDraggedRef,
    suppressClickRef,
    isEditing,
  } = params
  if (locked) return
  if (isEditing()) return
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

  // Keep optimistic position while waiting for DB snapshot refresh.
  lastPersistedRef.current = next

  const didDrag = hasDraggedRef.current

  resetDragState({
    setIsDragging,
    setDraftPosition,
    pointerIdRef,
    holdTimerRef,
    holdReadyRef,
    hasDraggedRef,
    suppressClickRef,
    currentPosition: next,
  })

  if (!didDrag) return

  // Prevent the subsequent click from focusing text after a drag.
  suppressClickRef.current = true
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
  suppressClickRef,
  currentPosition,
}: {
  setIsDragging: (value: boolean) => void
  setDraftPosition: (value: { x: number; y: number }) => void
  pointerIdRef: MutableRefObject<number | null>
  holdTimerRef: MutableRefObject<number | null>
  holdReadyRef: MutableRefObject<boolean>
  hasDraggedRef: MutableRefObject<boolean>
  suppressClickRef: MutableRefObject<boolean>
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
  suppressClickRef.current = false
}

type PointerHandlerParams = {
  component: ScheduleComponent
  canvasWidth: number
  canvasHeight: number
  locked?: boolean
  onSelect?: () => void
  setIsDragging: (value: boolean) => void
  setDraftPosition: (value: { x: number; y: number }) => void
  currentPosition: { x: number; y: number }
  pointerIdRef: MutableRefObject<number | null>
  dragOffsetRef: MutableRefObject<{ x: number; y: number }>
  dragStartRef: MutableRefObject<{ x: number; y: number }>
  holdReadyRef: MutableRefObject<boolean>
  holdTimerRef: MutableRefObject<number | null>
  hasDraggedRef: MutableRefObject<boolean>
  suppressClickRef: MutableRefObject<boolean>
  isDragging?: boolean
  isEditing: () => boolean
}

function isComponentEditing(
  component: ScheduleComponent,
  frameRef: MutableRefObject<HTMLDivElement | null>,
) {
  if (component.kind !== 'text') return false
  const active = document.activeElement
  if (!active || !frameRef.current) return false
  return frameRef.current.contains(active)
}
