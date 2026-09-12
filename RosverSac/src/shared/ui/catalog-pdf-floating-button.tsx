import { useOptionalToasts } from '@/shared/ui/toast-provider'
import { Download } from 'cssvg-icons'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'

/**
 * FAB catálogo PDF — descarga desde API (HTML + Puppeteer A4).
 */
export function CatalogPdfFloatingButton() {
  const toasts = useOptionalToasts()
  const reduce = useReducedMotion()
  const [busy, setBusy] = useState(false)

  async function onClick() {
    if (busy) return
    setBusy(true)
    toasts?.showInfo(['Generando catálogo PDF (puede tardar)…'])
    try {
      const res = await fetch('/api/catalog/pdf', { credentials: 'include' })
      if (!res.ok) {
        let msg = 'No se pudo generar el catálogo.'
        try {
          const j = (await res.json()) as { error?: string }
          if (j.error) msg = j.error
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }
      const blob = await res.blob()
      const year = new Date().getFullYear()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Catalogo-Rosver-${year}.pdf`
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toasts?.showSuccess(['Catálogo PDF descargado.'])
    } catch (err) {
      toasts?.showErrors(
        {
          pdf:
            err instanceof Error
              ? err.message
              : 'No se pudo generar el catálogo.',
        },
        ['pdf'],
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.button
      type="button"
      disabled={busy}
      onClick={() => void onClick()}
      aria-label="Descargar catálogo PDF"
      title="Catálogo PDF"
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={reduce ? undefined : { scale: 1.08 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="fixed right-4 bottom-[5.25rem] z-50 flex size-14 flex-col items-center justify-center rounded-full bg-rosver-ink text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-rosver-red disabled:cursor-wait disabled:opacity-70 sm:right-6 sm:bottom-[5.75rem]"
    >
      <Download size={22} color="currentColor" strokeWidth={2} aria-hidden />
      <span className="mt-0.5 text-[8px] font-bold tracking-wide uppercase">
        {busy ? '…' : 'PDF'}
      </span>
    </motion.button>
  )
}
