import { api } from '@/shared/lib/api'
import type { ClientDetail, ClientListItem } from './types'

export function fetchClients(q = '') {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
  return api<{ ok: boolean; clients: ClientListItem[]; count: number }>(
    `/api/admin/clients${qs}`,
  )
}

export function fetchClientDetail(id: string) {
  return api<{ ok: boolean; client: ClientDetail }>(
    `/api/admin/clients/${encodeURIComponent(id)}`,
  )
}

/** Teléfono PE → e164 sin + para wa.me */
export function phoneToWaE164(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9) return null
  if (digits.startsWith('51') && digits.length >= 11) return digits
  if (digits.length === 9) return `51${digits}`
  return digits
}

export function buildClientOfferMessage(
  clientName: string | null,
  products: { name: string; sku: string }[],
) {
  const who = clientName?.trim() || 'cliente'
  const lines = products.slice(0, 5).map((p) => `• ${p.name} (${p.sku})`)
  return [
    `Hola ${who}, te escribe Rosver.`,
    'Vimos tu interés en estos productos y tenemos opciones / ofertas para ti:',
    ...lines,
    '¿Te armo una cotización o combo?',
  ].join('\n')
}
