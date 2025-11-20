const GLOBAL_FLAG = '__INLINE_TEXT_DEBUG__'
// levels: 0 = off, 1 = basic, 2 = verbose
type DebugLevel = 0 | 1 | 2

export function setInlineDebug(enabled: boolean) {
  if (typeof window !== 'undefined') {
    ;(window as any)[GLOBAL_FLAG] = enabled ? 1 : 0
  }
}

export function setInlineDebugLevel(level: DebugLevel) {
  if (typeof window !== 'undefined') {
    ;(window as any)[GLOBAL_FLAG] = level
  }
}

export function getInlineDebugLevel(): DebugLevel {
  if (typeof window === 'undefined') return 0
  const flag = (window as any)[GLOBAL_FLAG]
  if (flag === undefined) {
    ;(window as any)[GLOBAL_FLAG] = 2
    return 2
  }
  return Math.max(0, Math.min(Number(flag), 2)) as DebugLevel
}

export function isInlineDebugEnabled() {
  return getInlineDebugLevel() > 0
}

export function debugLog(
  scope: string,
  message: string,
  payload?: unknown,
  color = '#d946ef',
) {
  if (!isInlineDebugEnabled()) return
  const style = `color:${color};font-weight:bold;`
  if (payload === undefined) {
    console.log(`%c[InlineText][${scope}] ${message}`, style)
  } else {
    console.log(`%c[InlineText][${scope}] ${message}`, style, payload)
  }
}

export function debugVerbose(
  scope: string,
  message: string,
  payload?: unknown,
  color = '#3b82f6',
) {
  if (getInlineDebugLevel() < 2) return
  const style = `color:${color};font-weight:bold;`
  if (payload === undefined) {
    console.log(`%c[InlineText][${scope}] ${message}`, style)
  } else {
    console.log(`%c[InlineText][${scope}] ${message}`, style, payload)
  }
}
