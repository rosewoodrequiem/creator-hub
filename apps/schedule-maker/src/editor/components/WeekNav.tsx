// components/WeekNav.tsx
import { useConfig } from "../../store/useConfig"

export function WeekNav() {
  const { nextWeek, prevWeek, weekOffset } = useConfig()

  return (
    <div className="flex items-center justify-between gap-2 p-2">
      <button
        onClick={prevWeek}
        className="cursor-pointer rounded bg-gray-700 px-3 py-1 hover:bg-gray-600"
      >
        ← Prev Week
      </button>
      <span className="text-sm font-medium">Week {weekOffset}</span>
      <button
        onClick={nextWeek}
        className="cursor-pointer rounded bg-gray-700 px-3 py-1 hover:bg-gray-600"
      >
        Next Week →
      </button>
    </div>
  )
}
