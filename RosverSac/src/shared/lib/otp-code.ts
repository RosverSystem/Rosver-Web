/** Quita espacios y separadores al pegar códigos OTP / autenticador. */
export function normalizeOtpCode(raw: string, maxLen = 8) {
  return raw.replace(/[\s\-_.]/g, '').replace(/\D/g, '').slice(0, maxLen)
}
