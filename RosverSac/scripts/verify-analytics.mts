import 'dotenv/config'
import {
  getAnalyticsOverview,
  rebuildDemandCountsFromHistory,
} from '../server/src/lib/product-analytics.ts'

await rebuildDemandCountsFromHistory()
const o = await getAnalyticsOverview(14)
console.log(
  JSON.stringify(
    {
      kpis: o.kpis,
      mix: o.mix,
      ordered: o.tops.ordered.map((x) => ({
        slug: x.slug,
        orderCount: x.orderCount,
      })),
      quoted: o.tops.quoted.map((x) => ({
        slug: x.slug,
        quoteCount: x.quoteCount,
      })),
      viewed: o.tops.viewed.map((x) => ({
        slug: x.slug,
        viewCount: x.viewCount,
      })),
      trendingTop: o.tops.trending.slice(0, 3).map((x) => ({
        slug: x.slug,
        score: x.score,
        viewCount: x.viewCount,
        orderCount: x.orderCount,
        quoteCount: x.quoteCount,
      })),
      seriesNonZero: o.series.filter((s) => s.views || s.orders || s.quotes),
    },
    null,
    2,
  ),
)
process.exit(0)
