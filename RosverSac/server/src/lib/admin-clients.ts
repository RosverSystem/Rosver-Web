import { pool } from '../db.js'

export type ClientListItem = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  documentType: string | null
  documentNumber: string | null
  status: string
  emailVerified: boolean
  createdAt: string
  viewProductCount: number
  totalViews: number
  lastViewedAt: string | null
  orderCount: number
  quoteCount: number
}

export type ClientInterestProduct = {
  id: string
  slug: string
  name: string
  sku: string
  imageUrl?: string
  rating: number
  price: number | null
  viewCount: number
  lastViewedAt: string
  firstViewedAt: string
}

export async function listClients(opts?: {
  q?: string
}): Promise<ClientListItem[]> {
  const q = opts?.q?.trim() || ''
  const params: unknown[] = []
  let filter = `r.code = 'client'`
  if (q) {
    params.push(`%${q}%`)
    filter += ` AND (
      u.email ILIKE $1
      OR COALESCE(u.full_name, '') ILIKE $1
      OR COALESCE(u.phone, '') ILIKE $1
      OR COALESCE(u.company_name, '') ILIKE $1
      OR COALESCE(u.document_number, '') ILIKE $1
    )`
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.company_name,
            u.document_type, u.document_number, u.status,
            u.email_verified_at, u.created_at,
            COALESCE(v.product_count, 0)::int AS view_product_count,
            COALESCE(v.total_views, 0)::int AS total_views,
            v.last_viewed_at,
            COALESCE(o.order_count, 0)::int AS order_count,
            COALESCE(q.quote_count, 0)::int AS quote_count
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS product_count,
              COALESCE(SUM(view_count), 0)::int AS total_views,
              MAX(last_viewed_at) AS last_viewed_at
       FROM user_product_views upv
       WHERE upv.user_id = u.id
     ) v ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS order_count
       FROM order_requests o
       WHERE o.user_id = u.id
     ) o ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS quote_count
       FROM quote_requests qq
       WHERE qq.user_id = u.id
     ) q ON true
     WHERE ${filter}
     ORDER BY COALESCE(v.last_viewed_at, u.created_at) DESC`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    fullName: row.full_name ? String(row.full_name) : null,
    phone: row.phone ? String(row.phone) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    documentType: row.document_type ? String(row.document_type) : null,
    documentNumber: row.document_number ? String(row.document_number) : null,
    status: String(row.status),
    emailVerified: row.email_verified_at != null,
    createdAt: String(row.created_at),
    viewProductCount: Number(row.view_product_count ?? 0),
    totalViews: Number(row.total_views ?? 0),
    lastViewedAt: row.last_viewed_at ? String(row.last_viewed_at) : null,
    orderCount: Number(row.order_count ?? 0),
    quoteCount: Number(row.quote_count ?? 0),
  }))
}

async function interestProducts(
  userId: string,
  order: 'freq' | 'recent',
  limit = 12,
): Promise<ClientInterestProduct[]> {
  const orderSql =
    order === 'freq'
      ? `upv.view_count DESC, upv.last_viewed_at DESC`
      : `upv.last_viewed_at DESC`
  const { rows } = await pool.query(
    `SELECT p.id, p.slug, p.name, p.sku, p.image_url, p.rating,
            upv.view_count, upv.last_viewed_at, upv.first_viewed_at,
            (
              SELECT pr.amount FROM product_prices pr
              JOIN product_packagings pk ON pk.id = pr.packaging_id
              WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'list'
              ORDER BY pk.is_default DESC, pr.min_qty ASC
              LIMIT 1
            ) AS list_price
     FROM user_product_views upv
     JOIN products p ON p.id = upv.product_id
     WHERE upv.user_id = $1 AND p.visible = true
     ORDER BY ${orderSql}
     LIMIT $2`,
    [userId, limit],
  )
  return rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    sku: String(r.sku),
    imageUrl: r.image_url ? String(r.image_url) : undefined,
    rating: Number(r.rating ?? 0),
    price: r.list_price != null ? Number(r.list_price) : null,
    viewCount: Number(r.view_count ?? 0),
    lastViewedAt: String(r.last_viewed_at),
    firstViewedAt: String(r.first_viewed_at),
  }))
}

export async function getClientDetail(userId: string) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.company_name,
            u.document_type, u.document_number, u.status, u.avatar_url,
            u.email_verified_at, u.created_at,
            r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND r.code = 'client'
     LIMIT 1`,
    [userId],
  )
  const u = rows[0]
  if (!u) return null

  const [frequent, recent, orders, quotes] = await Promise.all([
    interestProducts(userId, 'freq', 12),
    interestProducts(userId, 'recent', 12),
    pool.query(
      `SELECT id, code, status, total_estimated, created_at, business_name
       FROM order_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [userId],
    ),
    pool.query(
      `SELECT id, code, status, total_estimated, created_at, business_name, public_slug
       FROM quote_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [userId],
    ),
  ])

  return {
    id: String(u.id),
    email: String(u.email),
    fullName: u.full_name ? String(u.full_name) : null,
    phone: u.phone ? String(u.phone) : null,
    companyName: u.company_name ? String(u.company_name) : null,
    documentType: u.document_type ? String(u.document_type) : null,
    documentNumber: u.document_number ? String(u.document_number) : null,
    status: String(u.status),
    avatarUrl: u.avatar_url ? String(u.avatar_url) : null,
    emailVerified: u.email_verified_at != null,
    createdAt: String(u.created_at),
    frequentProducts: frequent,
    recentProducts: recent,
    orders: orders.rows.map((o) => ({
      id: String(o.id),
      code: String(o.code),
      status: String(o.status),
      totalEstimated:
        o.total_estimated != null ? Number(o.total_estimated) : null,
      createdAt: String(o.created_at),
      businessName: o.business_name ? String(o.business_name) : null,
    })),
    quotes: quotes.rows.map((q) => ({
      id: String(q.id),
      code: String(q.code),
      status: String(q.status),
      totalEstimated:
        q.total_estimated != null ? Number(q.total_estimated) : null,
      createdAt: String(q.created_at),
      businessName: q.business_name ? String(q.business_name) : null,
      publicSlug: q.public_slug ? String(q.public_slug) : null,
    })),
  }
}
