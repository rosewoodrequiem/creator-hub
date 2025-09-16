import React from "react"
import type { DayPlan, DayKey } from "../../types"
import { DAY_LABELS, fmtTime, shortMonthDay } from "../../utils/date"
import Button from "../ui/Button"
import DayInlineEditor from "./DayInlineEditor"

type Props = {
  dayKey: DayKey
  date: Date
  plan: DayPlan
  onChange: (next: DayPlan) => void
  onDisable: () => void
}

export default function DayAccordion({
  dayKey,
  date,
  plan,
  onChange,
  onDisable,
}: Props) {
  const [open, setOpen] = React.useState(true)

  const when = plan.time ? fmtTime(date, plan.time, plan.timezone) : "Set time…"

  return (
    <div className="rounded-2xl border">
      {/* Header row (toggle) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between rounded-t-2xl px-3 py-2 hover:bg-[#f3f4f6]"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-gray-500">{open ? "▾" : "▸"}</span>
          <div className="text-sm font-semibold">
            {DAY_LABELS[dayKey]} — {shortMonthDay(date)}
          </div>
        </div>
        <div className="max-w-[60%] truncate text-xs text-[#64748b]">
          {plan.gameName ? `${plan.gameName} · ${when}` : when}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="p-3 pt-0">
          <div className="flex justify-end">
            <Button
              className="border bg-white text-xs hover:bg-[#f3f4f6]"
              onClick={onDisable}
            >
              Hide this day
            </Button>
          </div>
          <div className="pt-2">
            <DayInlineEditor plan={plan} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  )
}
