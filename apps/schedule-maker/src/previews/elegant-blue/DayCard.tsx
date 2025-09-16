interface DayCardProps {
  day: string
  when: string
  date: string
  zone: string
  gameName: string
  graphicUrl?: string
  logoUrl?: string
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  gameName,
  when,
  date,
  zone,
  graphicUrl,
  logoUrl,
}) => {
  return (
    <div
      className="from-primary to-base relative grid h-[200px] grid-cols-[1fr_320px] items-center overflow-hidden overflow-visible rounded-2xl bg-linear-to-r to-50%"
      style={{
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.45)",
      }}
    >
      {/* Name Card */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <div className="bg-primary font-body border-secondary truncate rounded-md border px-4 py-1 text-2xl font-extrabold">
          {gameName || "Untitled Game"}
        </div>
      </div>
      {/* left content */}
      <div className="relative z-10 flex items-center gap-4 p-4 pl-6">
        {/* Date Time */}
        <div className="mt-2.5 flex min-w-0 grow flex-col items-center gap-2">
          <div className="flex min-w-0 grow items-center justify-center gap-4 text-center">
            <div className="text-5xl opacity-80">{when.replace(",", "")}</div>
            <div className="text-4xl tracking-widest opacity-70">|{zone}</div>
          </div>
          <div className="text-5xl opacity-80">{date}</div>
        </div>
      </div>

      {/* right banner */}
      <div className="relative h-full rounded-r-lg border border-transparent">
        {graphicUrl && (
          <img
            src={graphicUrl}
            alt=""
            className="absolute h-full w-full rounded-r-lg object-cover"
          />
        )}
        <div className="from-base form-30% absolute inset-0 bg-gradient-to-r to-transparent" />
      </div>

      {/* Day Name */}
      <div className="via-primary/50 to-base absolute bottom-0 left-12 translate-y-1/2 bg-gradient-to-b from-transparent from-5% via-20% to-90% px-3 py-1 text-2xl font-extrabold tracking-widest backdrop-blur-md">
        <div className="text-4xl tracking-widest uppercase">
          {day.substring(0, 3)}
        </div>
      </div>
    </div>
  )
}
