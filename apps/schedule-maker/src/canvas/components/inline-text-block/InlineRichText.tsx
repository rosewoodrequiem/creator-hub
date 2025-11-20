import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  type Descendant,
  Range,
  Text,
  Transforms,
  createEditor,
} from 'slate'
import { withHistory } from 'slate-history'
import { Editable, type ReactEditor, Slate, withReact } from 'slate-react'

import { Button } from '@creator-hub/ui-kit'

import type { Theme } from '../../../store/schedule-maker-db/SheduleMakerDB.types'
import { resolveThemeColor, resolveThemeFont } from '../../theme/themeUtils'
import type { InlineLeaf, InlineLeafStyle } from './InlineTextBlock.types'
import { Leaf } from './Leaf'
import {
  cloneDescendants,
  fromPlainText,
  type InlineSelectionSummary,
  syncToolbarStyle,
  toPlainText,
  withLockText,
} from './richTextHelpers'

export type InlineRichTextStyle = {
  fontId: string
  fontSize: number
  colorToken: string
  textTransform?: 'uppercase' | 'none'
  letterSpacing?: string | number
}

export type InlineRichTextAction = {
  label: string
  onClick: (style: InlineRichTextStyle, content: Descendant[], text: string) => Promise<void> | void
}

type Props = {
  theme: Theme
  value?: Descendant[]
  text: string
  baseStyle: InlineRichTextStyle
  lockText?: boolean
  actions?: InlineRichTextAction[]
  textAlign?: CSSProperties['textAlign']
  lineHeight?: number | string
  onChange: (payload: {
    content: Descendant[]
    text: string
    style: InlineRichTextStyle
  }) => Promise<void> | void
}

export function InlineRichText({
  theme,
  value,
  text,
  baseStyle,
  lockText = false,
  actions = [],
  textAlign,
  lineHeight,
  onChange,
}: Props) {
  const editor = useMemo(
    () =>
      withLockText(
        withHistory(withReact(createEditor())) as ReactEditor,
        lockText,
      ) as ReactEditor,
    [lockText],
  )

  const [draft, setDraft] = useState<Descendant[]>(() =>
    cloneDescendants(value ?? fromPlainText(text)),
  )
  const [editorKey, setEditorKey] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [selectionSummary, setSelectionSummary] = useState<InlineSelectionSummary>(() => ({
    fontSizes: [baseStyle.fontSize],
    colorTokens: [baseStyle.colorToken],
    fontIds: [baseStyle.fontId],
  }))
  const [activeMenu, setActiveMenu] = useState<'style' | 'size' | 'color' | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const [styleState, setStyleState] = useState<InlineRichTextStyle>(() => ({
    fontId: baseStyle.fontId,
    fontSize: baseStyle.fontSize,
    colorToken: baseStyle.colorToken,
    textTransform: baseStyle.textTransform,
    letterSpacing: baseStyle.letterSpacing,
  }))

  useEffect(() => {
    setDraft(cloneDescendants(value ?? fromPlainText(text)))
    setStyleState({
      fontId: baseStyle.fontId,
      fontSize: baseStyle.fontSize,
      colorToken: baseStyle.colorToken,
      textTransform: baseStyle.textTransform,
      letterSpacing: baseStyle.letterSpacing,
    })
    setSelectionSummary({
      fontSizes: [baseStyle.fontSize],
      colorTokens: [baseStyle.colorToken],
      fontIds: [baseStyle.fontId],
    })
    setEditorKey((key) => key + 1)
  }, [
    baseStyle.colorToken,
    baseStyle.fontId,
    baseStyle.fontSize,
    baseStyle.letterSpacing,
    baseStyle.textTransform,
    text,
    value,
  ])

  const currentColor =
    resolveThemeColor(theme, styleState.colorToken, '') || styleState.colorToken

  const updateToolbarPosition = useCallback(() => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setToolbarPos({
      top: rect.top - 24,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const handleSlateChange = useCallback(
    (nextValue: Descendant[]) => {
      setDraft(nextValue)
      syncToolbarStyle(editor, setStyleState, baseStyle, setSelectionSummary)
      const nextText = toPlainText(nextValue)
      void onChange({
        content: nextValue,
        text: nextText,
        style: {
          fontId: styleState.fontId,
          fontSize: styleState.fontSize,
          colorToken: styleState.colorToken,
          textTransform: styleState.textTransform,
          letterSpacing: styleState.letterSpacing,
        },
      })
    },
    [
      baseStyle,
      editor,
      onChange,
      styleState.colorToken,
      styleState.fontId,
      styleState.fontSize,
      styleState.letterSpacing,
      styleState.textTransform,
    ],
  )

  const applyInlineStyle = useCallback(
    (
      style: InlineLeafStyle,
      options?: { clear?: (keyof InlineLeafStyle)[] },
    ) => {
      if (!editor.selection || !Range.isExpanded(editor.selection)) return false
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
      syncToolbarStyle(editor, setStyleState, baseStyle, setSelectionSummary)
      return true
    },
    [baseStyle, editor],
  )

  const applyThemeColor = (tokenId: string) => {
    if (applyInlineStyle({ colorToken: tokenId }, { clear: ['colorValue'] })) {
      setActiveMenu(null)
      return
    }
    setStyleState((prev) => ({ ...prev, colorToken: tokenId }))
    setActiveMenu(null)
  }

  const applyCustomColor = (color: string) => {
    if (applyInlineStyle({ colorValue: color }, { clear: ['colorToken'] })) {
      setActiveMenu(null)
      return
    }
    setStyleState((prev) => ({ ...prev, colorToken: color }))
    setActiveMenu(null)
  }

  const fontFamily = resolveThemeFont(
    theme,
    styleState.fontId,
    'Poppins, sans-serif',
  )

  const toolbar =
    isFocused && toolbarPos
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[4000] rounded-full border border-white/70 bg-white px-4 py-2 shadow-2xl"
            style={{
              top: toolbarPos.top,
              left: toolbarPos.left,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="pointer-events-auto flex gap-2">
              <ToolbarButton
                label={
                  selectionSummary.fontSizes.length > 1
                    ? 'Multiple'
                    : `${styleState.fontSize}px`
                }
                active={activeMenu === 'size'}
                onToggle={() =>
                  setActiveMenu(activeMenu === 'size' ? null : 'size')
                }
                menu={
                  <ToolbarMenu>
                    {[12, 14, 16, 18, 20, 24, 32, 40, 48, 64].map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="w-full rounded-lg px-4 py-1.5 text-left text-sm hover:bg-slate-100"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault()
                          if (applyInlineStyle({ fontSize: size })) {
                            setActiveMenu(null)
                            setStyleState((prev) => ({ ...prev, fontSize: size }))
                            return
                          }
                          setStyleState((prev) => ({ ...prev, fontSize: size }))
                          setActiveMenu(null)
                        }}
                      >
                        {size}px
                      </button>
                    ))}
                  </ToolbarMenu>
                }
              />
              <ToolbarButton
                label={selectionSummary.colorTokens.length > 1 ? 'Multiple' : 'Color'}
                swatch={currentColor}
                active={activeMenu === 'color'}
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
              {actions.map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant="ghost"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => action.onClick(styleState, draft, toPlainText(draft))}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div
      className="flex flex-col"
      style={{ textTransform: styleState.textTransform }}
      ref={wrapperRef}
    >
      <Slate
        key={editorKey}
        editor={editor}
        initialValue={draft}
        onChange={handleSlateChange}
      >
        <Editable
          spellCheck={false}
          autoCorrect="off"
          className="w-full cursor-text select-text outline-none"
          style={{
            fontFamily,
            fontSize: styleState.fontSize,
            color: resolveThemeColor(theme, styleState.colorToken, '#0f172a'),
            letterSpacing: styleState.letterSpacing,
            textAlign,
            lineHeight,
          }}
          renderLeaf={(leafProps) => (
            <Leaf {...leafProps} theme={theme} baseStyle={styleState} />
          )}
          onFocus={() => {
            setIsFocused(true)
            updateToolbarPosition()
          }}
          onBlur={() => {
            setIsFocused(false)
            setActiveMenu(null)
          }}
        />
        <input
          ref={colorInputRef}
          type="color"
          className="hidden"
          defaultValue={currentColor}
          onChange={(event) => applyCustomColor(event.target.value)}
        />
      </Slate>
      {toolbar}
    </div>
  )
}

function ToolbarButton({
  label,
  swatch,
  active,
  onToggle,
  menu,
}: {
  label: string
  swatch?: string
  active: boolean
  onToggle: () => void
  menu: ReactNode
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
        <span className="max-w-[140px] truncate">{label || 'Color'}</span>
      </button>
      {active && (
        <div className="absolute left-1/2 top-full z-[2100] w-40 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-2 text-xs shadow-xl">
          {menu}
        </div>
      )}
    </div>
  )
}

function ToolbarMenu({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>
}
