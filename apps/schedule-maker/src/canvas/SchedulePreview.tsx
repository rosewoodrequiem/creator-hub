import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PREVIEWS } from '../previews'
import { db } from '../store/schedule-maker-db/ScheduleMakerDB'

export default function SchedulePreview() {
  const template = useLiveQuery(() => db.currentTemplate) ?? 'ElegantBlue'
  const Comp = PREVIEWS[template].component
  // we still render with fixed capture id so the export finds it
  return <Comp captureId="capture-root" />
}
