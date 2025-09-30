export type ComponentKind =
  | "title"
  | "game-slot"
  | "image"
  | "text"
  | "badge"
  | "time"
  | "divider"

export type Vec2 = { x: number; y: number }
export type Size = { w: number; h: number }

export type Schedule = {
  id: string // uuid
  name: string
  createdAt: number // Date.now()
  updatedAt: number
  themeId?: string // optional UI theme reference
}

export type Component = {
  id: string // uuid
  scheduleId: string // FK -> Schedule.id
  kind: ComponentKind
  position: Vec2 // top-left (px)
  size: Size // width/height (px)
  zIndex: number // draw order
  props: Record<string, unknown> // arbitrary data for the component
  locked?: boolean // prevent drag/remove
  createdAt: number
  updatedAt: number
}
