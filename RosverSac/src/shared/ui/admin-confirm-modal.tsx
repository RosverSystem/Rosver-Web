import { AdminModal } from '@/shared/ui/admin-modal'
import { cn } from '@/shared/lib'
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type AdminConfirmTone = 'danger' | 'warning' | 'success' | 'info'

export type AdminConfirmRequest = {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: AdminConfirmTone
}

type Pending = AdminConfirmRequest & {
  resolve: (ok: boolean) => void
}

const toneConfirmClass: Record<AdminConfirmTone, string> = {
  danger: 'bg-rosver-red text-white hover:bg-rosver-red-dark',
  warning: 'bg-rosver-yellow text-rosver-ink hover:brightness-95',
  success: 'bg-rosver-success text-white hover:brightness-95',
  info: 'bg-rosver-ink text-white hover:bg-rosver-red',
}

/**
 * Modal de aviso ERP (reemplaza window.confirm nativo).
 */
export function AdminConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: AdminConfirmTone
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AdminModal
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      size="md"
      layer={90}
      closeOnEscape={!busy}
      closeOnBackdrop={!busy}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-rosver-line bg-white px-4 text-sm font-bold text-rosver-ink hover:bg-rosver-soft disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cn(
              'min-h-11 rounded-xl px-4 text-sm font-bold disabled:opacity-50',
              toneConfirmClass[tone],
            )}
          >
            {busy ? 'Espera…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm leading-relaxed',
            tone === 'danger' &&
              'border-rosver-red/25 bg-rosver-red/5 text-rosver-ink',
            tone === 'warning' &&
              'border-rosver-yellow/50 bg-rosver-yellow/15 text-rosver-ink',
            tone === 'success' &&
              'border-rosver-success/30 bg-rosver-success/10 text-rosver-ink',
            tone === 'info' &&
              'border-rosver-line bg-rosver-soft/70 text-rosver-ink',
          )}
        >
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <p className="text-xs text-rosver-muted">
          Esta acción pide tu confirmación antes de continuar.
        </p>
      </div>
    </AdminModal>
  )
}

/**
 * Hook: `const ok = await confirm({ title, message, tone })`
 * Renderiza `{confirmModal}` junto al resto de la página.
 */
export function useAdminConfirm() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef<Pending | null>(null)
  pendingRef.current = pending

  const close = useCallback((ok: boolean) => {
    const p = pendingRef.current
    if (!p) return
    setPending(null)
    setBusy(false)
    p.resolve(ok)
  }, [])

  const confirm = useCallback((req: AdminConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...req, resolve })
    })
  }, [])

  const confirmModal = (
    <AdminConfirmModal
      open={Boolean(pending)}
      title={pending?.title ?? ''}
      message={pending?.message ?? ''}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      tone={pending?.tone ?? 'danger'}
      busy={busy}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  )

  return { confirm, confirmModal, setConfirmBusy: setBusy }
}
