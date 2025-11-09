import clsx from 'clsx'

import type { Theme } from '../store/schedule-maker-db/SheduleMakerDB.types'

import { CanvasComponentFrame } from './components/CanvasComponentFrame'
import NoiseOverlay from './components/NoiseOverlay'
import { SelectionEditorOverlay } from './components/SelectionEditorOverlay'
import { useScheduleSnapshot } from './hooks/useScheduleSnapshot'
import { componentRegistry } from './registry/componentRegistry'
import { useCanvasStore } from './state/useCanvasStore'
import { resolveThemeColor, resolveThemeFont } from './theme/themeUtils'

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

export default function SchedulePreview() {
  const snapshot = useScheduleSnapshot()
  const selectedComponentId = useCanvasStore(
    (state) => state.selectedComponentId
  )
  const selectComponent = useCanvasStore((state) => state.selectComponent)
  const deselect = useCanvasStore((state) => state.deselect)

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg bg-white px-4 py-2 text-sm text-slate-500 shadow">
          Preparing canvas…
        </div>
      </div>
    )
  }

  const { theme, components, schedule } = snapshot
  const background = createBackground(theme)
  const textColor = resolveThemeColor(theme, 'text', '#0f172a')
  const bodyFont = resolveThemeFont(theme, 'body', 'Inter, sans-serif')
  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ?? null

  return (
    <div
      id="capture-root"
      className={clsx(
        'relative h-[1080px] w-[1920px] overflow-hidden rounded-3xl border border-white/20 shadow-2xl'
      )}
      style={{
        background,
        color: textColor,
        fontFamily: bodyFont,
      }}
      onClick={() => deselect()}
    >
      <div className="absolute inset-0">
        {components.map((component) => {
          const renderer = componentRegistry[component.kind]
          if (!renderer || !component.id) return null

          return (
            <CanvasComponentFrame
              key={component.id}
              component={component}
              selected={component.id === selectedComponentId}
              onSelect={() => selectComponent(component.id!)}
            >
              {renderer({ component, theme, schedule, snapshot })}
            </CanvasComponentFrame>
          )
        })}
      </div>

      {selectedComponent && (
        <SelectionEditorOverlay
          component={selectedComponent}
          theme={theme}
          snapshot={snapshot}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      )}

      <NoiseOverlay opacity={0.05} radius={32} />
    </div>
  )
}

function createBackground(theme: Theme) {
  const base = resolveThemeColor(theme, 'background', '#f4f8ff')
  const accent = resolveThemeColor(theme, 'primary', '#d0e4ff')
  const secondary = resolveThemeColor(theme, 'secondary', '#f9d8ff')
  return `radial-gradient(1200px 800px at 20% 0%, ${accent}, transparent 60%), radial-gradient(900px 700px at 90% 20%, ${secondary}, transparent 55%), ${base}`
}
