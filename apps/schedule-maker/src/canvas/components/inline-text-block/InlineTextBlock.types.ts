import { BaseText } from 'slate'

export type InlineLeafStyle = {
  fontSize?: number
  fontId?: string
  colorToken?: string
  colorValue?: string
}

export type InlineLeaf = BaseText & InlineLeafStyle
