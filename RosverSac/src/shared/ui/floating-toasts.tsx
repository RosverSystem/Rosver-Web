import { prefersReducedMotion } from '@/shared/lib/gsap'
import { cn } from '@/shared/lib/cn'
import { ToastContext } from '@/shared/ui/toast-context'
import { AnimatePresence, motion } from 'motion/react'
import { useContext } from 'react'
import {
  TOAST_TONE_LABEL,
  type FloatingToast,
  type ToastTone,
} from './floating-toasts.types'

export type { FloatingToast, ToastTone } from './floating-toasts.types'

type FloatingToastsProps = {
  toasts: FloatingToast[]
  onDismiss: (id: string) => void
  reduceMotion?: boolean
}

const TONE_SHELL: Record<ToastTone, string> = {
  success: 'bg-rosver-success text-white shadow-rosver-success/25',
  error: 'bg-rosver-red text-white shadow-rosver-red/25',
  info: 'bg-rosver-blue text-white shadow-rosver-blue/25',
  warning: 'bg-rosver-yellow text-rosver-ink shadow-rosver-ink/10',
}

const TONE_CLOSE: Record<ToastTone, string> = {
  success: 'bg-black/15 text-white hover:bg-black/25',
  error: 'bg-black/15 text-white hover:bg-black/25',
  info: 'bg-black/15 text-white hover:bg-black/25',
  warning: 'bg-rosver-ink/10 text-rosver-ink hover:bg-rosver-ink/15',
}

const TONE_ICON_WRAP: Record<ToastTone, string> = {
  success: 'bg-white/20 text-white',
  error: 'bg-white/20 text-white',
  info: 'bg-white/20 text-white',
  warning: 'bg-rosver-ink/10 text-rosver-ink',
}

const TONE_BAR: Record<ToastTone, string> = {
  success: 'bg-white/45',
  error: 'bg-white/45',
  info: 'bg-white/45',
  warning: 'bg-rosver-ink/25',
}

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12.5 10 17.5 19 7.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (tone === 'warning') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.5 21.5 20H2.5L12 3.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 10v4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="17.5" r="1.15" fill="currentColor" />
      </svg>
    )
  }
  if (tone === 'error') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 7l10 10M17 7 7 17"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <span
      className="flex size-3.5 items-center justify-center rounded-full border-2 border-current text-[9px] font-bold leading-none"
      aria-hidden
    >
      i
    </span>
  )
}

function ToastStack({
  toasts,
  onDismiss,
  reduceMotion,
}: FloatingToastsProps) {
  const reduce = reduceMotion ?? prefersReducedMotion()

  return (
    <div
      className="pointer-events-none fixed top-3 right-3 left-3 z-[120] mx-auto flex max-w-[17.5rem] flex-col gap-2 sm:top-4 sm:right-4 sm:left-auto sm:w-[17.5rem]"
      role="region"
      aria-label="Avisos"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => {
          const tone = toast.tone ?? 'info'
          const title = toast.title ?? TOAST_TONE_LABEL[tone]
          return (
            <motion.div
              key={toast.id}
              layout={!reduce}
              role={tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto relative flex overflow-hidden rounded-xl shadow-md',
                TONE_SHELL[tone],
              )}
              initial={
                reduce
                  ? false
                  : { opacity: 0, x: 36, y: -4, scale: 0.96, filter: 'blur(3px)' }
              }
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
              }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, x: 28, scale: 0.97, filter: 'blur(2px)' }
              }
              transition={
                reduce
                  ? { duration: 0.12 }
                  : {
                      type: 'spring',
                      stiffness: 420,
                      damping: 28,
                      mass: 0.8,
                      delay: index * 0.04,
                    }
              }
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2">
                <motion.span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-lg',
                    TONE_ICON_WRAP[tone],
                  )}
                  aria-hidden
                  initial={reduce ? false : { scale: 0.6, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 22,
                    delay: reduce ? 0 : 0.08 + index * 0.04,
                  }}
                >
                  <ToneIcon tone={tone} />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold leading-tight tracking-tight">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug opacity-95">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className={cn(
                  'flex w-8 shrink-0 items-center justify-center text-base font-bold transition',
                  TONE_CLOSE[tone],
                )}
                aria-label="Cerrar aviso"
              >
                ×
              </button>
              {!reduce ? (
                <motion.span
                  className={cn(
                    'pointer-events-none absolute bottom-0 left-0 h-0.5 origin-left',
                    TONE_BAR[tone],
                  )}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                  style={{ width: '100%' }}
                  aria-hidden
                />
              ) : null}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/**
 * Avisos flotantes tipados. Con ToastProvider en App, las instancias
 * locales se omiten (un solo host animado).
 */
export function FloatingToasts(props: FloatingToastsProps) {
  const hosted = useContext(ToastContext)
  if (hosted) return null
  return <ToastStack {...props} />
}

/** Host del provider (siempre renderiza el stack). */
export function FloatingToastsHost(props: FloatingToastsProps) {
  return <ToastStack {...props} />
}
