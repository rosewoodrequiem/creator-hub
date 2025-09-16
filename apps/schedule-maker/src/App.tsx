import { useEffect } from "react"
import type { DayKey } from "./types"
import WeekPicker from "./editor/components/WeekPicker"
import SchedulePreview from "./canvas/SchedulePreview"
import TemplatePicker from "./editor/components/TemplatePicker"
import ScaledPreview from "./canvas/ScaledPreview"
import Button from "./editor/ui/Button"
import DayAccordion from "./editor/components/DayAccordion"
import * as htmlToImage from "html-to-image"
import { SHORTS } from "./constants"
import { useScheduleStore } from "./store/useScheduleStore"
import { useConfig } from "./store/useConfig"

export default function App() {
  const week = useConfig((s) => s.week)
  const heroUrl = useConfig((s) => s.heroUrl)
  const exportScale = useConfig((s) => s.exportScale)
  const setExportScale = useConfig((s) => s.setExportScale)
  const setHeroUrl = useConfig((s) => s.setHeroUrl)
  const updateDay = useScheduleStore((s) => s.updateDay)
  const setDay = useScheduleStore((s) => s.setDay)
  const updateWeek = useScheduleStore((s) => s.updateWeek)
  const setStoreHeroUrl = useScheduleStore((s) => s.setHeroUrl)

  const dayOrder: DayKey[] =
    week.weekStart === "sun"
      ? ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
      : ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  async function handleExport() {
    const src = document.getElementById("capture-root")
    if (!src) return

    // Ensure fonts are ready
    // @ts-ignore
    if (document.fonts?.ready) await document.fonts.ready

    try {
      const pixelRatio = Math.max(window.devicePixelRatio || 1, 2)
      const dataUrl = await htmlToImage.toPng(src, {
        pixelRatio: Math.min(4, pixelRatio * 2), // 3–4 looks great
        cacheBust: true,
        style: { imageRendering: "" },
        // If you need to omit debug elements, you can filter nodes:
        // filter: (node) => !node.classList?.contains('no-export'),
        // You can also override styles for export only:
        // style: { imageRendering: "auto" },
      })

      const a = document.createElement("a")
      a.href = dataUrl
      a.download = "schedule.png"
      a.click()
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export schedule.")
    }
  }

  useEffect(() => {
    updateWeek(week)
    console.log("App useEffect updateWeek", heroUrl)
    setStoreHeroUrl(heroUrl)
  }, [week, updateWeek])

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
        <div className="space-y-2">
          <div className="text-sm font-semibold">Streaming days</div>
          <div className="flex flex-wrap gap-2">
            {dayOrder.map((key) => {
              const enabled = week.days[key].enabled
              return (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 select-none ${enabled
                    ? "bg-[--color-brand] text-black"
                    : "bg-white text-black"
                    } hover:brightness-105`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={enabled}
                    onChange={(e) =>
                      updateDay(key, { enabled: e.target.checked })
                    }
                  />
                  <span className="text-sm">{SHORTS[key]}</span>
                </label>
              )
            })}
          </div>
          <div className="text-xs text-[--color-muted,#64748b]">
            Check days you’re streaming, then expand any day to edit details.
          </div>
        </div>

        {/* Hero image override */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Hero image (optional)</div>
          <div className="flex items-center gap-3">
            <Button
              className="bg-[--color-brand] text-black"
              hoverClass="hover:brightness-105"
              onClick={() =>
                document.getElementById("hero-file-input")?.click()
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
                if (!f) return setHeroUrl(undefined)

                // Convert the file to a base64 string instead of using URL.createObjectURL
                const reader = new FileReader()
                reader.onload = (event) => {
                  if (event.target?.result) {
                    setHeroUrl(event.target.result as string)
                  }
                }
                reader.readAsDataURL(f)
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
        <div className="space-y-3 pt-2 pb-8">
          {dayOrder.map((key) => {
            const plan = week.days[key]
            if (!plan.enabled) return null

            // derive the date for this key from the current week order
            // NOTE: WeekPicker controls the anchor date; previews use weekDates internally.
            // For sidebar cards we only need the weekday label; using today's mapping is fine.
            // If you want exact date mapping here too, lift the weekDates calc into store and pass in.
            const anchor = new Date(week.weekAnchorDate)
            const startIdx = week.weekStart === "sun" ? 0 : 1
            const diffFromStart =
              (
                ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as DayKey[]
              ).indexOf(key) - startIdx
            const date = new Date(anchor)
            date.setDate(anchor.getDate() + diffFromStart)

            return (
              <DayAccordion
                key={key}
                dayKey={key}
                date={date}
                plan={plan}
                onChange={(next) => setDay(key, next)}
                onDisable={() => updateDay(key, { enabled: false })}
              />
            )
          })}
        </div>
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
