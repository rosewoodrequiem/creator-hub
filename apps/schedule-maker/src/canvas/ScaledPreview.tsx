import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * Scales its child (assumed fixed-size) to fit inside the wrapper without scroll.
 * Default target is 1920x1080.
 */
export default function ScaledPreview({
  targetWidth = 1920,
  targetHeight = 1080,
  margin = 16,
  children,
}: {
  targetWidth?: number
  targetHeight?: number
  margin?: number
  children: ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - margin * 2
      const h = el.clientHeight - margin * 2
      const s = Math.min(w / targetWidth, h / targetHeight)
      setScale(Number.isFinite(s) ? Math.max(0.1, Math.min(1, s)) : 1)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [targetWidth, targetHeight, margin])

  return (
    <div ref={wrapRef} className="grid h-full w-full place-items-center">
      <div
        style={{
          width: targetWidth,
          height: targetHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
