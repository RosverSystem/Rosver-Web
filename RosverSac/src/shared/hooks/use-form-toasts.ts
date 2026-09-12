import {
  type FloatingToast,
  type ToastTone,
} from '@/shared/ui/floating-toasts.types'
import { ToastContext } from '@/shared/ui/toast-context'
import { useContext, useEffect, useRef, useState } from 'react'

const DEFAULT_DISMISS_MS = 4500

/** Si no pasan tone, infiere por el texto (español Rosver). */
export function inferToastTone(message: string): ToastTone {
  const m = message.toLowerCase()
  if (
    /no se pudo|no encontrado|error|falló|fallo|incorrecto|inválid|obligatori|completa este|completa el|elige |indica |escribe |pon |demasiad|alcanzaste|espera \d|faltan|no válido|sin permis|reinicia/.test(
      m,
    )
  ) {
    return 'error'
  }
  if (/revisa spam|cuidado|aviso|no pudimos enviar|intenta más tarde/.test(m)) {
    return 'warning'
  }
  if (
    /enviamos|enviado|reenviado|guardado|creado|actualizado|eliminado|publicado|copiada|subido|sesión iniciada|verificado|éxito|listo|agregad|vinculado|desvinculado|quitad|activado|desactiv/.test(
      m,
    )
  ) {
    return 'success'
  }
  return 'info'
}

/**
 * Estado local de toasts (solo ToastProvider debe montarlo).
 * Páginas: usar `useFormToasts()` / `useToasts()` del provider.
 */
export function useFormToastsState(autoDismissMs = DEFAULT_DISMISS_MS) {
  const [toasts, setToasts] = useState<FloatingToast[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function clear() {
    setToasts([])
    if (timer.current) clearTimeout(timer.current)
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function push(messages: string[], tone: ToastTone | 'auto', title?: string) {
    const unique = messages.filter(Boolean)
    if (unique.length === 0) {
      clear()
      return
    }
    const stamp = Date.now()
    setToasts(
      unique.map((message, i) => ({
        id: `toast-${stamp}-${i}`,
        message,
        tone: tone === 'auto' ? inferToastTone(message) : tone,
        title,
      })),
    )
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToasts([]), autoDismissMs)
  }

  function showMessages(messages: string[], tone: ToastTone | 'auto' = 'auto') {
    push(messages, tone)
  }

  function showSuccess(messages: string[]) {
    push(messages, 'success')
  }

  function showInfo(messages: string[]) {
    push(messages, 'info')
  }

  function showWarning(messages: string[]) {
    push(messages, 'warning')
  }

  function showErrors(
    errors: string[] | Partial<Record<string, string>>,
    order?: string[],
  ) {
    if (Array.isArray(errors)) {
      push(errors.filter(Boolean), 'error')
      return
    }
    const keys = order ?? Object.keys(errors)
    push(
      keys.map((k) => errors[k]).filter((m): m is string => Boolean(m)),
      'error',
    )
  }

  return {
    toasts,
    showMessages,
    showSuccess,
    showInfo,
    showWarning,
    showErrors,
    dismiss,
    clear,
  }
}

/**
 * Toasts tipados. Con ToastProvider en App → un solo stack animado global.
 * Sin provider (tests): instancia local.
 */
export function useFormToasts(autoDismissMs = DEFAULT_DISMISS_MS) {
  const global = useContext(ToastContext)
  const local = useFormToastsState(autoDismissMs)
  return global ?? local
}
