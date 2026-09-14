import { cn } from '@/shared/lib'
import { Verified } from 'cssvg-icons'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'rosver.cookieConsent'

export type CookieConsentChoice = 'all' | 'necessary'

function readConsent(): CookieConsentChoice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'all' || v === 'necessary') return v
  } catch {
    /* private mode */
  }
  return null
}

function writeConsent(choice: CookieConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    /* ignore */
  }
}

/**
 * Noti flotante de cookies / permisos (estilo Sileo bubble + tab).
 * Paleta Rosver: superficie blanca, acento rojo, texto ink/muted.
 */
export function CookieConsentFloat() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readConsent()) return
    const id = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(id)
  }, [])

  function choose(choice: CookieConsentChoice) {
    writeConsent(choice)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="cookie-consent"
          role="dialog"
          aria-live="polite"
          aria-label="Preferencias de cookies"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          <div
            className={cn(
              'pointer-events-auto relative w-full max-w-[22rem] pb-3',
            )}
          >
            <div
              className={cn(
                'rounded-[1.75rem] bg-rosver-surface text-rosver-ink',
                'shadow-[0_16px_48px_rgba(13,13,13,0.22)] ring-1 ring-rosver-line/80',
              )}
            >
              <div className="flex flex-col gap-3 px-5 pt-5 pb-4">
                <p className="text-center text-sm leading-relaxed text-rosver-muted">
                  Usamos cookies necesarias para el sitio y, si aceptas, cookies
                  opcionales para mejorar tu experiencia.{' '}
                  <Link
                    to="/contacto"
                    className="font-semibold text-rosver-ink underline decoration-rosver-red/50 underline-offset-2 hover:text-rosver-red"
                  >
                    Más información
                  </Link>
                  .
                </p>

                <button
                  type="button"
                  onClick={() => choose('all')}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-rosver-red/10 px-4 text-sm font-bold text-rosver-red transition hover:bg-rosver-red hover:text-white"
                >
                  Aceptar todas
                </button>

                <button
                  type="button"
                  onClick={() => choose('necessary')}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-rosver-line bg-white px-4 text-sm font-semibold text-rosver-ink transition hover:border-rosver-red hover:text-rosver-red"
                >
                  Solo necesarias
                </button>
              </div>
            </div>

            <div className="absolute bottom-0 left-1/2 z-[1] flex -translate-x-1/2 justify-center">
              <div className="flex items-center gap-2 rounded-full bg-rosver-surface px-3.5 py-2 shadow-[0_8px_24px_rgba(13,13,13,0.12)] ring-1 ring-rosver-line/80">
                <span className="flex size-6 items-center justify-center rounded-full bg-rosver-red/12 text-rosver-red">
                  <Verified size={14} color="currentColor" strokeWidth={2} />
                </span>
                <span className="text-xs font-bold tracking-wide text-rosver-red">
                  Privacidad
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
