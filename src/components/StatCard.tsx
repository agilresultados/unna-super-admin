import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-teal-border bg-card-bg p-4 shadow-[0_0_25px_rgba(20,184,166,0.08)]">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-teal-main' : 'text-text-main'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-text-faint">{hint}</p>}
    </div>
  )
}
