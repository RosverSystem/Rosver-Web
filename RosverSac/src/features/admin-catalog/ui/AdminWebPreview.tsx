import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/**
 * Marco de vista previa ERP: cómo se ve en la tienda pública.
 */
export function AdminWebPreview({
  label = 'Vista previa en la tienda',
  children,
  className,
  wide = false,
}: {
  label?: string
  children: ReactNode
  className?: string
  /** Cards de categoría home (~22rem). */
  wide?: boolean
}) {
  return (
    <aside
      className={cn(
        'rounded-2xl border border-dashed border-rosver-line bg-rosver-soft/50 p-3 sm:p-4',
        className,
      )}
    >
      <p className="mb-3 text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
        {label}
      </p>
      <div className={cn('mx-auto w-full', wide ? 'max-w-[22rem]' : 'max-w-[280px]')}>
        {children}
      </div>
    </aside>
  )
}
