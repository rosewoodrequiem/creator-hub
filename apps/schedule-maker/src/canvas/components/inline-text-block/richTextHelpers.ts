import type { Dispatch, SetStateAction } from 'react'
import { Descendant, Editor, Node, Text } from 'slate'

import type { InlineLeaf } from './InlineTextBlock.types'

export type InlineStyleBase = {
  fontId: string
  fontSize: number
  colorToken: string
  textTransform?: string
  letterSpacing?: string | number
}

export type InlineSelectionSummary = {
  fontSizes: number[]
  colorTokens: string[]
  fontIds: string[]
}

export function fromPlainText(text?: string): Descendant[] {
  const safe = typeof text === 'string' ? text : ''
  return [
    {
      type: 'paragraph',
      children: [{ text: safe }],
    } as Descendant,
  ]
}

export function toPlainText(value: Descendant[]) {
  return value.map((node) => Node.string(node)).join('\n')
}

export function cloneDescendants(value: Descendant[]): Descendant[] {
  return JSON.parse(JSON.stringify(value)) as Descendant[]
}

export function syncToolbarStyle<T extends InlineStyleBase>(
  editor: Editor,
  setStyleState: Dispatch<SetStateAction<T>> | undefined,
  base: T,
  setSummary?: Dispatch<SetStateAction<InlineSelectionSummary>>,
) {
  const selection = editor.selection
  if (!selection) return
  const fontSizes = new Set<number>([base.fontSize])
  const fontIds = new Set<string>([base.fontId])
  const colorTokens = new Set<string>([base.colorToken])

  const addLeaf = (leaf: Partial<InlineLeaf>) => {
    const size = leaf.fontSize ?? base.fontSize
    const font = leaf.fontId ?? base.fontId
    const color =
      leaf.colorToken ?? (leaf as InlineLeaf).colorValue ?? base.colorToken
    if (size) fontSizes.add(size)
    if (font) fontIds.add(font)
    if (color) colorTokens.add(color)
  }

  const marks = Editor.marks(editor) as Partial<InlineLeaf> | null
  if (marks && Object.keys(marks).length > 0) addLeaf(marks)

  for (const [node] of Editor.nodes(editor, {
    at: selection,
    match: Text.isText,
  })) {
    addLeaf(node as InlineLeaf)
  }

  if (setStyleState) {
    setStyleState((prev) => ({
      ...prev,
      fontSize:
        fontSizes.size === 1 ? Array.from(fontSizes)[0] : prev.fontSize ?? base.fontSize,
      fontId:
        fontIds.size === 1 ? Array.from(fontIds)[0] : prev.fontId ?? base.fontId,
      colorToken:
        colorTokens.size === 1
          ? Array.from(colorTokens)[0]
          : prev.colorToken ?? base.colorToken,
    }))
  }

  if (setSummary) {
    setSummary({
      fontSizes: Array.from(fontSizes),
      colorTokens: Array.from(colorTokens),
      fontIds: Array.from(fontIds),
    })
  }
}

export function withLockText(editor: Editor, lock: boolean) {
  if (!lock) return editor
  const { apply } = editor
  editor.apply = (op) => {
    if (
      op.type === 'insert_text' ||
      op.type === 'remove_text' ||
      op.type === 'insert_node' ||
      op.type === 'merge_node' ||
      op.type === 'split_node'
    ) {
      return
    }
    apply(op)
  }
  return editor
}
