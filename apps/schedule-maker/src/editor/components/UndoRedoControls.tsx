import { useState } from 'react'
import { Button } from '@creator-hub/ui-kit'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import { useHistoryAvailability } from '../hooks/useHistoryAvailability'

export function UndoRedoControls() {
  const { canUndo, canRedo } = useHistoryAvailability()
  const [pending, setPending] = useState<'undo' | 'redo' | null>(null)

  const handleUndo = async () => {
    if (!canUndo || pending) return
    setPending('undo')
    try {
      await db.undo()
    } finally {
      setPending(null)
    }
  }

  const handleRedo = async () => {
    if (!canRedo || pending) return
    setPending('redo')
    try {
      await db.redo()
    } finally {
      setPending(null)
    }
  }

  const undoDisabled = !canUndo || pending === 'redo'
  const redoDisabled = !canRedo || pending === 'undo'

  return (
    <div className="flex items-center gap-2">
      <Button
        className="border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
        disabled={undoDisabled}
        onClick={handleUndo}
      >
        Undo
      </Button>
      <Button
        className="border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
        disabled={redoDisabled}
        onClick={handleRedo}
      >
        Redo
      </Button>
    </div>
  )
}
