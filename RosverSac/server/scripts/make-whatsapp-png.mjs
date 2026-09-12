import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, '../../public/whatsapp-mark.png')

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  sharp = require('../../node_modules/cssvg-icons/node_modules/sharp')
}

/** Badge verde + ícono blanco (opaco: Gmail/Outlook lo muestran bien). */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="#25D366"/>
  <g transform="translate(8 8) scale(2)">
    <path fill="#FFFFFF" d="M12 3.2A8.3 8.3 0 0 0 4.4 15l-1 3.7 3.8-1A8.3 8.3 0 1 0 12 3.2Zm4.7 11.8c-.2.6-1.1 1-1.6 1.1-.4.1-.9.2-2.9-.6-2.5-1-4.1-3.5-4.2-3.7-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.3.4c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.3 2.5 1.4.3.1.5.1.7-.1l.9-1.1c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.4 0 .2 0 1.1-.5 1.7Z"/>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(out)
console.log('wrote', out, fs.statSync(out).size, 'bytes')
