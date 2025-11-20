import { Theme } from 'apps/schedule-maker/src/store/schedule-maker-db/SheduleMakerDB.types'
import { RenderLeafProps } from 'slate-react'

import { resolveThemeColor, resolveThemeFont } from '../../theme/themeUtils'
import { InlineLeaf } from './InlineTextBlock.types'

export type LeafComponentProps = RenderLeafProps & {
  theme: Theme
  baseStyle: {
    fontSize: number
    colorToken: string
    fontId: string
  }
}

export function Leaf({
  attributes,
  children,
  leaf,
  theme,
  baseStyle,
}: LeafComponentProps) {
  const inlineLeaf = leaf as InlineLeaf
  const resolvedFontId =
    (inlineLeaf.fontId as string | undefined) ?? baseStyle.fontId
  const resolvedFontSize =
    (inlineLeaf.fontSize as number | undefined) ?? baseStyle.fontSize
  const colorToken =
    (inlineLeaf.colorToken as string | undefined) ?? baseStyle.colorToken
  const colorValue = inlineLeaf.colorValue as string | undefined
  const fontFamily = resolveThemeFont(
    theme,
    resolvedFontId,
    'Poppins, sans-serif',
  )
  const color = colorValue
    ? colorValue
    : resolveThemeColor(theme, colorToken, '#0f172a')

  return (
    <span
      {...attributes}
      className="whitespace-pre-wrap"
      style={{ fontFamily, fontSize: resolvedFontSize, color }}
    >
      {children}
    </span>
  )
}
