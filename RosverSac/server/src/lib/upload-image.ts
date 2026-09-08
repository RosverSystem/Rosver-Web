import { randomUUID } from 'node:crypto'
import { putPublicObject, r2Enabled } from './r2.js'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_BYTES = 2.5 * 1024 * 1024

export type UploadFolder = 'categories' | 'brands' | 'products'

export function isUploadFolder(v: string): v is UploadFolder {
  return v === 'categories' || v === 'brands' || v === 'products'
}

export async function uploadPublicImage(input: {
  file: File
  folder: UploadFolder
}): Promise<{ ok: true; url: string; key: string } | { ok: false; error: string; status: 400 | 503 }> {
  if (!r2Enabled()) {
    return {
      ok: false,
      error: 'Almacenamiento de imágenes no configurado en el servidor.',
      status: 503,
    }
  }
  if (!ALLOWED_TYPES.has(input.file.type)) {
    return {
      ok: false,
      error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF.',
      status: 400,
    }
  }
  if (input.file.size > MAX_BYTES) {
    return {
      ok: false,
      error: 'La imagen no debe superar 2.5 MB.',
      status: 400,
    }
  }

  const ext =
    input.file.type === 'image/png'
      ? 'png'
      : input.file.type === 'image/webp'
        ? 'webp'
        : input.file.type === 'image/gif'
          ? 'gif'
          : 'jpg'

  const key = `${input.folder}/${randomUUID()}.${ext}`
  const buf = Buffer.from(await input.file.arrayBuffer())
  const url = await putPublicObject({
    key,
    body: buf,
    contentType: input.file.type,
  })
  return { ok: true, url, key }
}
