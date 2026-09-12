import type { FloatingToast, ToastTone } from '@/shared/ui/floating-toasts.types'
import { createContext } from 'react'

export type ToastApi = {
  toasts: FloatingToast[]
  showMessages: (messages: string[], tone?: ToastTone | 'auto') => void
  showSuccess: (messages: string[]) => void
  showInfo: (messages: string[]) => void
  showWarning: (messages: string[]) => void
  showErrors: (
    errors: string[] | Partial<Record<string, string>>,
    order?: string[],
  ) => void
  dismiss: (id: string) => void
  clear: () => void
}

export const ToastContext = createContext<ToastApi | null>(null)
