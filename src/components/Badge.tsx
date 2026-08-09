import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  default: 'bg-card-bg border border-teal-border text-text-muted',
  accent: 'bg-teal-main text-app-bg font-semibold border border-transparent',
  success: 'bg-success/10 text-success border border-success/30',
  warning: 'bg-warning/10 text-warning border border-warning/30',
  danger: 'bg-danger/10 text-danger border border-danger/30',
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
