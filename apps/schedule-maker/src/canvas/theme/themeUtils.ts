import type { Theme } from '../../store/schedule-maker-db/SheduleMakerDB.types'

export function resolveThemeColor(
  theme: Theme,
  token?: string | null,
  fallback = '#ffffff',
) {
  if (!token) return fallback
  return theme.colors.find((color) => color.id === token)?.value ?? fallback
}

export function resolveThemeFont(
  theme: Theme,
  token?: string | null,
  fallback = 'Inter, sans-serif',
) {
  if (!token) return fallback
  return theme.fonts.find((font) => font.id === token)?.family ?? fallback
}

export function resolveThemeRadius(
  theme: Theme,
  token?: string | null,
  fallback = theme.radii.md,
) {
  if (!token) return fallback
  return theme.radii[token as keyof typeof theme.radii] ?? fallback
}
