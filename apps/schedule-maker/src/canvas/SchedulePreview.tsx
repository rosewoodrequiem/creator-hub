import React from "react"
import { PREVIEWS } from "../previews"
import { useScheduleStore } from "../store/useScheduleStore"

export default function SchedulePreview() {
  const template = useScheduleStore((s) => s.template)
  const Comp = PREVIEWS[template].component
  // we still render with fixed capture id so the export finds it
  return <Comp captureId="capture-root" />
}
