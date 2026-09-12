/**
 * Sube public/whatsapp-mark.png a R2 (brand/whatsapp-mark.png).
 * Uso: npx tsx server/scripts/upload-whatsapp-mark.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { putPublicObject, publicUrlForKey, r2Enabled } from '../src/lib/r2.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = path.resolve(here, '../../public/whatsapp-mark.png')
const key = 'brand/whatsapp-mark.png'

async function main() {
  if (!r2Enabled()) {
    console.error('R2 no configurado (.env)')
    process.exit(1)
  }
  if (!fs.existsSync(file)) {
    console.error('Falta', file)
    process.exit(1)
  }
  const url = await putPublicObject({
    key,
    body: fs.readFileSync(file),
    contentType: 'image/png',
  })
  console.log('OK', key, '→', url || publicUrlForKey(key))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
