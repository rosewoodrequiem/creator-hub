import { useCallback, useEffect, useState } from 'react'

type RectLike = { top: number; left: number; width: number; height: number }

export const useToolbarPosition = (
  getRect: () => RectLike | null,
  isFocused: boolean,
) => {
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)

  const updateToolbarPosition = useCallback(() => {
    const rect = getRect()
    if (!rect) return
    setToolbarPos({
      top: rect.top - 24,
      left: rect.left + rect.width / 2,
    })
  }, [getRect])

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

  return { toolbarPos, updateToolbarPosition }
}
