import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm text-text-main">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'block w-full rounded-md border bg-app-bg px-3 py-2 text-sm text-text-main',
          'placeholder:text-text-faint',
          'focus:outline-none focus:ring-1 focus:ring-teal-light focus:border-teal-light',
          error ? 'border-danger' : 'border-teal-border',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
