import clsx from 'clsx'
import type { PropsWithChildren, ReactNode } from 'react'

export type FloatingPanelProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}>

export function FloatingPanel({
  title,
  subtitle,
  actions,
  className,
  children,
}: FloatingPanelProps) {
  return (
    <div
      className={clsx(
        'w-[320px] space-y-3 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur',
        className,
      )}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && (
              <div className="text-sm font-semibold text-brand-ink">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-xs text-slate-500">{subtitle}</div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
