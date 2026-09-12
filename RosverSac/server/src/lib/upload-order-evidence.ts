import { randomUUID } from 'node:crypto'
import { putPublicObject, r2Enabled } from './r2.js'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

const MAX_BYTES = 5 * 1024 * 1024

export type OrderEvidenceKind = 'payment' | 'voucher' | 'delivery'

export function isOrderEvidenceKind(v: string): v is OrderEvidenceKind {
  return v === 'payment' || v === 'voucher' || v === 'delivery'
}

/**
 * Sube captura/voucher/prueba de pedido.
 * Prefijo fijo `orders/evidence/` — no mezcla con products/, brands/, avatars/.
 */
export async function uploadOrderEvidence(input: {
  file: File
  orderId: string
  kind: OrderEvidenceKind
}): Promise<
  | { ok: true; url: string; key: string }
  | { ok: false; error: string; status: 400 | 503 }
> {
  if (!r2Enabled()) {
    return {
      ok: false,
      error: 'Almacenamiento no configurado en el servidor.',
      status: 503,
    }
  }
  if (!ALLOWED_TYPES.has(input.file.type)) {
    return {
      ok: false,
      error: 'Formato no permitido. Usa JPG, PNG, WebP, GIF o PDF.',
      status: 400,
    }
  }
  if (input.file.size > MAX_BYTES) {
    return {
      ok: false,
      error: 'El archivo no debe superar 5 MB.',
      status: 400,
    }
  }

  const ext =
    input.file.type === 'application/pdf'
      ? 'pdf'
      : input.file.type === 'image/png'
        ? 'png'
        : input.file.type === 'image/webp'
          ? 'webp'
          : input.file.type === 'image/gif'
            ? 'gif'
            : 'jpg'

  const key = `orders/evidence/${input.orderId}/${input.kind}-${randomUUID().slice(0, 10)}.${ext}`
  const buf = Buffer.from(await input.file.arrayBuffer())
  const url = await putPublicObject({
    key,
    body: buf,
    contentType: input.file.type,
  })
  return { ok: true, url, key }
}
