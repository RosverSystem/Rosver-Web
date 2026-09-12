import { useFormToastsState } from '@/shared/hooks/use-form-toasts'
import { FloatingToastsHost } from '@/shared/ui/floating-toasts'
import { ToastContext, type ToastApi } from '@/shared/ui/toast-context'
import { useContext, type ReactNode } from 'react'

/** Host global: un solo stack de toasts animados para toda la app. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const api = useFormToastsState()
  return (
    <ToastContext.Provider value={api}>
      {children}
      <FloatingToastsHost toasts={api.toasts} onDismiss={api.dismiss} />
    </ToastContext.Provider>
  )
}

export function useToasts(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToasts debe usarse dentro de ToastProvider')
  }
  return ctx
}

export function useOptionalToasts(): ToastApi | null {
  return useContext(ToastContext)
}
