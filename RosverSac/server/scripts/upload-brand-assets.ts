/**
 * Sube assets de marca (logo + heroes auth) a R2 bajo brand/.
 * Uso: npx tsx server/scripts/upload-brand-assets.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { putPublicObject, publicUrlForKey, r2Enabled } from '../src/lib/r2.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(here, '../../public')

const FILES: { file: string; key: string; contentType: string }[] = [
  {
    file: 'logo_sinfondo.png',
    key: 'brand/logo-sinfondo.png',
    contentType: 'image/png',
  },
  {
    file: 'logo_confondo.png',
    key: 'brand/logo-confondo.png',
    contentType: 'image/png',
  },
  {
    file: 'Logo_Vertical.png',
    key: 'brand/logo-vertical.png',
    contentType: 'image/png',
  },
  {
    file: 'login-hero-rosver.webp',
    key: 'brand/login-hero-rosver.webp',
    contentType: 'image/webp',
  },
  {
    file: 'register-hero-rosver.webp',
    key: 'brand/register-hero-rosver.webp',
    contentType: 'image/webp',
  },
  {
    file: 'whatsapp-mark.png',
    key: 'brand/whatsapp-mark.png',
    contentType: 'image/png',
  },
]

async function main() {
  if (!r2Enabled()) {
    console.error('R2 no configurado (.env)')
    process.exit(1)
  }
  for (const item of FILES) {
    const full = path.join(publicDir, item.file)
    if (!fs.existsSync(full)) {
      console.warn('skip missing', item.file)
      continue
    }
    const body = fs.readFileSync(full)
    const url = await putPublicObject({
      key: item.key,
      body,
      contentType: item.contentType,
    })
    console.log('OK', item.key, '→', url || publicUrlForKey(item.key))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
