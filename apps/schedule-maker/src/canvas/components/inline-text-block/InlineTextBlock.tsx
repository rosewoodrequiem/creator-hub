import {
  JSX,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  type Descendant,
  Node,
  Range,
  Element as SlateElement,
  Text,
  Transforms,
  Editor,
  createEditor,
} from 'slate'
import { withHistory } from 'slate-history'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'

import { db } from '../../../store/schedule-maker-db/ScheduleMakerDB'
import type {
  ScheduleComponentWithProps,
  Theme,
} from '../../../store/schedule-maker-db/SheduleMakerDB.types'
import { useCanvasStore } from '../../state/useCanvasStore'
import { resolveThemeColor, resolveThemeFont } from '../../theme/themeUtils'
import { InlineLeaf, InlineLeafStyle } from './InlineTextBlock.types'
import { Leaf, LeafComponentProps } from './Leaf'

const STYLE_PRESETS = [
  {
    id: 'title',
    label: 'Title',
    fontSize: 96,
    colorToken: 'primary',
    fontId: 'heading',
  },
  {
    id: 'heading',
    label: 'Heading',
    fontSize: 64,
    colorToken: 'text',
    fontId: 'heading',
  },
  {
    id: 'body',
    label: 'Body',
    fontSize: 32,
    colorToken: 'text',
    fontId: 'body',
  },
  {
    id: 'caption',
    label: 'Caption',
    fontSize: 20,
    colorToken: 'secondary',
    fontId: 'body',
  },
]

const FONT_SIZES = [12, 16, 20, 24, 32, 48, 64]

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
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [draft, setDraft] = useState<Descendant[]>(() =>
    cloneDescendants(
      component.props.richText ?? fromPlainText(component.props.text),
    ),
  )
  const [editorKey, setEditorKey] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [activeMenu, setActiveMenu] = useState<
    'style' | 'size' | 'color' | null
  >(null)
  const [dirty, setDirty] = useState(false)
  const [styleDirty, setStyleDirty] = useState(false)
  const [displayNodes, setDisplayNodes] = useState<Descendant[]>(() =>
    cloneDescendants(
      component.props.richText ?? fromPlainText(component.props.text),
    ),
  )
  const [displayText, setDisplayText] = useState(
    () => component.props.text ?? '',
  )
  const [styleState, setStyleState] = useState(() => ({
    fontSize: component.props.fontSize,
    colorToken: component.props.colorToken,
    fontId: component.props.fontId,
  }))
  const [selectionSummary, setSelectionSummary] = useState(() => ({
    fontSizes: [component.props.fontSize],
    colorTokens: [component.props.colorToken],
    fontIds: [component.props.fontId],
    styleLabels: ['Style'],
  }))

  // Removed debug logging effects
  const wrapperRef = useRef<HTMLDivElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const toolbarPointerRef = useRef(false)
  const wasSelectedRef = useRef(isSelected)
  const autosaveTimeoutRef = useRef<number | null>(null)
  const lastSyncedTextRef = useRef(component.props.text ?? '')
  const lastSyncedRichRef = useRef(serializeRichText(component.props.richText))
  const pendingSyncRef = useRef(false)
  const [toolbarPos, setToolbarPos] = useState<{
    top: number
    left: number
  } | null>(null)

  const persistDraft = useCallback(async () => {
    if (!component.id || !dirty) return
    const nextText = toPlainText(draft)
    const serializedDraft = cloneDescendants(draft)
    const nextRichTextString = JSON.stringify(serializedDraft)
    const currentRichTextString = JSON.stringify(
      component.props.richText ?? null,
    )

    if (
      nextText !== component.props.text ||
      nextRichTextString !== currentRichTextString
    ) {
      await db.updateComponentProps(component.id, 'text', {
        text: nextText,
        richText: serializedDraft,
      })
      lastSyncedTextRef.current = nextText
      lastSyncedRichRef.current = nextRichTextString
      pendingSyncRef.current = true
    }
    setDirty(false)
  }, [
    component.id,
    component.props.text,
    component.props.richText,
    dirty,
    draft,
  ])

  const serializedRichText = useMemo(
    () => serializeRichText(component.props.richText),
    [component.props.richText],
  )

  useEffect(() => {
    if (dirty) return
    const incomingText = component.props.text ?? ''

    if (pendingSyncRef.current) {
      if (
        incomingText === lastSyncedTextRef.current &&
        serializedRichText === lastSyncedRichRef.current
      ) {
        pendingSyncRef.current = false
      }
      return
    }

    if (
      incomingText === lastSyncedTextRef.current &&
      serializedRichText === lastSyncedRichRef.current
    ) {
      return
    }
    const next = component.props.richText ?? fromPlainText(component.props.text)
    const cloned = cloneDescendants(next)
    lastSyncedTextRef.current = incomingText
    lastSyncedRichRef.current = serializedRichText
    setDraft(cloned)
    setDisplayNodes(cloned)
    setEditorKey((key) => key + 1)
    setDisplayText(toPlainText(cloned))
  }, [
    component.props.richText,
    component.props.text,
    serializedRichText,
    dirty,
  ])

  useEffect(() => {
    if (styleDirty) {
      if (
        styleState.fontSize === component.props.fontSize &&
        styleState.colorToken === component.props.colorToken &&
        styleState.fontId === component.props.fontId
      ) {
        setStyleDirty(false)
      }
      return
    }

    if (isFocused || dirty) return

    if (
      styleState.fontSize === component.props.fontSize &&
      styleState.colorToken === component.props.colorToken &&
      styleState.fontId === component.props.fontId
    ) {
      return
    }

    setStyleState({
      fontSize: component.props.fontSize,
      colorToken: component.props.colorToken,
      fontId: component.props.fontId,
    })
  }, [
    component.props.fontSize,
    component.props.colorToken,
    component.props.fontId,
    isFocused,
    dirty,
    styleDirty,
    styleState.fontSize,
    styleState.colorToken,
    styleState.fontId,
  ])

  useEffect(() => {
    if (!isSelected && dirty) {
      void persistDraft()
    } else if (isSelected && !isFocused && dirty) {
      const frame = requestAnimationFrame(() => {
        void persistDraft()
      })
      return () => cancelAnimationFrame(frame)
    }
    return
  }, [isSelected, isFocused, dirty, persistDraft])

  useEffect(() => {
    if (!dirty) {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
        autosaveTimeoutRef.current = null
      }
      return
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      autosaveTimeoutRef.current = null
      void persistDraft()
    }, 1000)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
        autosaveTimeoutRef.current = null
      }
    }
  }, [dirty, persistDraft])

  const syncToolbarStyle = useCallback(() => {
    const selection = editor.selection
    if (!selection) return

    const fontSizes = new Set<number>()
    const colorTokens = new Set<string>()
    const fontIds = new Set<string>()
    const styleLabels = new Set<string>()

    const addLeaf = (leaf: Partial<InlineLeaf>) => {
      const fontSize = leaf.fontSize ?? component.props.fontSize
      const fontId = leaf.fontId ?? component.props.fontId
      const colorToken =
        leaf.colorToken ?? leaf.colorValue ?? component.props.colorToken

      fontSizes.add(fontSize)
      colorTokens.add(colorToken)
      fontIds.add(fontId)

      const presetLabel =
        STYLE_PRESETS.find(
          (preset) =>
            preset.fontSize === fontSize &&
            preset.fontId === fontId &&
            preset.colorToken === colorToken,
        )?.label ?? 'Custom'

      styleLabels.add(presetLabel)
    }

    const marks = Editor.marks(editor) as Partial<InlineLeaf> | null
    const leaf =
      marks && Object.keys(marks).length > 0
        ? marks
        : (() => {
            try {
              const [node] = Editor.leaf(editor, selection.anchor.path)
              return node as InlineLeaf
            } catch {
              return null
            }
          })()

    if (Range.isExpanded(selection)) {
      for (const [node] of Editor.nodes(editor, {
        at: selection,
        match: Text.isText,
      })) {
        addLeaf(node as InlineLeaf)
      }
    }

    if (leaf) {
      addLeaf(leaf)
    }

    if (fontSizes.size === 0) fontSizes.add(component.props.fontSize)
    if (colorTokens.size === 0) colorTokens.add(component.props.colorToken)
    if (fontIds.size === 0) fontIds.add(component.props.fontId)
    if (styleLabels.size === 0) {
      const defaultLabel =
        STYLE_PRESETS.find(
          (preset) =>
            preset.fontSize === component.props.fontSize &&
            preset.fontId === component.props.fontId &&
            preset.colorToken === component.props.colorToken,
        )?.label ?? 'Style'
      styleLabels.add(defaultLabel)
    }

    const nextFontSizes = Array.from(fontSizes)
    const nextColorTokens = Array.from(colorTokens)
    const nextFontIds = Array.from(fontIds)
    const nextStyleLabels = Array.from(styleLabels)

    setSelectionSummary({
      fontSizes: nextFontSizes,
      colorTokens: nextColorTokens,
      fontIds: nextFontIds,
      styleLabels: nextStyleLabels,
    })

    // no-op: toolbar sync summary
  }, [
    component.props.colorToken,
    component.props.fontId,
    component.props.fontSize,
    editor,
  ])

  const handleSlateChange = useCallback((nextValue: Descendant[]) => {
    const nextText = toPlainText(nextValue)
    setDraft(nextValue)
    setDirty(true)
    setDisplayNodes(nextValue)
    setDisplayText(nextText)
    setStyleState((prev) => ({ ...prev }))
    syncToolbarStyle()
  }, [editor, syncToolbarStyle])

  const applyInlineStyle = useCallback(
    (
      style: InlineLeafStyle,
      options?: { clear?: (keyof InlineLeafStyle)[] },
    ) => {
      if (!editor.selection) {
    return false
  }
  if (!Range.isExpanded(editor.selection)) {
    return false
  }
      options?.clear?.forEach((key) => {
        Transforms.unsetNodes(editor, key as string, {
          match: Text.isText,
          split: true,
        })
      })
      Transforms.setNodes<InlineLeaf>(editor, style as Partial<InlineLeaf>, {
        match: Text.isText,
        split: true,
      })
      return true
    },
    [editor],
  )

  const applyPreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find((style) => style.id === presetId)
    if (!preset || !component.id) return

    if (
      applyInlineStyle(
        {
          fontSize: preset.fontSize,
          fontId: preset.fontId,
          colorToken: preset.colorToken,
        },
        { clear: ['colorValue'] },
      )
    ) {
      setActiveMenu(null)
      return
    }

    setStyleState({
      fontSize: preset.fontSize,
      colorToken: preset.colorToken,
      fontId: preset.fontId,
    })
    setStyleDirty(true)
    void db.updateComponentProps(component.id, 'text', {
      fontSize: preset.fontSize,
      colorToken: preset.colorToken,
      fontId: preset.fontId,
    })
    setActiveMenu(null)
  }

  const applyFontSize = (size: number) => {
    if (!component.id) return
    if (applyInlineStyle({ fontSize: size })) {
      setActiveMenu(null)
      return
    }
    setStyleState((prev) => ({ ...prev, fontSize: size }))
    setStyleDirty(true)
    void db.updateComponentProps(component.id, 'text', { fontSize: size })
    setActiveMenu(null)
  }

  const applyThemeColor = (tokenId: string) => {
    if (!component.id) return
    if (applyInlineStyle({ colorToken: tokenId }, { clear: ['colorValue'] })) {
      setActiveMenu(null)
      return
    }
    setStyleState((prev) => ({ ...prev, colorToken: tokenId }))
    setStyleDirty(true)
    void db.updateComponentProps(component.id, 'text', { colorToken: tokenId })
    setActiveMenu(null)
  }

  const applyCustomColor = (color: string) => {
    if (!component.id) return
    if (applyInlineStyle({ colorValue: color }, { clear: ['colorToken'] })) {
      setActiveMenu(null)
      return
    }
    setStyleState((prev) => ({ ...prev, colorToken: color }))
    setStyleDirty(true)
    void db.updateComponentProps(component.id, 'text', { colorToken: color })
    setActiveMenu(null)
  }

  const fontFamily = resolveThemeFont(
    theme,
    styleState.fontId,
    'Poppins, sans-serif',
  )
  const color = resolveThemeColor(theme, styleState.colorToken, '#0f172a')
  const alignment =
    component.props.align === 'center'
      ? 'center'
      : component.props.align === 'right'
        ? 'flex-end'
        : 'flex-start'

  const currentColor =
    resolveThemeColor(theme, styleState.colorToken, '') ||
    styleState.colorToken ||
    '#0f172a'

  const selectedFontSize =
    selectionSummary.fontSizes.length === 1
      ? selectionSummary.fontSizes[0]
      : styleState.fontSize

  const styleButtonLabel =
    selectionSummary.styleLabels.length > 1
      ? 'Multiple'
      : selectionSummary.styleLabels[0] ??
        STYLE_PRESETS.find(
          (preset) =>
            preset.fontSize === styleState.fontSize &&
            preset.fontId === styleState.fontId &&
            preset.colorToken === styleState.colorToken,
        )?.label ??
        'Style'

  const sizeButtonLabel =
    selectionSummary.fontSizes.length > 1
      ? 'Multiple'
      : `${selectedFontSize}px`

  const colorButtonLabel =
    selectionSummary.colorTokens.length > 1
      ? 'Multiple'
      : selectionSummary.colorTokens[0] ?? ''

  const colorSwatch =
    resolveThemeColor(
      theme,
      selectionSummary.colorTokens[0] ?? styleState.colorToken,
      selectionSummary.colorTokens[0] ?? styleState.colorToken,
    ) || currentColor

  const updateToolbarPosition = useCallback(() => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setToolbarPos({
      top: rect.top - 24,
      left: rect.left + rect.width / 2,
    })
  }, [])

  useEffect(() => {
    if (!isFocused) {
      setToolbarPos(null)
      return
    }
    updateToolbarPosition()
    window.addEventListener('resize', updateToolbarPosition)
    window.addEventListener('scroll', updateToolbarPosition, true)
    return () => {
      window.removeEventListener('resize', updateToolbarPosition)
      window.removeEventListener('scroll', updateToolbarPosition, true)
    }
  }, [isFocused, updateToolbarPosition])

  useEffect(() => {
    if (isFocused) {
      syncToolbarStyle()
    }
  }, [isFocused, syncToolbarStyle])

  useEffect(() => {
    if (isFocused) updateToolbarPosition()
  }, [editorKey, isFocused, updateToolbarPosition])

  useEffect(() => {
    if (isSelected && !wasSelectedRef.current) {
      wasSelectedRef.current = true
      const frame = requestAnimationFrame(() => {
        try {
          ReactEditor.focus(editor)
        } catch (error) {
          console.warn('Failed to focus editor:', error)
        }
      })
      return () => cancelAnimationFrame(frame)
    }
    wasSelectedRef.current = isSelected
    return undefined
  }, [isSelected, editor])

  const toolbarPortal: ReactNode =
    isFocused && toolbarPos
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[4000] rounded-full border border-white/70 bg-white px-4 py-2 shadow-2xl"
            style={{
              top: toolbarPos.top,
              left: toolbarPos.left,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={(event) => {
              event.preventDefault()
              toolbarPointerRef.current = true
            }}
            onPointerUp={(event) => {
              event.preventDefault()
              toolbarPointerRef.current = false
              ReactEditor.focus(editor)
            }}
          >
            <div className="pointer-events-auto flex gap-2">
              <ToolbarButton
                label={styleButtonLabel}
                active={activeMenu === 'style'}
                labelClassName="max-w-[120px]"
                onToggle={() =>
                  setActiveMenu(activeMenu === 'style' ? null : 'style')
                }
                menu={
                  <ToolbarMenu>
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="w-full rounded-lg px-4 py-1.5 text-left text-sm hover:bg-slate-100"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault()
                          applyPreset(preset.id)
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </ToolbarMenu>
                }
              />
              <ToolbarButton
                label={sizeButtonLabel}
                active={activeMenu === 'size'}
                labelClassName="max-w-[80px]"
                onToggle={() =>
                  setActiveMenu(activeMenu === 'size' ? null : 'size')
                }
                menu={
                  <ToolbarMenu>
                    {FONT_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="w-full rounded-lg px-4 py-1.5 text-left text-sm hover:bg-slate-100"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault()
                          applyFontSize(size)
                        }}
                      >
                        {size}px
                      </button>
                    ))}
                  </ToolbarMenu>
                }
              />
              <ToolbarButton
                label={colorButtonLabel}
                swatch={colorSwatch}
                active={activeMenu === 'color'}
                labelClassName="max-w-[120px]"
                onToggle={() =>
                  setActiveMenu(activeMenu === 'color' ? null : 'color')
                }
                menu={
                  <ToolbarMenu>
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                      {theme.colors.map((colorToken) => (
                        <button
                          key={colorToken.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-1.5 text-left text-sm hover:bg-slate-100"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.preventDefault()
                            applyThemeColor(colorToken.id)
                          }}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: colorToken.value }}
                          />
                          {colorToken.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="w-full rounded-lg px-4 py-1.5 text-left text-sm text-brand-accent hover:bg-slate-100"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault()
                          colorInputRef.current?.click()
                        }}
                      >
                        Custom…
                      </button>
                    </div>
                  </ToolbarMenu>
                }
              />
            </div>
          </div>,
          document.body,
        )
      : null

  if (!isSelected) {
    return (
      <div
        className="flex h-full w-full cursor-text select-none items-center"
        style={{
          fontFamily,
          fontSize: styleState.fontSize,
          color,
          textAlign: component.props.align,
          letterSpacing: component.props.letterSpacing ?? 0,
          lineHeight: component.props.lineHeight ?? 1.05,
          justifyContent: alignment,
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (component.id) selectComponent(component.id)
        }}
      >
        {displayText ? (
          <RichTextPreview
            value={displayNodes}
            theme={theme}
            baseStyle={styleState}
          />
        ) : (
          <span>Click to edit text</span>
        )}
      </div>
    )
  }

  return (
    <>
      <div
        className="relative h-full w-full"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: alignment,
        }}
        ref={wrapperRef}
        onClick={(event) => event.stopPropagation()}
      >
        <Slate
          key={`${component.id}-${editorKey}`}
          editor={editor}
          initialValue={draft}
          onChange={handleSlateChange}
        >
          <div className="h-full w-full rounded-xl bg-transparent">
            <Editable
              spellCheck={false}
              autoCorrect="off"
              className="flex h-full w-full cursor-text select-text items-center rounded-xl bg-transparent outline-none"
              style={{
                fontFamily,
                fontSize: styleState.fontSize,
                color,
                textAlign: component.props.align,
                letterSpacing: component.props.letterSpacing ?? 0,
                lineHeight: component.props.lineHeight ?? 1.05,
              }}
              onFocus={() => {
                setIsFocused(true)
              }}
              onBlur={() => {
                if (toolbarPointerRef.current) {
                  toolbarPointerRef.current = false
                  setTimeout(() => ReactEditor.focus(editor), 0)
                  return
                }
                setIsFocused(false)
                setActiveMenu(null)
              }}
              renderLeaf={(leafProps) => (
                <Leaf {...leafProps} theme={theme} baseStyle={styleState} />
              )}
            />
          </div>
          <input
            ref={colorInputRef}
            type="color"
            className="hidden"
            defaultValue={currentColor}
            onChange={(event) => applyCustomColor(event.target.value)}
          />
        </Slate>
      </div>
      {toolbarPortal}
    </>
  )
}

function ToolbarButton({
  label,
  swatch,
  active,
  onToggle,
  menu,
  labelClassName,
}: {
  label: string
  swatch?: string
  active: boolean
  onToggle: () => void
  menu: React.ReactNode
  labelClassName?: string
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
          active ? 'bg-brand-secondary/50 text-brand-ink' : 'text-slate-600'
        }`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault()
          onToggle()
        }}
      >
        {swatch && (
          <span
            className="h-3 w-3 rounded-full border border-black/10"
            style={{ backgroundColor: swatch }}
          />
        )}
        <span className={`max-w-[140px] truncate ${labelClassName ?? ''}`}>
          {label || 'Color'}
        </span>
      </button>
      {active && (
        <div className="absolute left-1/2 top-full z-[2100] w-40 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-2 text-xs shadow-xl">
          {menu}
        </div>
      )}
    </div>
  )
}

function ToolbarMenu({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>
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

function fromPlainText(text?: string): Descendant[] {
  const safe = typeof text === 'string' ? text : ''
  return [
    {
      type: 'paragraph',
      children: [{ text: safe }],
    } as Descendant,
  ]
}

function toPlainText(value: Descendant[]) {
  return value.map((node) => Node.string(node)).join('\n')
}

function cloneDescendants(value: Descendant[]): Descendant[] {
  return JSON.parse(JSON.stringify(value)) as Descendant[]
}

function serializeRichText(value?: Descendant[] | null) {
  return JSON.stringify(value ?? null)
}
