import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'

const FALLBACK = { canUndo: false, canRedo: false }

export function useHistoryAvailability() {
  return (
    useLiveQuery(async () => {
      const [canUndo, canRedo] = await Promise.all([db.canUndo(), db.canRedo()])
      return { canUndo, canRedo }
    }, []) ?? FALLBACK
  )
}
