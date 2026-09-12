import 'dotenv/config'
import pg from 'pg'

const p = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const q = await p.query('select count(*)::int as n from quote_requests')
const s = await p.query('select items->0 as i from quote_requests limit 1')
const o = await p.query(
  `select date(created_at) as d, count(*)::int as n from order_requests group by 1 order by 1`,
)
console.log({ quotes: q.rows[0].n, sample: s.rows[0], ordersByDay: o.rows })
await p.end()
