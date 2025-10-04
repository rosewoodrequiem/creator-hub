import WeekPicker from './editor/components/WeekPicker'
import SchedulePreview from './canvas/SchedulePreview'
import TemplatePicker from './editor/components/TemplatePicker'
import ScaledPreview from './canvas/ScaledPreview'
import Button from './editor/ui/Button'
import * as htmlToImage from 'html-to-image'
import { useConfig } from './store/useConfig'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './store/schedule-maker-db/ScheduleMakerDB'
import { Day } from './types/Day'
import { DayChecklist } from './editor/components/day-editor/DayChecklist'
import { DayEditor } from './editor/components/day-editor/DayEditor'
import { ScheduleData } from './store/api/ScheduleData'

function App() {
  const weekStart = useLiveQuery(() => db.weekStart)
  const exportScale = useConfig((s) => s.exportScale)
  const setExportScale = useConfig((s) => s.setExportScale)
  const setHeroUrl = useConfig((s) => s.setHeroUrl)

  const handleUploadHero = async (file: File) => {
    const scheuldeData = await ScheduleData()
    scheuldeData?.setHeroUrl(file)
  }

  const dayOrder: Day[] =
    weekStart === Day.SUN.toLowerCase()
      ? [Day.SUN, Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT]
      : [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT, Day.SUN]

  async function handleExport() {
    const src = document.getElementById('capture-root')
    if (!src) return

    // Ensure fonts are ready
    // @ts-ignore
    if (document.fonts?.ready) await document.fonts.ready

    try {
      const pixelRatio = Math.max(window.devicePixelRatio || 1, 2)
      const dataUrl = await htmlToImage.toPng(src, {
        pixelRatio: Math.min(4, pixelRatio * 2), // 3–4 looks great
        cacheBust: true,
        style: { imageRendering: '' },
        // If you need to omit debug elements, you can filter nodes:
        // filter: (node) => !node.classList?.contains('no-export'),
        // You can also override styles for export only:
        // style: { imageRendering: "auto" },
      })

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'schedule.png'
      a.click()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export schedule.')
    }
  }

  // No need for useEffect to sync stores anymore since we're using a single store

  return (
    <div className="grid h-full md:grid-cols-[460px_1fr]">
      {/* LEFT: Controls (scrollable) */}
      <aside className="sidebar-scroll space-y-4 border-r bg-white p-4">
        <div className="sticky top-0 flex items-center justify-between bg-white pb-2">
          <div className="text-lg font-bold">Schedule Maker</div>
          <Button
            onClick={handleExport}
            className="bg-[#111827] text-white"
            hoverClass="hover:bg-black"
          >
            Export PNG
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <TemplatePicker />
          <label className="block text-xs">
            Export scale (1–4)
            <input
              type="number"
              min={1}
              max={4}
              value={exportScale}
              onChange={(e) => setExportScale(Number(e.target.value))}
              className="ml-2 w-20 rounded-lg border px-2 py-1"
            />
          </label>
        </div>

        <WeekPicker />

        {/* Day checklist chips */}
        <DayChecklist days={dayOrder} />

        <DayEditor days={dayOrder} />

        {/* Hero image override */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Hero image (optional)</div>
          <div className="flex items-center gap-3">
            <Button
              className="bg-[--color-brand] text-black"
              hoverClass="hover:brightness-105"
              onClick={() =>
                document.getElementById('hero-file-input')?.click()
              }
            >
              Select hero image
            </Button>
            <input
              id="hero-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                handleUploadHero(f!)
              }}
            />
            <Button
              className="border bg-white hover:bg-[#f3f4f6]"
              onClick={() => setHeroUrl(undefined)}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Collapsible day cards for enabled days */}
      </aside>

      {/* RIGHT: Preview (no scroll; scaled to fit) */}
      <main className="overflow-hidden bg-[#f8fafc] p-4">
        <ScaledPreview targetWidth={1920} targetHeight={1080} margin={16}>
          <SchedulePreview />
        </ScaledPreview>
      </main>
    </div>
  )
}

export default () => {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Note: This is just in case you want to take into account manual rehydration.
    // You can remove the following line if you don't need it.
    const unsubHydrate = useConfig.persist.onHydrate(() => setHydrated(false))

    const unsubFinishHydration = useConfig.persist.onFinishHydration(() =>
      setHydrated(true),
    )

    setHydrated(useConfig.persist.hasHydrated())

    return () => {
      unsubHydrate()
      unsubFinishHydration()
    }
  }, [])

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse rounded bg-gray-200 p-4 text-gray-400">
          Loading…
        </div>
      </div>
    )
  }

  return <App />
}
