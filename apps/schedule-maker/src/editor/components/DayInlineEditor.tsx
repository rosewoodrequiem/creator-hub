import React from "react"
import type { DayPlan } from "../../types"
import Button from "../ui/Button"
import FilePicker from "../ui/FilePicker"

type Props = { plan: DayPlan; onChange: (next: DayPlan) => void }

export default function DayInlineEditor({ plan, onChange }: Props) {
  function setFile(key: "logoUrl" | "graphicUrl", file?: File) {
    if (!file) return onChange({ ...plan, [key]: undefined })

    // Convert file to base64 data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange({ ...plan, [key]: event.target.result as string })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid gap-3">
      <label className="block text-sm">
        Game name
        <input
          className="mt-1 w-full rounded-lg border p-2"
          value={plan.gameName}
          onChange={(e) => onChange({ ...plan, gameName: e.target.value })}
          placeholder="e.g., Baldur’s Gate 3"
        />
      </label>

      <label className="text-sm">
        Time
        <input
          type="time"
          className="mt-1 w-full rounded-lg border p-2"
          value={plan.time}
          onChange={(e) => onChange({ ...plan, time: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Logo */}
        <div className="space-y-2">
          <FilePicker
            label="Game logo"
            onFile={(file) => setFile("logoUrl", file)}
          />
          {plan.logoUrl && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={plan.logoUrl}
                alt="Logo preview"
                className="h-28 w-full bg-white object-contain"
              />
              <Button
                className="w-full border bg-white text-xs hover:bg-[#f3f4f6]"
                onClick={() => onChange({ ...plan, logoUrl: undefined })}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Graphic */}
        <div className="space-y-2">
          <FilePicker
            label="Game graphic"
            onFile={(file) => setFile("graphicUrl", file)}
          />
          {plan.graphicUrl && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={plan.graphicUrl}
                alt="Graphic preview"
                className="h-28 w-full object-cover"
              />
              <Button
                className="w-full border bg-white text-xs hover:bg-[#f3f4f6]"
                onClick={() => onChange({ ...plan, graphicUrl: undefined })}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-[--color-muted,#64748b]">
        Tip: square logos look best. Graphics are cropped to fill the preview
        card.
      </div>
    </div>
  )
}
