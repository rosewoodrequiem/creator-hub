import { Node } from 'slate'
import type { Descendant } from 'slate'

export const fromPlainText = (text?: string): Descendant[] => {
  const safe = typeof text === 'string' ? text : ''
  return [
    {
      type: 'paragraph',
      children: [{ text: safe }],
    } as Descendant,
  ]
}

export const toPlainText = (value: Descendant[]) =>
  value.map((node) => Node.string(node)).join('\n')

export const cloneDescendants = (value: Descendant[]): Descendant[] =>
  JSON.parse(JSON.stringify(value)) as Descendant[]

export const serializeRichText = (value?: Descendant[] | null) =>
  JSON.stringify(value ?? null)
