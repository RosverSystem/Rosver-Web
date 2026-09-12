import { config } from '../config.js'
import { publicUrlForKey } from './r2.js'

/** Claves R2 de marca (mismo set que el front). */
export const BRAND_KEYS = {
  logoSinfondo: 'brand/logo-sinfondo.png',
  logoConfondo: 'brand/logo-confondo.png',
  logoVertical: 'brand/logo-vertical.png',
  loginHero: 'brand/login-hero-rosver.webp',
  registerHero: 'brand/register-hero-rosver.webp',
  whatsappMark: 'brand/whatsapp-mark.png',
} as const

/**
 * URL absoluta para correos (Gmail no carga localhost).
 * Orden: R2_PUBLIC_BASE_URL → APP_URL público → API_URL.
 */
export function absoluteBrandUrl(key: string) {
  if (config.r2.publicBaseUrl) {
    return `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${key}`
  }
  const site = (config.appUrl || '').replace(/\/$/, '')
  // En local APP_URL es Vite; el media vive en la API.
  if (site && !/localhost|127\.0\.0\.1/i.test(site)) {
    return `${site}/api/media/${key}`
  }
  const api = (config.apiUrl || 'http://localhost:8787').replace(/\/$/, '')
  if (!/localhost|127\.0\.0\.1/i.test(api)) {
    return `${api}/api/media/${key}`
  }
  // Fallback: sitio prod Rosver (mismo bucket R2) para que el correo muestre logo.
  return `https://rosver-web-production.up.railway.app/api/media/${key}`
}

export function relativeBrandUrl(key: string) {
  return publicUrlForKey(key)
}
