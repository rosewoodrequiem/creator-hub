import {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { type Descendant, Element as SlateElement, Text } from 'slate'

import { db } from '../../../store/schedule-maker-db/ScheduleMakerDB'
import type {
  ScheduleComponentWithProps,
  Theme,
} from '../../../store/schedule-maker-db/SheduleMakerDB.types'
import { useCanvasStore } from '../../state/useCanvasStore'
import { resolveThemeColor, resolveThemeFont } from '../../theme/themeUtils'
import { Leaf, type LeafComponentProps } from './Leaf'
import type { InlineLeaf } from './InlineTextBlock.types'
import { InlineRichText, type InlineRichTextStyle } from './InlineRichText'
import { cloneDescendants, fromPlainText } from './richTextHelpers'

type InlineTextBlockProps = {
  component: ScheduleComponentWithProps<'text'>
  theme: Theme
}

export function InlineTextBlock({ component, theme }: InlineTextBlockProps) {
  const selectedComponentId = useCanvasStore(
    (state) => state.selectedComponentId,
  )
  const selectComponent = useCanvasStore((state) => state.selectComponent)

  const isSelected = selectedComponentId === component.id
  const initialValue = useMemo(
    () =>
      cloneDescendants(
        component.props.richText ?? fromPlainText(component.props.text),
      ),
    [component.props.richText, component.props.text],
  )

  const [draftValue, setDraftValue] = useState<Descendant[]>(initialValue)
  const [draftText, setDraftText] = useState<string>(
    component.props.text ?? '',
  )
  const [draftStyle, setDraftStyle] = useState<InlineRichTextStyle>(() => ({
    fontSize: component.props.fontSize,
    colorToken: component.props.colorToken,
    fontId: component.props.fontId,
    letterSpacing: component.props.letterSpacing,
  }))
  const [dirty, setDirty] = useState(false)
  const lastSyncedRef = useRef({
    text: component.props.text ?? '',
    rich: JSON.stringify(component.props.richText ?? null),
  })

  useEffect(() => {
    if (dirty) return
    const nextRich = JSON.stringify(component.props.richText ?? null)
    if (
      nextRich === lastSyncedRef.current.rich &&
      (component.props.text ?? '') === lastSyncedRef.current.text
    ) {
      return
    }
    const nextValue =
      component.props.richText ?? fromPlainText(component.props.text)
    setDraftValue(cloneDescendants(nextValue))
    setDraftText(component.props.text ?? '')
    setDraftStyle({
      fontSize: component.props.fontSize,
      colorToken: component.props.colorToken,
      fontId: component.props.fontId,
      letterSpacing: component.props.letterSpacing,
    })
    lastSyncedRef.current = {
      text: component.props.text ?? '',
      rich: nextRich,
    }
  }, [
    component.props.colorToken,
    component.props.fontId,
    component.props.fontSize,
    component.props.letterSpacing,
    component.props.richText,
    component.props.text,
    dirty,
  ])

  const persist = useCallback(() => {
    if (!dirty || !component.id) return
    const nextRich = cloneDescendants(draftValue)
    const letterSpacing =
      typeof draftStyle.letterSpacing === 'string'
        ? parseFloat(draftStyle.letterSpacing)
        : draftStyle.letterSpacing
    lastSyncedRef.current = {
      text: draftText,
      rich: JSON.stringify(nextRich),
    }
    void db.updateComponentProps(component.id, 'text', {
      text: draftText,
      richText: nextRich,
      fontSize: draftStyle.fontSize,
      colorToken: draftStyle.colorToken,
      fontId: draftStyle.fontId,
      letterSpacing,
    })
    setDirty(false)
  }, [component.id, dirty, draftStyle, draftText, draftValue])

  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => persist(), 300)
    return () => clearTimeout(timer)
  }, [dirty, persist])

  const handleChange = useCallback(
    (payload: {
      content: Descendant[]
      text: string
      style: InlineRichTextStyle
    }) => {
      setDraftValue(cloneDescendants(payload.content))
      setDraftText(payload.text)
      setDraftStyle(payload.style)
      setDirty(true)
    },
    [],
  )

  const fontFamily = resolveThemeFont(
    theme,
    draftStyle.fontId,
    'Poppins, sans-serif',
  )
  const color = resolveThemeColor(theme, draftStyle.colorToken, '#0f172a')
  const alignment =
    component.props.align === 'center'
      ? 'center'
      : component.props.align === 'right'
        ? 'flex-end'
        : 'flex-start'

  if (!isSelected) {
    return (
      <div
        className="flex h-full w-full cursor-text select-none items-center"
        style={{
          fontFamily,
          fontSize: draftStyle.fontSize,
          color,
          textAlign: component.props.align,
          letterSpacing:
            component.props.letterSpacing ?? draftStyle.letterSpacing ?? 0,
          lineHeight: component.props.lineHeight ?? 1.05,
          justifyContent: alignment,
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (component.id) selectComponent(component.id)
        }}
      >
        {draftText ? (
          <RichTextPreview
            value={draftValue}
            theme={theme}
            baseStyle={draftStyle}
          />
        ) : (
          <span>Click to edit text</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: alignment,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <InlineRichText
        theme={theme}
        value={draftValue}
        text={draftText}
        baseStyle={draftStyle}
        textAlign={component.props.align}
        lineHeight={component.props.lineHeight ?? 1.05}
        onChange={handleChange}
      />
    </div>
  )
}

function RichTextPreview({
  value,
  theme,
  baseStyle,
}: {
  value: Descendant[]
  theme: Theme
  baseStyle: LeafComponentProps['baseStyle']
}) {
  return (
    <>
      {value.map((node, index) => (
        <RichNode key={index} node={node} theme={theme} baseStyle={baseStyle} />
      ))}
    </>
  )
}

function RichNode({
  node,
  theme,
  baseStyle,
}: {
  node: Descendant
  theme: Theme
  baseStyle: LeafComponentProps['baseStyle']
}): JSX.Element | null {
  if (Text.isText(node)) {
    const previewAttributes = { 'data-slate-leaf': true as const }
    return (
      <Leaf
        attributes={previewAttributes}
        leaf={node as InlineLeaf}
        theme={theme}
        baseStyle={baseStyle}
        text={node}
      >
        {node.text}
      </Leaf>
    )
  }

  if (SlateElement.isElement(node)) {
    const children = node.children.map((child, index) => (
      <RichNode key={index} node={child} theme={theme} baseStyle={baseStyle} />
    ))
    return <span className="whitespace-pre-wrap">{children}</span>
  }

  return null
}
