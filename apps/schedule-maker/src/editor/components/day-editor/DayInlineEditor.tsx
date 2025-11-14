import { Button } from '@creator-hub/ui-kit'

import { ScheduleDayPlan } from '../../../types/SheduleDayPlan'
import FilePicker from '../../ui/FilePicker'

type Props = {
  plan: ScheduleDayPlan
  onChange: (next: Partial<ScheduleDayPlan>) => void
  onGrapicChange: (file?: File) => void
}

export default function DayInlineEditor({
  plan,
  onChange,
  onGrapicChange,
}: Props) {
  return (
    <div className="grid gap-3">
      <label className="block text-sm">
        Activity name
        <input
          className="mt-1 w-full rounded-lg border p-2"
          value={plan.gameName}
          onChange={(e) => onChange({ gameName: e.target.value })}
          placeholder="e.g., Baldur’s Gate 3"
        />
      </label>

      <label className="text-sm">
        Time
        <input
          type="time"
          className="mt-1 w-full rounded-lg border p-2"
          value={plan.time}
          onChange={(e) => onChange({ time: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Graphic */}
        <div className="space-y-2">
          <FilePicker label="Game graphic" onFile={onGrapicChange} />
          {plan.gameGraphic && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={plan.gameGraphic}
                alt="Graphic preview"
                className="h-28 w-full object-cover"
              />
              <Button
                className="w-full border bg-white text-xs hover:bg-[#f3f4f6]"
                onClick={() => onChange({ gameGraphic: undefined })}
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
