import { useState } from 'react'

import { Day } from '../../../types/Day'
import { ScheduleDayPlan } from '../../../types/SheduleDayPlan'
import { DAY_LABELS, fmtTime, shortMonthDay } from '../../../utils/date'
import Button from '../../ui/Button'

import DayInlineEditor from './DayInlineEditor'

type Props = {
  dayKey: Day
  date: Date | null
  plan: ScheduleDayPlan
  timezone?: string
  onChange: (next: Partial<ScheduleDayPlan>) => void
  onGrapicChange: (file?: File) => void
  onDisable: () => void
}

export default function DayAccordion({
  dayKey,
  date,
  plan,
  timezone,
  onChange,
  onGrapicChange,
  onDisable,
}: Props) {
  const [open, setOpen] = useState(true)

  const when =
    plan.time && date ? fmtTime(date, plan.time, timezone) : 'Set time…'

  return (
    <div className="rounded-2xl border">
      {/* Header row (toggle) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between rounded-t-2xl px-3 py-2 hover:bg-[#f3f4f6]"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-gray-500">{open ? '▾' : '▸'}</span>
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
            <DayInlineEditor
              plan={plan}
              onChange={onChange}
              onGrapicChange={onGrapicChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
