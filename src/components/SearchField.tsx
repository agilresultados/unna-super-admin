import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {}

export function SearchField({ className, ...props }: SearchFieldProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-teal-main">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <input
        type="search"
        className={clsx(
          'w-full rounded-md border border-teal-border bg-app-bg py-2 pl-10 pr-3 text-sm text-text-main',
          'placeholder:text-text-faint',
          'focus:outline-none focus:ring-1 focus:ring-teal-light focus:border-teal-light',
          className,
        )}
        {...props}
      />
    </div>
  )
}
