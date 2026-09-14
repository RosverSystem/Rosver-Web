import { sileo } from 'sileo'
import { useEffect } from 'react'

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
 * Aviso de cookies con **Sileo** (`sileo.action`): bubble + tab «Privacidad».
 * Persistente hasta elegir; guarda preferencia en localStorage.
 */
export function CookieConsentFloat() {
  useEffect(() => {
    if (readConsent()) return

    const timer = window.setTimeout(() => {
      if (readConsent()) return

      let toastId = ''

      const finish = (choice: CookieConsentChoice) => {
        writeConsent(choice)
        if (toastId) sileo.dismiss(toastId)
      }

      sileo.clear('bottom-center')

      toastId = sileo.action({
        title: 'Privacidad',
        position: 'bottom-center',
        duration: null,
        fill: '#FFFFFF',
        description: (
          <div className="flex flex-col gap-3 text-left">
            <p className="text-[13px] leading-snug text-[#6B7280]">
              Usamos cookies necesarias para el sitio y, si aceptas, cookies
              opcionales para mejorar tu experiencia.{' '}
              <a
                href="/contacto"
                className="font-semibold text-[#0D0D0D] underline decoration-[#E30613]/50 underline-offset-2"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                Más información
              </a>
              .
            </p>
            <button
              type="button"
              data-sileo-button
              className="inline-flex h-8 w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0D0D0D] transition hover:border-[#E30613] hover:text-[#E30613]"
              onClick={(e) => {
                e.stopPropagation()
                finish('necessary')
              }}
            >
              Solo necesarias
            </button>
          </div>
        ),
        button: {
          title: 'Aceptar todas',
          onClick: () => finish('all'),
        },
        styles: {
          description: 'sileo-rosver-desc',
          button: 'sileo-rosver-btn',
          title: 'sileo-rosver-title',
          badge: 'sileo-rosver-badge',
        },
      })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [])

  return null
}
