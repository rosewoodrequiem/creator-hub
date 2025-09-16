import React from "react"

type Props = {
  data: ScheduleData
  /** Attach this ref to the outermost capture node */
  captureRef?: React.Ref<HTMLDivElement>
}

export default function ScheduleCard({ data, captureRef }: Props) {
  const { w, h } = data.size

  return (
    <div
      id="capture-root"
      ref={captureRef}
      style={{ width: w, height: h, background: data.theme.bg }}
      className="relative inline-block ring-1 shadow-xl ring-black/5"
    >
      {/* Accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: data.theme.accent }}
      />

      {/* Header */}
      <div className="p-16 text-white">
        <h2 className="text-5xl font-extrabold tracking-tight">{data.title}</h2>
        <div className="mt-2 text-xl text-slate-300">{data.dateRange}</div>
      </div>

      {/* Columns */}
      <div className="px-16">
        <div className="mb-2 text-sm tracking-wide text-slate-400 uppercase">
          Schedule
        </div>
        <div className="grid grid-cols-[300px_1fr] gap-6">
          <div className="text-slate-400">Time</div>
          <div className="text-slate-400">Event</div>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3 px-16 pt-2">
        {data.rows.slice(0, 12).map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[300px_1fr] items-center gap-6"
          >
            <div
              className="rounded-xl px-4 py-3 text-white"
              style={{ background: data.theme.card }}
            >
              {r.time}
            </div>
            <div
              className="rounded-xl px-4 py-3 text-slate-100"
              style={{ background: data.theme.card }}
            >
              {r.event}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-16 text-sm text-slate-500">
        Made with Schedule Maker
      </div>
    </div>
  )
}
