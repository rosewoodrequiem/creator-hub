import clsx from 'clsx'

export type ColorSwatchProps = {
  label: string
  value: string
  active?: boolean
  onSelect?: (value: string) => void
}

export function ColorSwatch({
  label,
  value,
  active,
  onSelect,
}: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={clsx(
        'group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition',
        active
          ? 'border-brand-accent bg-brand-secondary/40 text-brand-ink shadow-sm'
          : 'border-slate-200 hover:border-brand-accent/60 text-slate-600',
      )}
    >
      <span
        className="h-9 w-9 rounded-full border border-black/5 shadow-inner"
        style={{ backgroundColor: value }}
      />
      <div className="flex flex-col leading-tight">
        <span>{label}</span>
        <span className="text-xs text-slate-500">{value}</span>
      </div>
    </button>
  )
}
