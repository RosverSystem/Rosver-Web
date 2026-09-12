import { api } from '@/shared/lib/api'

const VIEWED_PREFIX = 'rosver_viewed_'

/** Registra vista 1 vez por pestaña (sessionStorage). */
export function trackProductView(slug: string) {
  if (typeof window === 'undefined' || !slug) return
  try {
    const key = `${VIEWED_PREFIX}${slug}`
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
  void api(`/api/catalog/products/${encodeURIComponent(slug)}/view`, {
    method: 'POST',
    body: '{}',
  }).catch(() => {
    /* no bloquear ficha */
  })
}

/** Score de tendencia local (misma idea que API). */
export function productTrendScore(p: {
  viewCount?: number
  orderCount?: number
  quoteCount?: number
  rating?: number
  reviewCount?: number
}) {
  const views = p.viewCount ?? 0
  const orders = p.orderCount ?? 0
  const quotes = p.quoteCount ?? 0
  const rating = p.rating ?? 0
  const reviews = p.reviewCount ?? 0
  return (
    Math.log(views + 1) * 3 +
    Math.log(orders + 1) * 4 +
    Math.log(quotes + 1) * 3.5 +
    rating * Math.log(reviews + 1) * 0.6
  )
}

/** Orden: primero con demanda real, luego score. */
export function compareTrendProducts(
  a: {
    viewCount?: number
    orderCount?: number
    quoteCount?: number
    rating?: number
    reviewCount?: number
    trendingSort?: number
  },
  b: {
    viewCount?: number
    orderCount?: number
    quoteCount?: number
    rating?: number
    reviewCount?: number
    trendingSort?: number
  },
) {
  const da = (a.viewCount ?? 0) + (a.orderCount ?? 0) + (a.quoteCount ?? 0)
  const db = (b.viewCount ?? 0) + (b.orderCount ?? 0) + (b.quoteCount ?? 0)
  const hasA = da > 0 ? 1 : 0
  const hasB = db > 0 ? 1 : 0
  if (hasB !== hasA) return hasB - hasA
  return productTrendScore(b) - productTrendScore(a)
}
