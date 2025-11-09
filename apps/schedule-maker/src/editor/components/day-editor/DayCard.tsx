import React, { useState } from "react"

type DayCardProps = {
  day: string
  events: string[]
}

const DayCard: React.FC<DayCardProps> = ({ day, events }) => {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{day}</span>
        <span className="text-gray-500">{open ? "▼" : "▶"}</span>
      </div>
      {open && (
        <div className="px-3 pb-2">
          {events.map((event, i) => (
            <div
              key={i}
              className="border-b py-1 text-sm text-gray-700 last:border-none"
            >
              {event}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DayCard
