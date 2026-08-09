import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-teal-main text-app-bg font-semibold hover:bg-teal-light shadow-md shadow-teal-main/20',
  secondary:
    'bg-transparent border border-teal-main text-teal-main hover:bg-teal-hover-bg font-semibold',
  ghost:
    'bg-transparent border border-teal-border text-text-muted hover:border-teal-main hover:text-teal-main',
  danger:
    'bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20 font-semibold',
}

export function Button({
  variant = 'primary',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
