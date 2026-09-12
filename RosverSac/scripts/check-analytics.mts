import 'dotenv/config'
import pg from 'pg'
import {
  getAnalyticsOverview,
  rebuildDemandCountsFromHistory,
} from '../server/src/lib/product-analytics.ts'

const p = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const sample = await p.query(
  `select items->0 as first_item from order_requests limit 1`,
)
console.log('sample order item', sample.rows[0]?.first_item)

const sumsBefore = await p.query(
  `select coalesce(sum(view_count),0)::int as v,
          coalesce(sum(order_count),0)::int as o,
          coalesce(sum(quote_count),0)::int as q
   from products`,
)
console.log('before', sumsBefore.rows[0])

await rebuildDemandCountsFromHistory()

const sumsAfter = await p.query(
  `select coalesce(sum(view_count),0)::int as v,
          coalesce(sum(order_count),0)::int as o,
          coalesce(sum(quote_count),0)::int as q
   from products`,
)
console.log('after', sumsAfter.rows[0])

const top = await p.query(
  `select slug, view_count, order_count, quote_count, rating, review_count
   from products
   order by order_count desc, view_count desc
   limit 8`,
)
console.log('tops', top.rows)

const overview = await getAnalyticsOverview(14)
console.log(
  JSON.stringify(
    {
      kpis: overview.kpis,
      ordered: overview.tops.ordered.slice(0, 3),
      viewed: overview.tops.viewed.slice(0, 3),
      mix: overview.mix,
      seriesNonZero: overview.series.filter(
        (s) => s.views || s.orders || s.quotes,
      ),
    },
    null,
    2,
  ),
)

await p.end()
