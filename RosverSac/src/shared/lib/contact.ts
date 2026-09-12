/** Números de atención WhatsApp (Perú). Se reparten en secuencia entre clics. */
export const WHATSAPP_LINES = [
  { e164: '51980202591', display: '+51 980 202 591' },
  { e164: '51960106901', display: '+51 960 106 901' },
] as const

export type WhatsAppLine = (typeof WHATSAPP_LINES)[number]

const SEQ_KEY = 'rosver.wa.seq'

export const WHATSAPP_DEFAULT_MESSAGE =
  'Hola, quiero más información sobre sus productos.'

/** Mensaje prearmado solo para el botón WhatsApp de `/contacto`. */
export const CONTACT_WHATSAPP_MESSAGE =
  'Hola Rosver, quiero contactarme para cotizar productos para mi negocio.'

/** Ambos números visibles en footer / contacto. */
export const WHATSAPP_DISPLAY = WHATSAPP_LINES.map((l) => l.display).join(' · ')

/**
 * @deprecated Preferir `pickWhatsAppNumber()` / `buildWhatsAppLink()`.
 * Primer número (compatibilidad con imports estáticos).
 */
export const WHATSAPP_NUMBER = WHATSAPP_LINES[0].e164

/**
 * @deprecated Preferir `buildWhatsAppLink()` en cada clic para rotar números.
 */
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`

/** Elige el siguiente WhatsApp (secuencia circular persistida en localStorage). */
export function pickWhatsAppNumber(): string {
  return pickWhatsAppLine().e164
}

export function pickWhatsAppLine(): WhatsAppLine {
  if (typeof window === 'undefined') return WHATSAPP_LINES[0]
  let idx = 0
  try {
    idx = Number(window.localStorage.getItem(SEQ_KEY) ?? '0') || 0
  } catch {
    idx = 0
  }
  const line = WHATSAPP_LINES[((idx % WHATSAPP_LINES.length) + WHATSAPP_LINES.length) % WHATSAPP_LINES.length]
  try {
    window.localStorage.setItem(
      SEQ_KEY,
      String((idx + 1) % WHATSAPP_LINES.length),
    )
  } catch {
    /* ignore quota / private mode */
  }
  return line
}

/** Link wa.me con el número rotado y un mensaje opcional. */
export function buildWhatsAppLink(
  message: string = WHATSAPP_DEFAULT_MESSAGE,
): string {
  const number = pickWhatsAppNumber()
  const text = message.trim()
  if (!text) return `https://wa.me/${number}`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

/**
 * Link fijo a un número (sin rotar). Usar en Contacto → siempre 980 202 591.
 */
export function buildFixedWhatsAppLink(
  e164: string,
  message: string,
): string {
  const text = message.trim()
  if (!text) return `https://wa.me/${e164}`
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`
}

/** Abre WhatsApp rotando el número (útil en botones). */
export function openWhatsApp(
  message: string = WHATSAPP_DEFAULT_MESSAGE,
): void {
  window.open(buildWhatsAppLink(message), '_blank', 'noopener,noreferrer')
}
