import { useScheduleStore } from "../../store/useScheduleStore"
import type { DayKey } from "../../types"
import {
  DAY_LABELS,
  fmtTime,
  fmtZone,
  shortMonthDay,
  weekDates,
} from "../../utils/date"
import NoiseOverlay from "../../canvas/components/NoiseOverlay"
import { DayCard } from "./DayCard"
import GlowingBox from "./GlowBox"

export default function ElegantBlue({
  captureId = "capture-root",
}: {
  captureId?: string
}) {
  const week = useScheduleStore((s) => s.week)
  const heroUrl = useScheduleStore((s) => s.heroUrl)

  const dayOrder: DayKey[] =
    week.weekStart === "sun"
      ? ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
      : ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  const dates = weekDates(week.weekAnchorDate, week.weekStart)
  const enabledKeys = dayOrder.filter((k) => week.days[k].enabled)
  const heroAuto = enabledKeys.find((k) => week.days[k].graphicUrl) || null
  const hero =
    heroUrl ?? (heroAuto ? week.days[heroAuto].graphicUrl : undefined)

  return (
    <div className="elegant-blue-theme">
      <div
        id={captureId}
        className="elegant-blue-theme bg-base text-text font-heading relative overflow-hidden rounded-2xl border shadow-2xl"
        style={{ width: 1920, height: 1080 }}
      >
        {/* decorative soft highlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1000px 600px at 20% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)",
          }}
        />

        {/* LEFT: header + cards (put above hero via z-index) */}
        <div className="relative z-20 h-full text-2xl">
          {/* week badge */}
          <div className="absolute top-8 left-8" style={{ maxWidth: "130px" }}>
            <div className="bg-primary rounded-xl px-4 py-3 font-semibold backdrop-blur-sm">
              {shortMonthDay(dates[0])} – {shortMonthDay(dates[6])}
            </div>
          </div>

          {/* big title */}
          <div className="font-heading text-primary text-shadow-[var(--text-glow)] absolute top-8 left-52 text-[120px] leading-none font-extrabold select-none">
            Schedule
          </div>

          {/* day cards column */}
          <div className="absolute top-44 right-[50%] bottom-16 left-8 flex flex-col gap-18 pr-6">
            {enabledKeys.length === 0 && (
              <div className="text-sm opacity-70">No days selected</div>
            )}

            {enabledKeys.map((key) => {
              const plan = week.days[key]
              const idx = dayOrder.indexOf(key)
              const date = dates[idx]
              const when = plan.time
                ? fmtTime(date, plan.time, plan.timezone)
                : "Time TBD"
              const zone = fmtZone(date, plan.timezone)
              const formattedDate = shortMonthDay(date)
              return (
                <DayCard
                  key={key}
                  day={DAY_LABELS[key]}
                  gameName={plan.gameName}
                  when={when}
                  date={formattedDate}
                  zone={zone}
                  logoUrl={plan.logoUrl}
                  graphicUrl={plan.graphicUrl}
                />
              )
            })}
          </div>
        </div>

        {/* RIGHT: hero image (kept underneath cards) */}
        <div className="absolute inset-y-0 right-0 z-10 w-[48%]">
          {hero ? (
            <img
              src={hero}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 bg-[#6b87aa]" />
          )}
          <div
            className="absolute inset-0 hidden"
            style={{
              background:
                "linear-gradient(90deg, rgba(144,164,191,0) 0%, rgba(144,164,191,0.65) 55%, rgba(144,164,191,0.85) 72%, rgba(144,164,191,0.95) 88%, rgba(144,164,191,1) 100%)",
            }}
          />
          <NoiseOverlay opacity={0.05} />
        </div>

        {/* subtle canvas-wide noise */}
        <NoiseOverlay opacity={0.025} zIndex={5} radius={24} />

        {/* footer */}
        <div className="absolute bottom-6 left-8 z-20 text-sm text-[#1e2a3a] opacity-80">
          @evermoreradio · @EvermoreRadio
        </div>
      </div>
    </div>
  )
}
