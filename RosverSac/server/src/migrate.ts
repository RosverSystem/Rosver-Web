import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.resolve(here, '../sql')

async function migrate() {
  const files = (await fs.readdir(sqlDir))
    .filter((f) => /^\d+_.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'en'))

  for (const file of files) {
    const sql = await fs.readFile(path.join(sqlDir, file), 'utf8')
    await pool.query(sql)
    console.log(`✓ Migración ${file} aplicada`)
  }

  await pool.end()
}

migrate().catch((err) => {
  console.error('Migración falló:', err)
  process.exit(1)
})
