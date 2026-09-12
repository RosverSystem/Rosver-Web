/**
 * Helpers puros (sin dependencias de Hono/DB) para validar el flujo OAuth 2.0.
 * Pueden ejecutarse en Node sin credenciales de Google.
 */

export type OAuthStateError =
  | 'missing_cookie'
  | 'missing_state'
  | 'mismatch'

export type OAuthStateResult =
  | { ok: true }
  | { ok: false; reason: OAuthStateError }

/**
 * Valida que el `state` del query coincida con el valor guardado en cookie.
 * Protege contra ataques CSRF en el flujo OAuth 2.0.
 *
 * @param cookieValue  Valor de la cookie `google_oauth_state` (undefined si no existe)
 * @param queryState   Parámetro `state` recibido en el callback de Google
 */
export function assertGoogleOAuthState(
  cookieValue: string | undefined,
  queryState: string | undefined,
): OAuthStateResult {
  if (!cookieValue) return { ok: false, reason: 'missing_cookie' }
  if (!queryState) return { ok: false, reason: 'missing_state' }
  if (cookieValue !== queryState) return { ok: false, reason: 'mismatch' }
  return { ok: true }
}

/** Mensajes de error legibles para logs / respuestas de API. */
export const OAUTH_STATE_MESSAGES: Record<OAuthStateError, string> = {
  missing_cookie: 'Cookie de estado OAuth no encontrada (posiblemente expiró o bloqueada por browser).',
  missing_state: 'Parámetro state ausente en el callback de Google.',
  mismatch: 'El state del callback no coincide con la cookie (posible CSRF).',
}
