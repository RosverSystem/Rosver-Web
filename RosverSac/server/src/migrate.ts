import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.resolve(here, '../sql')

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const files = (await fs.readdir(sqlDir))
    .filter((f) => /^\d+_.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'en'))

  const { rows: stamped } = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM _schema_migrations`,
  )
  if (Number(stamped[0]?.n ?? 0) === 0) {
    const { rows: existing } = await pool.query<{ t: string | null }>(
      `SELECT to_regclass('public.users')::text AS t`,
    )
    if (existing[0]?.t) {
      for (const file of files) {
        await pool.query(
          `INSERT INTO _schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [file],
        )
      }
      console.log(
        `✓ Bootstrap: ${files.length} migraciones marcadas (DB ya existía; no se re-ejecutan seeds)`,
      )
      await pool.end()
      return
    }
  }

  for (const file of files) {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM _schema_migrations WHERE id = $1`,
      [file],
    )
    if (rows.length > 0) {
      console.log(`· Migración ${file} ya aplicada (skip)`)
      continue
    }

    const sql = await fs.readFile(path.join(sqlDir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(
        `INSERT INTO _schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [file],
      )
      await client.query('COMMIT')
      console.log(`✓ Migración ${file} aplicada`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  await pool.end()
}

migrate().catch((err) => {
  console.error('Migración falló:', err)
  process.exit(1)
})
