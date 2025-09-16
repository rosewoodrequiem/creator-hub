import React from "react"
import type { DayPlan } from "../../types"

const TZ_OPTIONS = [
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "UTC",
]

type Props = {
  open: boolean
  onClose: () => void
  plan: DayPlan
  onChange: (next: DayPlan) => void
  title: string // e.g., "Edit Tuesday"
}

export default function DayEditor({
  open,
  onClose,
  plan,
  onChange,
  title,
}: Props) {
  if (!open) return null

  function onFile(
    e: React.ChangeEvent<HTMLInputElement>,
    key: "logoUrl" | "graphicUrl",
  ) {
    const f = e.target.files?.[0]
    if (!f) return onChange({ ...plan, [key]: undefined })
    const url = URL.createObjectURL(f)
    onChange({ ...plan, [key]: url })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-lg font-bold">{title}</div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1">
            Close
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            Game name
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={plan.gameName}
              onChange={(e) => onChange({ ...plan, gameName: e.target.value })}
              placeholder="e.g., Baldur’s Gate 3"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              Time
              <input
                type="time"
                className="mt-1 w-full rounded-lg border p-2"
                value={plan.time}
                onChange={(e) => onChange({ ...plan, time: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Timezone
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={plan.timezone}
                onChange={(e) =>
                  onChange({ ...plan, timezone: e.target.value })
                }
              >
                {TZ_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold">Game logo</div>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full"
                onChange={(e) => onFile(e, "logoUrl")}
              />
              {plan.logoUrl && (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  <img
                    src={plan.logoUrl}
                    alt="Logo preview"
                    className="h-28 w-full bg-white object-contain"
                  />
                  <button
                    className="w-full border-t py-1 text-xs"
                    onClick={() => onChange({ ...plan, logoUrl: undefined })}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-semibold">Game graphic</div>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full"
                onChange={(e) => onFile(e, "graphicUrl")}
              />
              {plan.graphicUrl && (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  <img
                    src={plan.graphicUrl}
                    alt="Graphic preview"
                    className="h-28 w-full object-cover"
                  />
                  <button
                    className="w-full border-t py-1 text-xs"
                    onClick={() => onChange({ ...plan, graphicUrl: undefined })}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-[--color-muted,#94a3b8]">
            Tip: square-ish logos look best; graphics will be cropped to fill
            the card background.
          </div>
        </div>
      </div>
    </div>
  )
}
