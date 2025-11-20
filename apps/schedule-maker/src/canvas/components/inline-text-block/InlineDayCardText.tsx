import type { Descendant } from 'slate'

import type { Theme } from '../../../store/schedule-maker-db/SheduleMakerDB.types'
import { InlineRichText, InlineRichTextStyle } from './InlineRichText'

export type InlineDayCardAction = {
  label: string
  onClick: (
    style: InlineRichTextStyle,
    content: Descendant[],
    text: string,
  ) => Promise<void> | void
}

export type InlineDayCardStyle = InlineRichTextStyle

type Props = {
  kind: 'title' | 'day-label'
  theme: Theme
  value?: Descendant[]
  text: string
  baseStyle: InlineDayCardStyle
  lockText?: boolean
  actions?: InlineDayCardAction[]
  onChange: (payload: {
    content: Descendant[]
    text: string
    style: InlineDayCardStyle
  }) => Promise<void> | void
}

export function InlineDayCardText({
  theme,
  value,
  text,
  baseStyle,
  lockText = false,
  actions = [],
  onChange,
}: Props) {
  return (
    <InlineRichText
      theme={theme}
      value={value}
      text={text}
      baseStyle={baseStyle}
      lockText={lockText}
      actions={actions}
      onChange={onChange}
    />
  )
}
