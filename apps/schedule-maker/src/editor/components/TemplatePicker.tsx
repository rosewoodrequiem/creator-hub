import React from "react"
import { useScheduleStore } from "../../store/useScheduleStore"

export default function TemplatePicker() {
  const template = useScheduleStore((s) => s.template)
  const setTemplate = useScheduleStore((s) => s.setTemplate)

  return (
    <label className="block text-xs">
      Preview style
      <select
        className="ml-2 rounded-lg border px-2 py-1"
        value={template}
        onChange={(e) => setTemplate(e.target.value as any)}
      >
        <option value="ElegantBlue">Elegant Blue</option>
        {/* add more options as you create new previews */}
      </select>
    </label>
  )
}
