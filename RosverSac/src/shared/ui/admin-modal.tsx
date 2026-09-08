import { cn } from '@/shared/lib'
import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
  className?: string
  /** Capas anidadas (ej. picker encima de form). Default 80. */
  layer?: number
  closeOnEscape?: boolean
}

/**
 * Modal ERP SystemRSV — overlay + panel, Escape / clic fuera cierra.
 */
export function AdminModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
  className,
  layer = 80,
  closeOnEscape = true,
}: Props) {
  useEffect(() => {
    if (!open || !closeOnEscape) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
    }
  }, [open, onClose, closeOnEscape])

  if (!open) return null

  const maxW =
    size === 'md' ? 'max-w-lg' : size === 'xl' ? 'max-w-4xl' : 'max-w-2xl'

  return (
    <div
      className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ zIndex: layer }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-rosver-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-rosver-line bg-white shadow-xl sm:rounded-2xl',
          maxW,
          className,
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-rosver-line px-4 py-3 sm:px-5">
          <h2
            id="admin-modal-title"
            className="truncate text-sm font-bold text-rosver-ink sm:text-base"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink"
          >
            Cerrar
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>
        {footer ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-rosver-line bg-rosver-soft/40 px-4 py-3 sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
