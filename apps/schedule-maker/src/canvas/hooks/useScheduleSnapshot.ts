import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type { ScheduleSnapshot } from '../../store/schedule-maker-db/SheduleMakerDB.types'

export function useScheduleSnapshot() {
  return useLiveQuery<ScheduleSnapshot | null>(() => db.getScheduleSnapshot())
}
