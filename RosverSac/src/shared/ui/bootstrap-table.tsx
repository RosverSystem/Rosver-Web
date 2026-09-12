import { cn } from '@/shared/lib'
import type { ReactNode, TableHTMLAttributes } from 'react'

type BootstrapTableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Contenedor con scroll horizontal (como Bootstrap `.table-responsive`). */
  responsive?: boolean
  striped?: boolean
  hover?: boolean
  bordered?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
  wrapperClassName?: string
}

/**
 * Tabla con API de clases Bootstrap (`table`, `table-striped`, …)
 * estilizada con tokens Rosver (ver `global.css`).
 */
export function BootstrapTable({
  responsive = true,
  striped = true,
  hover = true,
  bordered = false,
  size = 'md',
  className,
  wrapperClassName,
  children,
  ...rest
}: BootstrapTableProps) {
  const table = (
    <table
      className={cn(
        'table',
        striped && 'table-striped',
        hover && 'table-hover',
        bordered && 'table-bordered',
        size === 'sm' && 'table-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </table>
  )

  if (!responsive) return table
  return <div className={cn('table-responsive', wrapperClassName)}>{table}</div>
}
