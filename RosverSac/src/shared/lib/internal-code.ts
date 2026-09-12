/** Ancho fijo del código interno de producto (serial zero-padded). */
export const INTERNAL_CODE_DIGITS = 8

/**
 * Formatea el código interno del sistema: 2 → "00000002".
 * Empieza en 00000000 y sube de 1 en 1 (el valor numérico vive en Postgres).
 */
export function formatInternalCode(code: number | string | null | undefined): string {
  if (code == null || code === '') {
    return ''.padStart(INTERNAL_CODE_DIGITS, '0')
  }
  const n = Math.floor(Number(code))
  if (!Number.isFinite(n) || n < 0) {
    return ''.padStart(INTERNAL_CODE_DIGITS, '0')
  }
  return String(n).padStart(INTERNAL_CODE_DIGITS, '0')
}
