import type { ColorSwatchProps } from './ColorSwatch'
import { ColorSwatch } from './ColorSwatch'

export type ColorPaletteProps = {
  title?: string
  colors: Array<Omit<ColorSwatchProps, 'onSelect'>>
  onSelect?: (value: string) => void
  activeColor?: string | null
}

export function ColorPalette({
  title = 'Theme colors',
  colors,
  onSelect,
  activeColor,
}: ColorPaletteProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="grid gap-2">
        {colors.map((color) => (
          <ColorSwatch
            key={color.label}
            {...color}
            active={activeColor === color.value || activeColor === color.label}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
