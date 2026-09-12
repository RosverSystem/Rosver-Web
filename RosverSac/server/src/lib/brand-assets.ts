import { config } from '../config.js'
import { publicUrlForKey } from './r2.js'

/** Dominio canónico (Cloudflare → Railway). Nunca usar `.up.railway.app` en correos. */
export const CANONICAL_SITE = 'https://rosversac.com'

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
 * Logos de correo: archivos estáticos en `public/` servidos por el CDN Cloudflare
 * del sitio (no pasan por `/api/media` ni por APP_URL de Railway).
 * Probado: `…railway.app/api/media/brand/…` → 404; `rosversac.com/logo_….png` → 200.
 */
const EMAIL_CDN_LOGOS: Record<string, string> = {
  [BRAND_KEYS.logoConfondo]: `${CANONICAL_SITE}/logo_confondo.png`,
  [BRAND_KEYS.logoSinfondo]: `${CANONICAL_SITE}/logo_sinfondo.png`,
  [BRAND_KEYS.logoVertical]: `${CANONICAL_SITE}/Logo_Vertical.png`,
  [BRAND_KEYS.whatsappMark]: `${CANONICAL_SITE}/whatsapp-mark.png`,
}

function isEphemeralHost(url: string) {
  return /localhost|127\.0\.0\.1|\.up\.railway\.app/i.test(url)
}

/**
 * URL absoluta para correos (Gmail no carga localhost ni hosts internos de Railway).
 * Orden: mapa CDN sitio → R2_PUBLIC_BASE_URL → dominio canónico /api/media.
 */
export function absoluteBrandUrl(key: string) {
  const cdn = EMAIL_CDN_LOGOS[key]
  if (cdn) return cdn

  if (config.r2.publicBaseUrl) {
    return `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${key}`
  }

  const site = (config.appUrl || '').replace(/\/$/, '')
  if (site && !isEphemeralHost(site)) {
    return `${site}/api/media/${key}`
  }

  const api = (config.apiUrl || '').replace(/\/$/, '')
  if (api && !isEphemeralHost(api)) {
    return `${api}/api/media/${key}`
  }

  return `${CANONICAL_SITE}/api/media/${key}`
}

export function relativeBrandUrl(key: string) {
  return publicUrlForKey(key)
}
