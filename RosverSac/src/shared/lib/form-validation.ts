import { cn } from '@/shared/lib/cn'

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

/** Teléfono Perú / WhatsApp: al menos 9 dígitos. */
export function isValidPhone(value: string, minDigits = 9) {
  return digitsOnly(value).length >= minDigits
}

/** Clases de borde de error para inputs (sin mensaje inline). */
export function fieldErrorRing(hasError: boolean) {
  return hasError
    ? 'border-rosver-red/50 focus:ring-2 focus:ring-rosver-red/25'
    : undefined
}

export function cnField(base: string, hasError: boolean) {
  return cn(base, fieldErrorRing(hasError))
}
