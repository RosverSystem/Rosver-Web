import { pool } from '../src/db.ts'

const before = await pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM products')
console.log('products before', before.rows[0]?.n)

await pool.query('DELETE FROM products')

const seq = await pool.query<{ s: string | null }>(
  `SELECT pg_get_serial_sequence('products','code') AS s`,
)
if (seq.rows[0]?.s) {
  await pool.query('SELECT setval($1::regclass, 0, false)', [seq.rows[0].s])
  console.log('reset seq', seq.rows[0].s)
}

const after = await pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM products')
console.log('products after', after.rows[0]?.n)
await pool.end()
