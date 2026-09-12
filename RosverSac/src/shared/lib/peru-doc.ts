import { digitsOnly } from '@/shared/lib/form-validation'

export type PeruDocType = 'DNI' | 'RUC'

export function docNumberError(
  type: PeruDocType,
  raw: string,
): string | null {
  const digits = digitsOnly(raw)
  if (type === 'DNI') {
    if (digits.length !== 8) return 'El DNI debe tener 8 dígitos.'
    return null
  }
  if (digits.length !== 11) return 'El RUC debe tener 11 dígitos.'
  if (!/^(10|20)/.test(digits)) {
    return 'El RUC debe empezar con 10 o 20.'
  }
  return null
}

export function isDocReady(type: PeruDocType, raw: string) {
  return docNumberError(type, raw) == null
}

export function asPeruDocType(value: string | null | undefined): PeruDocType | null {
  if (value === 'DNI' || value === 'RUC') return value
  return null
}
