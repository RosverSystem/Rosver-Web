import { cn } from '@/shared/lib'
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react'

/** Estilo único de inputs/selects del ERP SystemRSV. */
export const adminControlClass =
  'h-11 w-full appearance-none rounded-xl border border-rosver-line bg-white px-3 text-sm text-rosver-ink shadow-sm outline-none transition placeholder:text-rosver-muted/80 hover:border-rosver-muted/40 focus:border-rosver-red/45 focus:ring-2 focus:ring-rosver-red/15 disabled:cursor-not-allowed disabled:bg-rosver-soft disabled:opacity-70'

export const adminControlInvalidClass =
  'border-rosver-red/50 focus:border-rosver-red focus:ring-rosver-red/20'

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: ReactNode
}

export function AdminField({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)} htmlFor={htmlFor}>
      <span className="text-xs font-semibold tracking-wide text-rosver-ink">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-rosver-muted">{hint}</span> : null}
    </label>
  )
}

type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

export function AdminSelect({ className, invalid, children, ...props }: AdminSelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          adminControlClass,
          'cursor-pointer pr-10',
          invalid && adminControlInvalidClass,
          className,
        )}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-rosver-muted"
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}

type AdminInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export function AdminInput({ className, invalid, ...props }: AdminInputProps) {
  return (
    <input
      {...props}
      className={cn(adminControlClass, invalid && adminControlInvalidClass, className)}
    />
  )
}

type PageHeaderProps = {
  title: string
  actions?: ReactNode
}

/** Título de módulo ERP sin párrafos de ayuda. */
export function AdminPageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold tracking-tight text-rosver-ink sm:text-2xl">
        {title}
      </h2>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function AdminEmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-rosver-ink">{title}</p>
      {detail ? <p className="max-w-sm text-sm text-rosver-muted">{detail}</p> : null}
    </div>
  )
}
