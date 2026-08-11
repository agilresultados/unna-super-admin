import { useTheme } from '@/contexts/ThemeContext'
import { clsx } from 'clsx'

interface ThemeToggleProps {
  className?: string
  /** Compact icon button (header). Default true. */
  compact?: boolean
}

export function ThemeToggle({ className, compact = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        'inline-flex items-center justify-center rounded-md border border-teal-border text-text-main transition-colors hover:bg-teal-hover-bg hover:text-teal-main',
        compact ? 'h-9 w-9' : 'gap-2 px-3 py-2 text-sm font-medium',
        className,
      )}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? (
        /* Sun */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        /* Moon */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {!compact && <span>{isDark ? 'Claro' : 'Escuro'}</span>}
    </button>
  )
}
