import { buildWhatsAppLink } from '@/shared/lib'
import { IconWhatsApp } from '@/shared/ui/icons'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  pdfBlobUrl: string | null
  fileName: string
  code: string
  shareUrl: string
  businessName: string
  linkDays: number
  linkExpiresAt?: string | null
  /** Cotización (`/c/…`) o pedido (`/p/…`). */
  kind?: 'quote' | 'order'
}

/**
 * Modal PDF + CTA WhatsApp con link temporal (cotización o pedido).
 */
export function QuoteShareModal({
  open,
  onClose,
  pdfBlobUrl,
  fileName,
  code,
  shareUrl,
  linkDays,
  linkExpiresAt,
  kind = 'quote',
}: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const prev = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const label = kind === 'order' ? 'Pedido' : 'Cotización'
  const waCta =
    kind === 'order' ? 'Enviar por WhatsApp' : 'Cotizar por WhatsApp'
  /** Mensaje WhatsApp: pedido pide medios de pago; cotización sigue corta. */
  const waMessage =
    kind === 'order'
      ? [
          'Hola Rosver, quiero realizar este pedido.',
          `Número: ${code}`,
          `Link: ${shareUrl}`,
          '¿Cuáles son los medios de pago para hacer el depósito?',
        ].join('\n')
      : [
          'Hola Rosver, quiero cotizar con este link.',
          `Número: ${code}`,
          `Link: ${shareUrl}`,
        ].join('\n')

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const expiresLabel = linkExpiresAt
    ? new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(linkExpiresAt))
    : null

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-rosver-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-share-title"
        className="relative z-10 flex h-[min(96dvh,56rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-rosver-line bg-white shadow-xl sm:h-[min(92dvh,52rem)] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-rosver-line bg-rosver-ink px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id="quote-share-title"
              className="font-display text-sm font-bold tracking-wide text-white uppercase sm:text-base"
            >
              {label} {code}
            </h2>
            <p className="mt-0.5 truncate text-xs text-white/75">
              Link válido {linkDays} días
              {expiresLabel ? ` · hasta ${expiresLabel}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white/90 hover:bg-white/10"
          >
            Cerrar
          </button>
        </header>

        <div className="min-h-0 flex-1 bg-rosver-soft/60 p-2 sm:p-3">
          {pdfBlobUrl ? (
            <iframe
              title={`PDF ${fileName}`}
              src={pdfBlobUrl}
              className="h-full w-full rounded-xl border border-rosver-line bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-rosver-line bg-white text-sm text-rosver-muted">
              Generando PDF…
            </div>
          )}
        </div>

        <footer className="shrink-0 space-y-2.5 border-t border-rosver-line bg-white px-4 py-3.5 sm:px-5">
          <p className="break-all text-[11px] text-rosver-muted sm:text-xs">
            {shareUrl}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                window.open(
                  buildWhatsAppLink(waMessage),
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-[#20bd5a]"
            >
              <IconWhatsApp className="size-5" />
              {waCta}
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-rosver-line bg-rosver-soft px-4 text-sm font-bold text-rosver-ink transition hover:bg-white sm:min-w-[9rem]"
            >
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
