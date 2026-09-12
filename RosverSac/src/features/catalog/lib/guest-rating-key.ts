const STORAGE_KEY = 'rosver_rating_guest_key'

/** Identificador anónimo estable (localStorage) para 1 voto por producto. */
export function getGuestRatingKey(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)?.trim()
    if (existing && existing.length >= 8) return existing
    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
    window.localStorage.setItem(STORAGE_KEY, next)
    return next
  } catch {
    return `g_session_${Date.now().toString(36)}`
  }
}
