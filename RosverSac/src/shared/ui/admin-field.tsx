import { cn } from '@/shared/lib'
import { AdminSelectCombobox } from '@/shared/ui/select-combobox'
import {
  AdminModuleBanner,
  type AdminModuleStat,
} from '@/shared/ui/admin-module-banner'
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

type AdminSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  invalid?: boolean
}

/** Select ERP con menú custom Rosver (sin azul nativo del browser). */
export function AdminSelect({ className, invalid, children, ...props }: AdminSelectProps) {
  return (
    <AdminSelectCombobox
      {...props}
      invalid={invalid}
      className={className}
      size="md"
    >
      {children}
    </AdminSelectCombobox>
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

type AdminComboboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'list'> & {
  invalid?: boolean
  /** Opciones sugeridas (seleccionar o escribir otra). */
  options: { value: string; label: string }[]
  listId: string
}

/**
 * Select + escribir: input con sugerencias (datalist).
 * El valor libre se resuelve al guardar (crear si no existe).
 */
export function AdminCombobox({
  className,
  invalid,
  options,
  listId,
  ...props
}: AdminComboboxProps) {
  return (
    <>
      <input
        {...props}
        list={listId}
        autoComplete="off"
        className={cn(adminControlClass, invalid && adminControlInvalidClass, className)}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.value} value={o.label} />
        ))}
      </datalist>
    </>
  )
}

type PageHeaderProps = {
  title: string
  eyebrow?: string
  description?: string
  stats?: AdminModuleStat[]
  actions?: ReactNode
}

/** Banner de módulo ERP con métricas (estilo área cliente). */
export function AdminPageHeader({
  title,
  eyebrow,
  description,
  stats,
  actions,
}: PageHeaderProps) {
  return (
    <AdminModuleBanner
      title={title}
      eyebrow={eyebrow}
      description={description}
      stats={stats}
      actions={actions}
    />
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
