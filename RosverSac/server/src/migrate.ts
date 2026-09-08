import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const here = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const sqlPath = path.resolve(here, '../sql/001_auth_rbac.sql')
  const sql = await fs.readFile(sqlPath, 'utf8')
  await pool.query(sql)
  console.log('✓ Migración 001_auth_rbac aplicada')
  await pool.end()
}

migrate().catch((err) => {
  console.error('Migración falló:', err)
  process.exit(1)
})
