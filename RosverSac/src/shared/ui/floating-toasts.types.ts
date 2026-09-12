export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export type FloatingToast = {
  id: string
  message: string
  tone: ToastTone
  /** Título corto; si no se pasa, se usa el label del tone. */
  title?: string
}

export const TOAST_TONE_LABEL: Record<ToastTone, string> = {
  success: 'Éxito',
  error: 'Error',
  info: 'Info',
  warning: 'Aviso',
}
