import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-accent text-white shadow-lg shadow-brand-accent/40 hover:bg-brand-accent/90',
  secondary:
    'bg-white text-brand-ink border border-slate-200 hover:border-brand-accent/60',
  ghost:
    'bg-transparent text-brand-ink hover:bg-brand-secondary/30 border border-transparent',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  )
}
