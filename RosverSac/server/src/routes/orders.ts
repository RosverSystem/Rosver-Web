import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../config.js'
import { pool } from '../db.js'
import {
  makePublicDocSlug,
  publicLinkExpiresAt,
  PUBLIC_LINK_DAYS,
} from '../lib/quote-slug.js'
import {
  deletePublicObject,
  putPublicObject,
  r2Enabled,
} from '../lib/r2.js'
import {
  isOrderEvidenceKind,
  uploadOrderEvidence,
} from '../lib/upload-order-evidence.js'
import { resolveSessionUser } from '../lib/session.js'
import { resolveUbigeo } from '../lib/ubigeo.js'
import { applyPromosToItems } from '../lib/product-promos.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

/** Pedidos (carrito) — distinto de cotizaciones (`/api/quotes`). */
export const ordersRoutes = new Hono()
export const adminOrdersRoutes = new Hono<{ Variables: AuthVariables }>()

adminOrdersRoutes.use('*', requireAuth, requireRole('admin'))

const ubigeoPart = z.object({
  departmentCode: z.string().trim().min(2).max(2),
  provinceCode: z.string().trim().min(4).max(4),
  districtCode: z.string().trim().min(6).max(6),
})

const itemSchema = z.object({
  lineKind: z.enum(['product', 'combo']).optional().default('product'),
  productSlug: z.string().trim().min(1).max(120),
  productName: z.string().trim().min(1).max(240),
  presentation: z.string().trim().min(1).max(40),
  quantity: z.number().int().min(1).max(99999),
  unitPrice: z.number().nonnegative().nullable().optional(),
  comboId: z.string().uuid().optional().nullable(),
  comboSnapshot: z.record(z.string(), z.unknown()).optional().nullable(),
})

const createSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, { message: 'Indica el nombre o razón social.' })
    .max(160),
  documentNumber: z.string().trim().max(20).optional().nullable(),
  phone: z
    .string()
    .trim()
    .min(9, { message: 'El teléfono o WhatsApp es obligatorio.' })
    .max(40),
  shipAddress: z
    .string()
    .trim()
    .min(5, { message: 'Escribe la dirección completa.' })
    .max(240),
  ship: ubigeoPart,
  agencyName: z
    .string()
    .trim()
    .min(2, { message: 'Indica el nombre de la agencia.' })
    .max(160),
  items: z.array(itemSchema).min(1).max(80),
  totalEstimated: z.number().nonnegative().nullable().optional(),
})

const pdfSchema = z.object({
  pdfBase64: z.string().min(20).max(12_000_000),
})

async function nextOrderCode(): Promise<string> {
  const year = new Date().getFullYear()
  const { rows } = await pool.query<{ n: string }>(
    `SELECT nextval('order_requests_code_seq')::text AS n`,
  )
  const n = String(rows[0]?.n ?? '1').padStart(6, '0')
  return `PD-${year}-${n}`
}

function shareUrlForSlug(slug: string) {
  return `${config.appUrl.replace(/\/$/, '')}/p/${encodeURIComponent(slug)}`
}

async function purgeExpiredOrderLinks() {
  const { rows } = await pool.query<{ id: string; pdf_r2_key: string | null }>(
    `SELECT id, pdf_r2_key FROM order_requests
     WHERE link_expires_at IS NOT NULL
       AND link_expires_at < now()
       AND (pdf_bytes IS NOT NULL OR pdf_r2_key IS NOT NULL)
     LIMIT 40`,
  )
  for (const row of rows) {
    if (row.pdf_r2_key && r2Enabled()) {
      try {
        await deletePublicObject(row.pdf_r2_key)
      } catch {
        /* ignore */
      }
    }
    await pool.query(
      `UPDATE order_requests SET pdf_bytes = NULL, pdf_r2_key = NULL WHERE id = $1`,
      [row.id],
    )
  }
}

ordersRoutes.post('/', async (c) => {
  const body = createSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos incompletos.' },
      400,
    )
  }
  const d = body.data
  if (d.phone.replace(/\D/g, '').length < 9) {
    return c.json({ error: 'El WhatsApp/teléfono no es válido.' }, 400)
  }

  const ship = resolveUbigeo(d.ship)
  if (!ship) {
    return c.json(
      {
        error:
          'La ubicación de entrega no es válida. Revisa departamento, provincia y distrito.',
      },
      400,
    )
  }

  void purgeExpiredOrderLinks()
  const sessionUser = await resolveSessionUser(c)

  // Límite por usuario en combos (carrito + pedidos previos si hay sesión)
  {
    const { getOfferComboById, countUserComboPurchases } = await import(
      '../lib/offer-combos.js'
    )
    for (const it of d.items) {
      if (it.lineKind !== 'combo' || !it.comboId) continue
      const combo = await getOfferComboById(it.comboId)
      if (!combo?.maxPerUser) continue
      const already = sessionUser?.id
        ? await countUserComboPurchases(sessionUser.id, it.comboId)
        : 0
      if (already + it.quantity > combo.maxPerUser) {
        const left = Math.max(0, combo.maxPerUser - already)
        return c.json(
          {
            error:
              left <= 0
                ? `Ya alcanzaste el límite de compra del combo «${combo.name}» (${combo.maxPerUser} por usuario).`
                : `Solo puedes pedir ${left} unidad(es) más del combo «${combo.name}» (máx. ${combo.maxPerUser} por usuario).`,
          },
          400,
        )
      }
    }
  }

  // Aplicar promos BOGO server-side (recalcular lineTotals; nunca confiar en el cliente)
  const promoResult = await applyPromosToItems(d.items)
  const itemsWithPromo = promoResult.items
  const serverTotal =
    promoResult.promosApplied > 0
      ? promoResult.totalEstimated
      : (d.totalEstimated ?? null)

  const code = await nextOrderCode()
  let publicSlug = makePublicDocSlug(d.businessName, code)
  const expiresAt = publicLinkExpiresAt()

  for (let i = 0; i < 3; i++) {
    const exists = await pool.query(
      `SELECT 1 FROM order_requests WHERE public_slug = $1 LIMIT 1`,
      [publicSlug],
    )
    if (exists.rowCount === 0) break
    publicSlug = `${makePublicDocSlug(d.businessName, code)}-${i + 2}`
  }

  const { rows } = await pool.query(
    `INSERT INTO order_requests (
       code, business_name, document_number, phone,
       ship_department_code, ship_department_name,
       ship_province_code, ship_province_name,
       ship_district_code, ship_district_name, ship_address,
       agency_name,
       items, total_estimated, user_id, public_slug, link_expires_at,
       status
     ) VALUES (
       $1,$2,$3,$4,
       $5,$6,$7,$8,$9,$10,$11,
       $12,
       $13::jsonb,$14,$15,$16,$17,
       'confirmacion_pedido'
     )
     RETURNING id, code, public_slug, link_expires_at, created_at, business_name, status`,
    [
      code,
      d.businessName,
      d.documentNumber?.trim() || null,
      d.phone.trim(),
      ship.departmentCode,
      ship.departmentName,
      ship.provinceCode,
      ship.provinceName,
      ship.districtCode,
      ship.districtName,
      d.shipAddress,
      d.agencyName,
      JSON.stringify(itemsWithPromo),
      serverTotal,
      sessionUser?.id ?? null,
      publicSlug,
      expiresAt.toISOString(),
    ],
  )

  const row = rows[0]
  const slug = row.public_slug as string

  void import('../lib/product-analytics.js')
    .then(({ bumpDemandFromLines }) =>
      bumpDemandFromLines('orders', d.items),
    )
    .catch((err) => console.error('order analytics bump', err))

  return c.json({
    ok: true,
    id: row.id,
    code: row.code as string,
    status: row.status as string,
    publicSlug: slug,
    shareUrl: shareUrlForSlug(slug),
    linkExpiresAt: row.link_expires_at,
    linkDays: PUBLIC_LINK_DAYS,
    createdAt: row.created_at,
    businessName: row.business_name,
  })
})

ordersRoutes.put('/:id/pdf', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Pedido no válido.' }, 400)
  }
  const body = pdfSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'PDF inválido o demasiado grande.' }, 400)
  }
  const raw = body.data.pdfBase64.replace(/^data:application\/pdf;base64,/, '')
  let pdfBytes: Buffer
  try {
    pdfBytes = Buffer.from(raw, 'base64')
  } catch {
    return c.json({ error: 'No se pudo leer el PDF.' }, 400)
  }
  if (pdfBytes.length < 20 || pdfBytes.length > 8_000_000) {
    return c.json({ error: 'El PDF no tiene un tamaño válido.' }, 400)
  }
  if (pdfBytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return c.json({ error: 'El archivo no es un PDF válido.' }, 400)
  }

  const { rows } = await pool.query<{
    id: string
    public_slug: string | null
    link_expires_at: string | null
    pdf_bytes: Buffer | null
    pdf_r2_key: string | null
  }>(
    `SELECT id, public_slug, link_expires_at, pdf_bytes, pdf_r2_key FROM order_requests WHERE id = $1`,
    [id],
  )
  const order = rows[0]
  if (!order) return c.json({ error: 'Pedido no encontrado.' }, 404)
  if (
    order.link_expires_at &&
    new Date(order.link_expires_at).getTime() < Date.now()
  ) {
    return c.json({ error: 'El link de este pedido ya venció.' }, 410)
  }
  // El PDF se sube una sola vez (justo tras crear el pedido, desde el mismo
  // cliente). No hay sesión asociada al UUID, así que una vez fijado no se
  // permite sobrescribir — evita que alguien con el id reemplace el archivo.
  if (order.pdf_bytes || order.pdf_r2_key) {
    return c.json({ error: 'Este pedido ya tiene un PDF guardado.' }, 409)
  }

  let r2Key: string | null = null
  if (r2Enabled() && order.public_slug) {
    r2Key = `orders/${order.public_slug}.pdf`
    try {
      await putPublicObject({
        key: r2Key,
        body: pdfBytes,
        contentType: 'application/pdf',
      })
    } catch {
      r2Key = null
    }
  }

  await pool.query(
    `UPDATE order_requests SET pdf_bytes = $2, pdf_r2_key = $3 WHERE id = $1`,
    [id, pdfBytes, r2Key],
  )

  return c.json({
    ok: true,
    pdfUrl: order.public_slug
      ? `/api/orders/public/${encodeURIComponent(order.public_slug)}/pdf`
      : null,
  })
})

type PublicOrderRow = {
  id: string
  code: string
  business_name: string
  document_number: string | null
  phone: string
  ship_address: string | null
  ship_department_name: string | null
  ship_province_name: string | null
  ship_district_name: string | null
  agency_name: string | null
  items: unknown
  total_estimated: string | null
  public_slug: string
  link_expires_at: string
  created_at: string
  has_pdf: boolean
}

async function loadPublicOrder(slug: string) {
  const { rows } = await pool.query<PublicOrderRow>(
    `SELECT id, code, business_name, document_number, phone,
            ship_address, ship_department_name, ship_province_name, ship_district_name,
            agency_name, items, total_estimated,
            public_slug, link_expires_at, created_at,
            (pdf_bytes IS NOT NULL OR pdf_r2_key IS NOT NULL) AS has_pdf
     FROM order_requests WHERE public_slug = $1`,
    [slug],
  )
  const row = rows[0]
  if (!row) return { ok: false as const, status: 404 as const, error: 'Pedido no encontrado.' }

  if (new Date(row.link_expires_at).getTime() < Date.now()) {
    if (row.has_pdf) {
      const full = await pool.query<{ pdf_r2_key: string | null }>(
        `SELECT pdf_r2_key FROM order_requests WHERE id = $1`,
        [row.id],
      )
      const key = full.rows[0]?.pdf_r2_key
      if (key && r2Enabled()) {
        try {
          await deletePublicObject(key)
        } catch {
          /* ignore */
        }
      }
      await pool.query(
        `UPDATE order_requests SET pdf_bytes = NULL, pdf_r2_key = NULL WHERE id = $1`,
        [row.id],
      )
    }
    return {
      ok: false as const,
      status: 410 as const,
      error: 'Este link de pedido expiró (vigencia 15 días).',
    }
  }
  return { ok: true as const, row }
}

ordersRoutes.get('/public/:slug', async (c) => {
  const slug = decodeURIComponent(c.req.param('slug'))
  const loaded = await loadPublicOrder(slug)
  if (!loaded.ok) return c.json({ error: loaded.error }, loaded.status)
  const r = loaded.row
  const items = Array.isArray(r.items) ? r.items : []
  return c.json({
    kind: 'order',
    code: r.code,
    businessName: r.business_name,
    documentNumber: r.document_number,
    phone: r.phone,
    shipAddress: r.ship_address,
    shipDepartment: r.ship_department_name,
    shipProvince: r.ship_province_name,
    shipDistrict: r.ship_district_name,
    agencyName: r.agency_name,
    items,
    totalEstimated:
      r.total_estimated != null ? Number(r.total_estimated) : null,
    publicSlug: r.public_slug,
    shareUrl: shareUrlForSlug(r.public_slug),
    linkExpiresAt: r.link_expires_at,
    createdAt: r.created_at,
    hasPdf: r.has_pdf,
    pdfUrl: r.has_pdf
      ? `/api/orders/public/${encodeURIComponent(r.public_slug)}/pdf`
      : null,
  })
})

ordersRoutes.get('/public/:slug/pdf', async (c) => {
  const slug = decodeURIComponent(c.req.param('slug'))
  const loaded = await loadPublicOrder(slug)
  if (!loaded.ok) return c.json({ error: loaded.error }, loaded.status)

  const { rows } = await pool.query<{
    pdf_bytes: Buffer | null
    pdf_r2_key: string | null
  }>(`SELECT pdf_bytes, pdf_r2_key FROM order_requests WHERE id = $1`, [
    loaded.row.id,
  ])
  const pdf = rows[0]
  if (!pdf?.pdf_bytes && !pdf?.pdf_r2_key) {
    return c.json({ error: 'PDF aún no disponible.' }, 404)
  }
  if (pdf.pdf_bytes) {
    return new Response(new Uint8Array(pdf.pdf_bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${slug}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }
  return c.redirect(`/api/media/${pdf.pdf_r2_key}`)
})

/** Pedidos del usuario autenticado (área /cuenta). */
ordersRoutes.get('/mine', async (c) => {
  const user = await resolveSessionUser(c)
  if (!user) return c.json({ error: 'Debes iniciar sesión.' }, 401)

  const { rows } = await pool.query(
    `SELECT ${ORDER_DETAIL_COLS}
     FROM order_requests
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [user.id],
  )

  const items = []
  for (const row of rows) {
    items.push(await mapOrderForAccount(row))
  }
  return c.json({ items })
})

ordersRoutes.get('/mine/:code', async (c) => {
  const user = await resolveSessionUser(c)
  if (!user) return c.json({ error: 'Debes iniciar sesión.' }, 401)
  const code = decodeURIComponent(c.req.param('code') || '').trim()
  if (!code || code.length > 40) {
    return c.json({ error: 'Código de pedido no válido.' }, 400)
  }
  const { rows } = await pool.query(
    `SELECT ${ORDER_DETAIL_COLS}
     FROM order_requests
     WHERE user_id = $1 AND code = $2
     LIMIT 1`,
    [user.id, code],
  )
  if (!rows[0]) return c.json({ error: 'Pedido no encontrado.' }, 404)
  return c.json({ order: await mapOrderForAccount(rows[0]) })
})

adminOrdersRoutes.get('/', async (c) => {
  const codeQ = (c.req.query('code') ?? '').trim()
  if (codeQ) {
    const { rows } = await pool.query(
      `SELECT ${ORDER_DETAIL_COLS} FROM order_requests WHERE code = $1 LIMIT 1`,
      [codeQ],
    )
    if (!rows[0]) return c.json({ error: 'Pedido no encontrado.' }, 404)
    return c.json({ order: await mapOrderDetail(rows[0]) })
  }

  const { rows } = await pool.query(
    `SELECT id, code, business_name, phone, items, total_estimated, status,
            ship_address, ship_district_name, ship_province_name, ship_department_name,
            agency_name, public_slug, link_expires_at, created_at
     FROM order_requests
     ORDER BY created_at DESC
     LIMIT 200`,
  )
  return c.json({
    items: rows.map((r) => {
      const items = Array.isArray(r.items) ? r.items : []
      return {
        id: r.id,
        code: r.code,
        businessName: r.business_name,
        phone: r.phone,
        status: String(r.status ?? 'confirmacion_pedido'),
        shipAddress: r.ship_address,
        shipDistrict: r.ship_district_name,
        shipProvince: r.ship_province_name,
        shipDepartment: r.ship_department_name,
        agencyName: r.agency_name,
        itemCount: items.length,
        totalEstimated:
          r.total_estimated != null ? Number(r.total_estimated) : null,
        publicSlug: r.public_slug,
        shareUrl: r.public_slug ? shareUrlForSlug(r.public_slug as string) : null,
        linkExpiresAt: r.link_expires_at,
        createdAt: r.created_at,
      }
    }),
  })
})

const PIPELINE_STATUSES = [
  'confirmacion_pedido',
  'confirmacion_pago',
  'realizando_envio',
  'enviado',
  'entregado',
] as const

type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

type OrderItemRaw = {
  lineKind?: string
  productSlug?: string
  productName?: string
  presentation?: string
  quantity?: number
  unitPrice?: number | null
  comboId?: string | null
  comboSnapshot?: Record<string, unknown> | null
}

type EvidenceRow = {
  payment_proof_url: string | null
  payment_proof_key: string | null
  payment_note: string | null
  ship_carrier: string | null
  ship_data_note: string | null
  tracking_number: string | null
  shipping_voucher_url: string | null
  shipping_voucher_key: string | null
  delivery_proof_url: string | null
  delivery_proof_key: string | null
  delivery_note: string | null
}

function evidenceFromRow(r: EvidenceRow) {
  return {
    paymentProofUrl: r.payment_proof_url,
    paymentNote: r.payment_note,
    shipCarrier: r.ship_carrier,
    shipDataNote: r.ship_data_note,
    trackingNumber: r.tracking_number,
    shippingVoucherUrl: r.shipping_voucher_url,
    deliveryProofUrl: r.delivery_proof_url,
    deliveryNote: r.delivery_note,
  }
}

function missingEvidenceForStatus(
  status: PipelineStatus,
  ev: ReturnType<typeof evidenceFromRow>,
): string | null {
  if (status === 'confirmacion_pago') {
    if (!ev.paymentProofUrl?.trim()) {
      return 'Subí la captura del pago antes de pasar a Confirmación de pago.'
    }
  }
  if (status === 'realizando_envio') {
    if (!ev.shipCarrier?.trim() && !ev.shipDataNote?.trim()) {
      return 'Completá los datos de envío (agencia/courier o nota) antes de continuar.'
    }
  }
  if (status === 'enviado') {
    if (!ev.trackingNumber?.trim() && !ev.shippingVoucherUrl?.trim()) {
      return 'Indicá el número de envío o subí el voucher antes de marcar Enviado.'
    }
  }
  if (status === 'entregado') {
    if (!ev.deliveryProofUrl?.trim()) {
      return 'Subí la prueba de entrega antes de marcar Entregado.'
    }
  }
  return null
}

async function enrichOrderItems(raw: unknown) {
  const items = (Array.isArray(raw) ? raw : []) as OrderItemRaw[]
  const slugs = [
    ...new Set(
      items
        .filter((i) => i.lineKind !== 'combo')
        .map((i) => (typeof i.productSlug === 'string' ? i.productSlug : ''))
        .filter(Boolean),
    ),
  ]
  const bySlug = new Map<
    string,
    { sku: string; name: string; code: number; image_url: string | null }
  >()
  if (slugs.length > 0) {
    const { rows } = await pool.query<{
      slug: string
      sku: string
      name: string
      code: number
      image_url: string | null
    }>(
      `SELECT slug, sku, name, code, image_url
       FROM products WHERE slug = ANY($1::text[])`,
      [slugs],
    )
    for (const p of rows) {
      bySlug.set(p.slug, {
        sku: p.sku,
        name: p.name,
        code: Number(p.code),
        image_url: p.image_url,
      })
    }
  }
  return items.map((i) => {
    const qty = Number(i.quantity) || 0
    const unit = i.unitPrice != null ? Number(i.unitPrice) : null
    const lineTotal =
      unit != null && Number.isFinite(unit) ? unit * qty : null
    const lineKind = i.lineKind === 'combo' ? 'combo' : 'product'
    const slug = typeof i.productSlug === 'string' ? i.productSlug : ''
    const cat = lineKind === 'product' && slug ? bySlug.get(slug) : undefined
    const snap = i.comboSnapshot && typeof i.comboSnapshot === 'object'
      ? i.comboSnapshot
      : null
    const snapItems = Array.isArray(snap?.items) ? snap.items : []
    return {
      lineKind,
      productSlug: slug,
      productSku:
        lineKind === 'combo'
          ? (typeof snap?.sku === 'string' ? snap.sku : null)
          : (cat?.sku ?? null),
      productCode: cat?.code ?? null,
      productName:
        lineKind === 'combo'
          ? String(i.productName ?? 'Combo')
          : cat?.name || String(i.productName ?? 'Producto'),
      presentation:
        lineKind === 'combo'
          ? 'Combo'
          : String(i.presentation ?? '—'),
      quantity: qty,
      unitPrice: unit,
      lineTotal,
      imageUrl: cat?.image_url ?? null,
      comboId: lineKind === 'combo' ? (i.comboId ?? null) : null,
      comboSnapshot:
        lineKind === 'combo'
          ? {
              kind: snap?.kind ?? null,
              buyQty: snap?.buyQty ?? null,
              payQty: snap?.payQty ?? null,
              fixedPrice: snap?.fixedPrice ?? null,
              items: snapItems,
            }
          : null,
    }
  })
}

async function mapOrderDetail(r: Record<string, unknown>) {
  const items = await enrichOrderItems(r.items)
  const ev = evidenceFromRow(r as unknown as EvidenceRow)
  return {
    id: r.id,
    code: r.code,
    businessName: r.business_name,
    documentNumber: r.document_number ?? null,
    phone: r.phone,
    status: String(r.status ?? 'confirmacion_pedido'),
    shipAddress: r.ship_address,
    shipDistrict: r.ship_district_name,
    shipProvince: r.ship_province_name,
    shipDepartment: r.ship_department_name,
    agencyName: r.agency_name,
    itemCount: items.length,
    items,
    totalEstimated:
      r.total_estimated != null ? Number(r.total_estimated) : null,
    publicSlug: r.public_slug,
    shareUrl: r.public_slug
      ? shareUrlForSlug(r.public_slug as string)
      : null,
    linkExpiresAt: r.link_expires_at,
    createdAt: r.created_at,
    evidence: ev,
  }
}

function accountTrackingHint(
  status: string,
  businessName: string,
  ev: ReturnType<typeof evidenceFromRow>,
): string | undefined {
  if (ev.trackingNumber?.trim()) {
    return `Seguimiento: ${ev.trackingNumber.trim()}${
      ev.shipCarrier?.trim() ? ` · ${ev.shipCarrier.trim()}` : ''
    }`
  }
  if (status === 'entregado') {
    return ev.deliveryNote?.trim() || 'Pedido entregado'
  }
  if (status === 'enviado') {
    return ev.shipCarrier?.trim()
      ? `En camino · ${ev.shipCarrier.trim()}`
      : 'Pedido en camino'
  }
  if (status === 'realizando_envio') {
    return ev.shipCarrier?.trim() || ev.shipDataNote?.trim()
      ? `Preparando despacho${ev.shipCarrier ? ` · ${ev.shipCarrier}` : ''}`
      : 'Preparando despacho'
  }
  if (status === 'confirmacion_pago') {
    return 'Esperando confirmación de pago'
  }
  if (status === 'confirmacion_pedido') {
    return `Solicitud enviada · ${businessName}`
  }
  return undefined
}

/** Vista cliente: ítems enriquecidos + hint, sin URLs de evidencia sensibles. */
async function mapOrderForAccount(r: Record<string, unknown>) {
  const detail = await mapOrderDetail(r)
  const status = detail.status
  const totalFromLines = detail.items.reduce((sum, it) => {
    if (it.lineTotal != null) return sum + it.lineTotal
    return sum
  }, 0)
  return {
    id: detail.id,
    code: detail.code,
    date:
      typeof detail.createdAt === 'string'
        ? detail.createdAt.slice(0, 10)
        : detail.createdAt instanceof Date
          ? detail.createdAt.toISOString().slice(0, 10)
          : '',
    status,
    businessName: detail.businessName,
    total:
      detail.totalEstimated != null
        ? detail.totalEstimated
        : totalFromLines,
    itemsSummary: detail.items
      .map((i) => `${i.productName} x${i.quantity}`)
      .join(', ')
      .slice(0, 160),
    trackingHint: accountTrackingHint(
      status,
      String(detail.businessName ?? ''),
      detail.evidence,
    ),
    shareUrl: detail.shareUrl,
    shipAddress: detail.shipAddress,
    agencyName: detail.agencyName,
    items: detail.items.map((i) => ({
      name: i.presentation
        ? `${i.productName} (${i.presentation})`
        : i.productName,
      qty: i.quantity,
      imageUrl: i.imageUrl ?? '',
      unitPrice: i.unitPrice ?? 0,
    })),
  }
}

const ORDER_DETAIL_COLS = `
  id, code, business_name, document_number, phone, items, total_estimated, status,
  ship_address, ship_district_name, ship_province_name, ship_department_name,
  agency_name, public_slug, link_expires_at, created_at,
  payment_proof_url, payment_proof_key, payment_note,
  ship_carrier, ship_data_note, tracking_number,
  shipping_voucher_url, shipping_voucher_key,
  delivery_proof_url, delivery_proof_key, delivery_note
`

adminOrdersRoutes.get('/by-code/:code', async (c) => {
  const code = decodeURIComponent(c.req.param('code') || '').trim()
  if (!code || code.length > 40) {
    return c.json({ error: 'Código de pedido no válido.' }, 400)
  }
  const { rows } = await pool.query(
    `SELECT ${ORDER_DETAIL_COLS} FROM order_requests WHERE code = $1 LIMIT 1`,
    [code],
  )
  if (!rows[0]) return c.json({ error: 'Pedido no encontrado.' }, 404)
  return c.json({ order: await mapOrderDetail(rows[0]) })
})

adminOrdersRoutes.post('/:id/evidence', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Pedido no válido.' }, 400)
  }
  const exists = await pool.query(
    `SELECT id FROM order_requests WHERE id = $1`,
    [id],
  )
  if (!exists.rows[0]) return c.json({ error: 'Pedido no encontrado.' }, 404)

  const form = await c.req.parseBody()
  const kindRaw = typeof form.kind === 'string' ? form.kind : ''
  if (!isOrderEvidenceKind(kindRaw)) {
    return c.json(
      { error: 'Tipo de evidencia no válido (payment, voucher o delivery).' },
      400,
    )
  }
  const file = form.file
  if (!(file instanceof File)) {
    return c.json({ error: 'Adjuntá un archivo.' }, 400)
  }

  const uploaded = await uploadOrderEvidence({
    file,
    orderId: id,
    kind: kindRaw,
  })
  if (!uploaded.ok) {
    return c.json({ error: uploaded.error }, uploaded.status)
  }

  if (kindRaw === 'payment') {
    await pool.query(
      `UPDATE order_requests
       SET payment_proof_url = $2, payment_proof_key = $3
       WHERE id = $1`,
      [id, uploaded.url, uploaded.key],
    )
  } else if (kindRaw === 'voucher') {
    await pool.query(
      `UPDATE order_requests
       SET shipping_voucher_url = $2, shipping_voucher_key = $3
       WHERE id = $1`,
      [id, uploaded.url, uploaded.key],
    )
  } else {
    await pool.query(
      `UPDATE order_requests
       SET delivery_proof_url = $2, delivery_proof_key = $3
       WHERE id = $1`,
      [id, uploaded.url, uploaded.key],
    )
  }

  const { rows } = await pool.query(
    `SELECT ${ORDER_DETAIL_COLS} FROM order_requests WHERE id = $1`,
    [id],
  )
  return c.json({
    ok: true,
    url: uploaded.url,
    key: uploaded.key,
    order: await mapOrderDetail(rows[0]),
  })
})

const patchOrderSchema = z.object({
  status: z.enum(PIPELINE_STATUSES).optional(),
  paymentNote: z.string().trim().max(500).optional().nullable(),
  shipCarrier: z.string().trim().max(160).optional().nullable(),
  shipDataNote: z.string().trim().max(500).optional().nullable(),
  trackingNumber: z.string().trim().max(120).optional().nullable(),
  deliveryNote: z.string().trim().max(500).optional().nullable(),
})

adminOrdersRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Pedido no válido.' }, 400)
  }
  const body = patchOrderSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Datos de pedido no válidos.' }, 400)
  }
  if (
    body.data.status == null &&
    body.data.paymentNote === undefined &&
    body.data.shipCarrier === undefined &&
    body.data.shipDataNote === undefined &&
    body.data.trackingNumber === undefined &&
    body.data.deliveryNote === undefined
  ) {
    return c.json({ error: 'Nada para actualizar.' }, 400)
  }

  const current = await pool.query(
    `SELECT ${ORDER_DETAIL_COLS} FROM order_requests WHERE id = $1`,
    [id],
  )
  if (!current.rows[0]) return c.json({ error: 'Pedido no encontrado.' }, 404)
  const row = current.rows[0] as EvidenceRow & { status: string }

  const nextEv = {
    paymentProofUrl: row.payment_proof_url,
    paymentNote:
      body.data.paymentNote !== undefined
        ? body.data.paymentNote
        : row.payment_note,
    shipCarrier:
      body.data.shipCarrier !== undefined
        ? body.data.shipCarrier
        : row.ship_carrier,
    shipDataNote:
      body.data.shipDataNote !== undefined
        ? body.data.shipDataNote
        : row.ship_data_note,
    trackingNumber:
      body.data.trackingNumber !== undefined
        ? body.data.trackingNumber
        : row.tracking_number,
    shippingVoucherUrl: row.shipping_voucher_url,
    deliveryProofUrl: row.delivery_proof_url,
    deliveryNote:
      body.data.deliveryNote !== undefined
        ? body.data.deliveryNote
        : row.delivery_note,
  }

  if (body.data.status) {
    const miss = missingEvidenceForStatus(body.data.status, nextEv)
    if (miss) return c.json({ error: miss }, 400)
  }

  await pool.query(
    `UPDATE order_requests SET
       payment_note = CASE WHEN $2::boolean THEN $3 ELSE payment_note END,
       ship_carrier = CASE WHEN $4::boolean THEN $5 ELSE ship_carrier END,
       ship_data_note = CASE WHEN $6::boolean THEN $7 ELSE ship_data_note END,
       tracking_number = CASE WHEN $8::boolean THEN $9 ELSE tracking_number END,
       delivery_note = CASE WHEN $10::boolean THEN $11 ELSE delivery_note END,
       status = COALESCE($12, status)
     WHERE id = $1`,
    [
      id,
      body.data.paymentNote !== undefined,
      body.data.paymentNote ?? null,
      body.data.shipCarrier !== undefined,
      body.data.shipCarrier ?? null,
      body.data.shipDataNote !== undefined,
      body.data.shipDataNote ?? null,
      body.data.trackingNumber !== undefined,
      body.data.trackingNumber ?? null,
      body.data.deliveryNote !== undefined,
      body.data.deliveryNote ?? null,
      body.data.status ?? null,
    ],
  )

  const refreshed = await pool.query(
    `SELECT ${ORDER_DETAIL_COLS} FROM order_requests WHERE id = $1`,
    [id],
  )
  const order = await mapOrderDetail(refreshed.rows[0])
  return c.json({
    ok: true,
    id: order.id,
    code: order.code,
    status: order.status,
    order,
  })
})

adminOrdersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Pedido no válido.' }, 400)
  }
  const { rows } = await pool.query(
    `DELETE FROM order_requests WHERE id = $1 RETURNING id, code`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'Pedido no encontrado.' }, 404)
  return c.json({ ok: true, id: rows[0].id, code: rows[0].code })
})
