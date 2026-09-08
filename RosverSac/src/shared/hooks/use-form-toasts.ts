import { type FloatingToast } from '@/shared/ui/floating-toasts.types'
import { useEffect, useRef, useState } from 'react'

const DEFAULT_DISMISS_MS = 4500

/**
 * Estado de toasts flotantes para validación de formularios.
 * No usar mensajes inline ni `required` nativo del browser.
 */
export function useFormToasts(autoDismissMs = DEFAULT_DISMISS_MS) {
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

  function showMessages(messages: string[]) {
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
      })),
    )
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToasts([]), autoDismissMs)
  }

  /** Muestra errores de un record en el orden dado (o Object.keys). */
  function showErrors(
    errors: Partial<Record<string, string>>,
    order?: string[],
  ) {
    const keys = order ?? Object.keys(errors)
    showMessages(keys.map((k) => errors[k]).filter((m): m is string => Boolean(m)))
  }

  return { toasts, showMessages, showErrors, dismiss, clear }
}
