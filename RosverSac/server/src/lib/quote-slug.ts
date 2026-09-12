/**
 * Slug público: nombre-cliente + número (ej. rosa-sac-pd-2026-000003).
 */
export function slugifyPart(raw: string, max = 48): string {
  const s = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
  return s || 'cliente'
}

export function makePublicDocSlug(businessName: string, code: string): string {
  const name = slugifyPart(businessName)
  const num = slugifyPart(code, 64)
  return `${name}-${num}`
}

/** @deprecated usar makePublicDocSlug */
export const makeQuotePublicSlug = makePublicDocSlug

export const PUBLIC_LINK_DAYS = 15
export const QUOTE_LINK_DAYS = PUBLIC_LINK_DAYS

export function publicLinkExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + PUBLIC_LINK_DAYS * 24 * 60 * 60 * 1000)
}

/** @deprecated usar publicLinkExpiresAt */
export const quoteLinkExpiresAt = publicLinkExpiresAt
