/**
 * Assets de marca en Cloudflare R2 (no bundle Vite/public).
 * Claves subidas con `npx tsx server/scripts/upload-brand-assets.ts`
 */
export const BRAND_KEYS = {
  logoSinfondo: 'brand/logo-sinfondo.png',
  logoConfondo: 'brand/logo-confondo.png',
  logoVertical: 'brand/logo-vertical.png',
  loginHero: 'brand/login-hero-rosver.webp',
  registerHero: 'brand/register-hero-rosver.webp',
} as const

/** URL relativa vía API (Vite proxy / mismo origen en Railway). */
export function brandMediaPath(key: string) {
  return `/api/media/${key.replace(/^\//, '')}`
}
