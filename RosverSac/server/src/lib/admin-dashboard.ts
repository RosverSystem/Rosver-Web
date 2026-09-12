import { pool } from '../db.js'

export type DashboardSummary = {
  ok: true
  updatedAt: string
  kpis: {
    products: number
    clients: number
    ordersOpen: number
    ordersTotal: number
    quotesOpen: number
    quotesTotal: number
    complaintsOpen: number
    totalViews: number
  }
  ordersByStatus: { status: string; count: number }[]
  top1: {
    slug: string
    name: string
    rating: number
    viewCount: number
    quoteCount: number
  } | null
  recentOrders: {
    id: string
    code: string
    status: string
    businessName: string | null
    createdAt: string
  }[]
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    products,
    clients,
    orders,
    quotes,
    complaints,
    views,
    byStatus,
    top,
    recent,
  ] = await Promise.all([
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM products WHERE visible = true`,
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE r.code = 'client' AND u.status = 'active'`,
    ),
    pool.query<{ open: number; total: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'entregado')::int AS open,
         COUNT(*)::int AS total
       FROM order_requests`,
    ),
    pool.query<{ open: number; total: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'cerrada')::int AS open,
         COUNT(*)::int AS total
       FROM quote_requests`,
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM consumer_complaints
       WHERE status IN ('recibido', 'en_revision')`,
    ),
    pool.query<{ n: string }>(
      `SELECT COALESCE(SUM(view_count), 0)::text AS n FROM products`,
    ),
    pool.query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int AS count
       FROM order_requests
       GROUP BY status
       ORDER BY count DESC`,
    ),
    pool.query<{
      slug: string
      name: string
      rating: string
      view_count: number
      quote_count: number
    }>(
      `SELECT slug, name, rating::text, view_count, quote_count
       FROM products
       WHERE visible = true
       ORDER BY
         ((view_count + order_count + quote_count) > 0) DESC,
         (LN(view_count + 1) * 3 + LN(order_count + 1) * 4 + LN(quote_count + 1) * 3.5
          + rating * LN(review_count + 1) * 0.6) DESC
       LIMIT 1`,
    ),
    pool.query(
      `SELECT id, code, status, business_name, created_at
       FROM order_requests
       ORDER BY created_at DESC
       LIMIT 5`,
    ),
  ])

  const t = top.rows[0]
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    kpis: {
      products: Number(products.rows[0]?.n ?? 0),
      clients: Number(clients.rows[0]?.n ?? 0),
      ordersOpen: Number(orders.rows[0]?.open ?? 0),
      ordersTotal: Number(orders.rows[0]?.total ?? 0),
      quotesOpen: Number(quotes.rows[0]?.open ?? 0),
      quotesTotal: Number(quotes.rows[0]?.total ?? 0),
      complaintsOpen: Number(complaints.rows[0]?.n ?? 0),
      totalViews: Number(views.rows[0]?.n ?? 0),
    },
    ordersByStatus: byStatus.rows.map((r) => ({
      status: String(r.status),
      count: Number(r.count),
    })),
    top1: t
      ? {
          slug: String(t.slug),
          name: String(t.name),
          rating: Number(t.rating),
          viewCount: Number(t.view_count),
          quoteCount: Number(t.quote_count),
        }
      : null,
    recentOrders: recent.rows.map((o) => ({
      id: String(o.id),
      code: String(o.code),
      status: String(o.status),
      businessName: o.business_name ? String(o.business_name) : null,
      createdAt: String(o.created_at),
    })),
  }
}
