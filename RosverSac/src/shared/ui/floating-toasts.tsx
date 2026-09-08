import { prefersReducedMotion } from '@/shared/lib/gsap'
import { motion } from 'motion/react'
import { type FloatingToast } from './floating-toasts.types'

export type { FloatingToast } from './floating-toasts.types'

type FloatingToastsProps = {
  toasts: FloatingToast[]
  onDismiss: (id: string) => void
  /** Default: prefers-reduced-motion del sistema */
  reduceMotion?: boolean
}

/**
 * Avisos flotantes (no empujan el layout). Uso obligatorio en validaciones de form.
 */
export function FloatingToasts({
  toasts,
  onDismiss,
  reduceMotion,
}: FloatingToastsProps) {
  const reduce = reduceMotion ?? prefersReducedMotion()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 left-4 z-[70] mx-auto flex max-w-md flex-col gap-2 sm:top-5 sm:right-5 sm:left-auto sm:w-full"
      role="region"
      aria-label="Avisos del formulario"
      aria-live="assertive"
    >
      {toasts.map((toast, index) => (
        <motion.div
          key={toast.id}
          role="alert"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-rosver-red/20 bg-white px-4 py-3 shadow-lg shadow-rosver-ink/10"
          initial={reduce ? false : { opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, delay: reduce ? 0 : index * 0.04 }}
        >
          <span
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rosver-red text-[11px] font-bold text-white"
            aria-hidden
          >
            !
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-rosver-ink">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-xs font-bold text-rosver-muted hover:text-rosver-ink"
            aria-label="Cerrar aviso"
          >
            Cerrar
          </button>
        </motion.div>
      ))}
    </div>
  )
}
