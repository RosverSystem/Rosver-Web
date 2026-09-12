export type AnalyticsTopItem = {
  id: string
  slug: string
  name: string
  sku: string
  imageUrl?: string
  rating: number
  reviewCount: number
  viewCount: number
  orderCount: number
  quoteCount: number
  score: number
}

export type AnalyticsOverview = {
  ok: boolean
  updatedAt: string
  kpis: {
    products: number
    totalViews: number
    totalOrdersUnits: number
    totalQuotesUnits: number
    ratedProducts: number
    top1: AnalyticsTopItem | null
  }
  tops: {
    rated: AnalyticsTopItem[]
    viewed: AnalyticsTopItem[]
    ordered: AnalyticsTopItem[]
    quoted: AnalyticsTopItem[]
    trending: AnalyticsTopItem[]
  }
  series: { day: string; views: number; orders: number; quotes: number }[]
  mix: { views: number; orders: number; quotes: number; reviews: number }
}
