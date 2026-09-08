export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'Mínimo 8 caracteres',
    test: (value: string) => value.length >= 8,
  },
  {
    id: 'upper',
    label: 'Una letra mayúscula',
    test: (value: string) => /[A-ZÁÉÍÓÚÑ]/.test(value),
  },
  {
    id: 'lower',
    label: 'Una letra minúscula',
    test: (value: string) => /[a-záéíóúñ]/.test(value),
  },
  {
    id: 'number',
    label: 'Un número',
    test: (value: string) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'Un carácter especial (!@#$%…)',
    test: (value: string) => /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/.test(value),
  },
] as const

export function passwordMeetsRules(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}

export type PasswordStrength = 'baja' | 'media' | 'segura'

export function getPasswordStrength(value: string): PasswordStrength | null {
  if (!value) return null
  const met = PASSWORD_RULES.filter((rule) => rule.test(value)).length
  if (met <= 2) return 'baja'
  if (met <= 4) return 'media'
  return 'segura'
}

export const PASSWORD_STRENGTH_UI: Record<
  PasswordStrength,
  { label: string; width: string; bar: string; text: string }
> = {
  baja: {
    label: 'Baja',
    width: '33%',
    bar: 'bg-rosver-red',
    text: 'text-rosver-red',
  },
  media: {
    label: 'Media',
    width: '66%',
    bar: 'bg-rosver-yellow',
    text: 'text-rosver-ink',
  },
  segura: {
    label: 'Segura',
    width: '100%',
    bar: 'bg-rosver-success',
    text: 'text-rosver-success',
  },
}
