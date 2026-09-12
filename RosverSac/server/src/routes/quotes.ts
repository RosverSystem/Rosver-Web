import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../config.js'
import { pool } from '../db.js'
import {
  makeQuotePublicSlug,
  quoteLinkExpiresAt,
  QUOTE_LINK_DAYS,
} from '../lib/quote-slug.js'
import {
  deletePublicObject,
  putPublicObject,
  r2Enabled,
} from '../lib/r2.js'
import {
  isQuoteEvidenceKind,
  uploadQuoteEvidence,
} from '../lib/upload-quote-evidence.js'
import { resolveSessionUser } from '../lib/session.js'
import { resolveUbigeo } from '../lib/ubigeo.js'
import { applyPromosToItems } from '../lib/product-promos.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

/**
 * Cotizaciones públicas → Postgres.
 * Link temporal `/c/:slug` (15 días) + PDF.
 */
export const quotesRoutes = new Hono()
export const adminQuotesRoutes = new Hono<{ Variables: AuthVariables }>()

adminQuotesRoutes.use('*', requireAuth, requireRole('admin'))

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
  items: z
    .array(itemSchema)
    .min(1, { message: 'Agrega al menos un producto.' })
    .max(80),
  totalEstimated: z.number().nonnegative().nullable().optional(),
})

const pdfSchema = z.object({
  pdfBase64: z.string().min(32).max(12_000_000),
})

async function nextQuoteCode(): Promise<string> {
  const year = new Date().getFullYear()
  const { rows } = await pool.query<{ n: string }>(
    `SELECT nextval('quote_requests_code_seq')::text AS n`,
  )
  const n = String(rows[0]?.n ?? '1').padStart(6, '0')
  return `QT-${year}-${n}`
}

function shareUrlForSlug(slug: string) {
  return `${config.appUrl.replace(/\/$/, '')}/c/${encodeURIComponent(slug)}`
}

/** Borra PDF de filas vencidas (link ya no válido). */
async function purgeExpiredQuoteLinks() {
  const { rows } = await pool.query<{
    id: string
    pdf_r2_key: string | null
  }>(
    `SELECT id, pdf_r2_key FROM quote_requests
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
      `UPDATE quote_requests
       SET pdf_bytes = NULL, pdf_r2_key = NULL
       WHERE id = $1`,
      [row.id],
    )
  }
}

quotesRoutes.post('/', async (c) => {
  const body = createSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos incompletos.' },
      400,
    )
  }

  const d = body.data
  const phoneDigits = d.phone.replace(/\D/g, '')
  if (phoneDigits.length < 9) {
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

  void purgeExpiredQuoteLinks()

  // Aplicar promos BOGO server-side (recalcular lineTotals; nunca confiar en el cliente)
  const promoResult = await applyPromosToItems(d.items)
  const itemsWithPromo = promoResult.items
  const serverTotal =
    promoResult.promosApplied > 0
      ? promoResult.totalEstimated
      : (d.totalEstimated ?? null)

  const sessionUser = await resolveSessionUser(c)
  const code = await nextQuoteCode()
  let publicSlug = makeQuotePublicSlug(d.businessName, code)
  const expiresAt = quoteLinkExpiresAt()

  // Evitar colisión improbable de slug
  for (let i = 0; i < 3; i++) {
    const exists = await pool.query(
      `SELECT 1 FROM quote_requests WHERE public_slug = $1 LIMIT 1`,
      [publicSlug],
    )
    if (exists.rowCount === 0) break
    publicSlug = `${makeQuotePublicSlug(d.businessName, code)}-${i + 2}`
  }

  const { rows } = await pool.query(
    `INSERT INTO quote_requests (
       code, business_name, document_number, phone,
       ship_department_code, ship_department_name,
       ship_province_code, ship_province_name,
       ship_district_code, ship_district_name, ship_address,
       agency_name,
       items, total_estimated, user_id,
       public_slug, link_expires_at, status
     ) VALUES (
       $1,$2,$3,$4,
       $5,$6,$7,$8,$9,$10,$11,
       $12,
       $13::jsonb,$14,$15,
       $16,$17,'recibida'
     )
     RETURNING id, code, public_slug, link_expires_at, created_at,
       ship_address, ship_district_name, ship_province_name, ship_department_name,
       agency_name, business_name, status`,
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
      bumpDemandFromLines('quotes', d.items),
    )
    .catch((err) => console.error('quote analytics bump', err))

  return c.json({
    ok: true,
    id: row.id,
    code: row.code as string,
    publicSlug: slug,
    shareUrl: shareUrlForSlug(slug),
    linkExpiresAt: row.link_expires_at,
    linkDays: QUOTE_LINK_DAYS,
    createdAt: row.created_at,
    saved: {
      businessName: row.business_name,
      shipAddress: row.ship_address,
      district: row.ship_district_name,
      province: row.ship_province_name,
      department: row.ship_department_name,
      agencyName: row.agency_name,
    },
  })
})

/** Sube el PDF generado en el cliente (tras crear la cotización). */
quotesRoutes.put('/:id/pdf', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Cotización no válida.' }, 400)
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
    `SELECT id, public_slug, link_expires_at, pdf_bytes, pdf_r2_key FROM quote_requests WHERE id = $1`,
    [id],
  )
  const quote = rows[0]
  if (!quote) return c.json({ error: 'Cotización no encontrada.' }, 404)
  if (
    quote.link_expires_at &&
    new Date(quote.link_expires_at).getTime() < Date.now()
  ) {
    return c.json({ error: 'El link de esta cotización ya venció.' }, 410)
  }
  // Una sola subida por cotización (ver mismo criterio en orders.ts).
  if (quote.pdf_bytes || quote.pdf_r2_key) {
    return c.json({ error: 'Esta cotización ya tiene un PDF guardado.' }, 409)
  }

  let r2Key: string | null = null
  if (r2Enabled() && quote.public_slug) {
    r2Key = `quotes/${quote.public_slug}.pdf`
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
    `UPDATE quote_requests
     SET pdf_bytes = $2, pdf_r2_key = $3
     WHERE id = $1`,
    [id, pdfBytes, r2Key],
  )

  return c.json({
    ok: true,
    pdfUrl: quote.public_slug
      ? `/api/quotes/public/${encodeURIComponent(quote.public_slug)}/pdf`
      : null,
  })
})

type PublicQuoteRow = {
  id: string
  code: string
  business_name: string
  document_number: string | null
  phone: string
  ship_address: string
  ship_department_name: string
  ship_province_name: string
  ship_district_name: string
  agency_name: string
  items: unknown
  total_estimated: string | null
  public_slug: string
  link_expires_at: string
  created_at: string
  has_pdf: boolean
}

async function loadPublicQuote(slug: string): Promise<
  | { ok: true; row: PublicQuoteRow }
  | { ok: false; status: 404 | 410; error: string }
> {
  const { rows } = await pool.query<PublicQuoteRow>(
    `SELECT id, code, business_name, document_number, phone,
            ship_address, ship_department_name, ship_province_name, ship_district_name,
            agency_name, items, total_estimated, public_slug, link_expires_at, created_at,
            (pdf_bytes IS NOT NULL OR pdf_r2_key IS NOT NULL) AS has_pdf
     FROM quote_requests
     WHERE public_slug = $1`,
    [slug],
  )
  const row = rows[0]
  if (!row) return { ok: false, status: 404, error: 'Cotización no encontrada.' }

  if (new Date(row.link_expires_at).getTime() < Date.now()) {
    if (row.has_pdf) {
      const full = await pool.query<{ pdf_r2_key: string | null }>(
        `SELECT pdf_r2_key FROM quote_requests WHERE id = $1`,
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
        `UPDATE quote_requests SET pdf_bytes = NULL, pdf_r2_key = NULL WHERE id = $1`,
        [row.id],
      )
    }
    return {
      ok: false,
      status: 410,
      error: 'Este link de cotización expiró (vigencia 15 días).',
    }
  }

  return { ok: true, row }
}

quotesRoutes.get('/public/:slug', async (c) => {
  const slug = decodeURIComponent(c.req.param('slug'))
  const loaded = await loadPublicQuote(slug)
  if (!loaded.ok) {
    return c.json({ error: loaded.error }, loaded.status)
  }
  const r = loaded.row
  const items = Array.isArray(r.items) ? r.items : []
  return c.json({
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
      ? `/api/quotes/public/${encodeURIComponent(r.public_slug)}/pdf`
      : null,
  })
})

quotesRoutes.get('/public/:slug/pdf', async (c) => {
  const slug = decodeURIComponent(c.req.param('slug'))
  const loaded = await loadPublicQuote(slug)
  if (!loaded.ok) {
    return c.json({ error: loaded.error }, loaded.status)
  }

  const { rows } = await pool.query<{
    pdf_bytes: Buffer | null
    pdf_r2_key: string | null
  }>(`SELECT pdf_bytes, pdf_r2_key FROM quote_requests WHERE id = $1`, [
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

  // Fallback R2 vía proxy media
  return c.redirect(`/api/media/${pdf.pdf_r2_key}`)
})

/** Cotizaciones del usuario autenticado (área /cuenta). */
quotesRoutes.get('/mine', async (c) => {
  const user = await resolveSessionUser(c)
  if (!user) return c.json({ error: 'Debes iniciar sesión.' }, 401)

  const { rows } = await pool.query(
    `SELECT ${QUOTE_DETAIL_COLS}
     FROM quote_requests
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [user.id],
  )

  const items = []
  for (const row of rows) {
    items.push(await mapQuoteForAccount(row))
  }
  return c.json({ items })
})

quotesRoutes.get('/mine/:code', async (c) => {
  const user = await resolveSessionUser(c)
  if (!user) return c.json({ error: 'Debes iniciar sesión.' }, 401)
  const code = decodeURIComponent(c.req.param('code') || '').trim()
  if (!code || code.length > 40) {
    return c.json({ error: 'Código de cotización no válido.' }, 400)
  }
  const { rows } = await pool.query(
    `SELECT ${QUOTE_DETAIL_COLS}
     FROM quote_requests
     WHERE user_id = $1 AND code = $2
     LIMIT 1`,
    [user.id, code],
  )
  if (!rows[0]) return c.json({ error: 'Cotización no encontrada.' }, 404)
  return c.json({ quote: await mapQuoteForAccount(rows[0]) })
})

type QuoteListRow = {
  id: string
  code: string
  business_name: string
  document_number: string | null
  phone: string
  ship_address: string
  ship_department_name: string
  ship_province_name: string
  ship_district_name: string
  agency_name: string
  items: unknown
  total_estimated: string | null
  public_slug: string | null
  link_expires_at: string | null
  created_at: string
  status: string
}

const QUOTE_PIPELINE = [
  'recibida',
  'en_revision',
  'respondida',
  'aceptada',
  'cerrada',
] as const

type QuotePipelineStatus = (typeof QUOTE_PIPELINE)[number]

type QuoteEvidenceRow = {
  revision_note: string | null
  response_proof_url: string | null
  response_proof_key: string | null
  response_note: string | null
  acceptance_proof_url: string | null
  acceptance_proof_key: string | null
  acceptance_note: string | null
  close_note: string | null
}

const QUOTE_DETAIL_COLS = `
  id, code, business_name, document_number, phone, items, total_estimated, status,
  ship_address, ship_district_name, ship_province_name, ship_department_name,
  agency_name, public_slug, link_expires_at, created_at,
  revision_note, response_proof_url, response_proof_key, response_note,
  acceptance_proof_url, acceptance_proof_key, acceptance_note, close_note,
  (pdf_bytes IS NOT NULL OR pdf_r2_key IS NOT NULL) AS has_pdf
`

function quoteEvidenceFromRow(r: QuoteEvidenceRow) {
  return {
    revisionNote: r.revision_note,
    responseProofUrl: r.response_proof_url,
    responseNote: r.response_note,
    acceptanceProofUrl: r.acceptance_proof_url,
    acceptanceNote: r.acceptance_note,
    closeNote: r.close_note,
  }
}

function missingQuoteEvidence(
  status: QuotePipelineStatus,
  ev: ReturnType<typeof quoteEvidenceFromRow>,
): string | null {
  if (status === 'en_revision' && !ev.revisionNote?.trim()) {
    return 'Escribí una nota de revisión antes de pasar a En revisión.'
  }
  if (status === 'respondida' && !ev.responseProofUrl?.trim() && !ev.responseNote?.trim()) {
    return 'Subí la respuesta o dejá una nota antes de marcar Respondida.'
  }
  if (status === 'aceptada' && !ev.acceptanceProofUrl?.trim() && !ev.acceptanceNote?.trim()) {
    return 'Subí prueba de aceptación o una nota antes de marcar Aceptada.'
  }
  if (status === 'cerrada' && !ev.closeNote?.trim()) {
    return 'Indicá el motivo de cierre antes de marcar Cerrada.'
  }
  return null
}

type QuoteItemRaw = {
  lineKind?: string
  productSlug?: string
  productName?: string
  presentation?: string
  quantity?: number
  unitPrice?: number | null
  comboId?: string | null
  comboSnapshot?: Record<string, unknown> | null
}

async function enrichQuoteItems(raw: unknown) {
  const items = (Array.isArray(raw) ? raw : []) as QuoteItemRaw[]
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
      productSku: cat?.sku ?? null,
      productCode: cat?.code ?? null,
      productName:
        lineKind === 'combo'
          ? String(i.productName ?? 'Combo')
          : cat?.name || String(i.productName ?? 'Producto'),
      presentation:
        lineKind === 'combo' ? 'Combo' : String(i.presentation ?? '—'),
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

async function mapQuoteDetail(r: Record<string, unknown>) {
  const items = await enrichQuoteItems(r.items)
  return {
    id: r.id,
    code: r.code,
    businessName: r.business_name,
    documentNumber: r.document_number ?? null,
    phone: r.phone,
    status: String(r.status ?? 'recibida'),
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
    hasPdf: Boolean(r.has_pdf),
    evidence: quoteEvidenceFromRow(r as unknown as QuoteEvidenceRow),
  }
}

function accountQuoteNote(
  status: string,
  ev: ReturnType<typeof quoteEvidenceFromRow>,
): string | undefined {
  if (status === 'cerrada' && ev.closeNote?.trim()) return ev.closeNote.trim()
  if (status === 'aceptada' && ev.acceptanceNote?.trim()) {
    return ev.acceptanceNote.trim()
  }
  if (status === 'respondida' && ev.responseNote?.trim()) {
    return ev.responseNote.trim()
  }
  if (status === 'en_revision' && ev.revisionNote?.trim()) {
    return ev.revisionNote.trim()
  }
  if (status === 'recibida') return 'Cotización recibida · en cola de revisión'
  return ev.revisionNote?.trim() || ev.responseNote?.trim() || undefined
}

async function mapQuoteForAccount(r: Record<string, unknown>) {
  const detail = await mapQuoteDetail(r)
  return {
    id: detail.id,
    code: detail.code,
    date:
      typeof detail.createdAt === 'string'
        ? detail.createdAt.slice(0, 10)
        : detail.createdAt instanceof Date
          ? detail.createdAt.toISOString().slice(0, 10)
          : '',
    status: detail.status,
    businessName: detail.businessName,
    customerName: detail.businessName,
    total: detail.totalEstimated,
    itemsSummary: detail.items
      .map((i) => `${i.productName} x${i.quantity}`)
      .join(', ')
      .slice(0, 160),
    note: accountQuoteNote(detail.status, detail.evidence),
    shareUrl: detail.shareUrl,
    hasPdf: detail.hasPdf,
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

adminQuotesRoutes.get('/', async (c) => {
  const codeQ = (c.req.query('code') ?? '').trim()
  if (codeQ) {
    const { rows } = await pool.query(
      `SELECT ${QUOTE_DETAIL_COLS} FROM quote_requests WHERE code = $1 LIMIT 1`,
      [codeQ],
    )
    if (!rows[0]) return c.json({ error: 'Cotización no encontrada.' }, 404)
    return c.json({ quote: await mapQuoteDetail(rows[0]) })
  }

  const { rows } = await pool.query<QuoteListRow>(
    `SELECT id, code, business_name, document_number, phone,
            ship_address, ship_department_name, ship_province_name, ship_district_name,
            agency_name, items, total_estimated, public_slug, link_expires_at, created_at,
            status
     FROM quote_requests
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
        documentNumber: r.document_number,
        phone: r.phone,
        status: String(r.status ?? 'recibida'),
        shipAddress: r.ship_address,
        shipDepartment: r.ship_department_name,
        shipProvince: r.ship_province_name,
        shipDistrict: r.ship_district_name,
        agencyName: r.agency_name,
        itemCount: items.length,
        totalEstimated:
          r.total_estimated != null ? Number(r.total_estimated) : null,
        publicSlug: r.public_slug,
        shareUrl: r.public_slug ? shareUrlForSlug(r.public_slug) : null,
        linkExpiresAt: r.link_expires_at,
        createdAt: r.created_at,
      }
    }),
  })
})

adminQuotesRoutes.post('/:id/evidence', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Cotización no válida.' }, 400)
  }
  const exists = await pool.query(
    `SELECT id FROM quote_requests WHERE id = $1`,
    [id],
  )
  if (!exists.rows[0]) return c.json({ error: 'Cotización no encontrada.' }, 404)

  const form = await c.req.parseBody()
  const kindRaw = typeof form.kind === 'string' ? form.kind : ''
  if (!isQuoteEvidenceKind(kindRaw)) {
    return c.json(
      { error: 'Tipo de evidencia no válido (response o acceptance).' },
      400,
    )
  }
  const file = form.file
  if (!(file instanceof File)) {
    return c.json({ error: 'Adjuntá un archivo.' }, 400)
  }

  const uploaded = await uploadQuoteEvidence({
    file,
    quoteId: id,
    kind: kindRaw,
  })
  if (!uploaded.ok) {
    return c.json({ error: uploaded.error }, uploaded.status)
  }

  if (kindRaw === 'response') {
    await pool.query(
      `UPDATE quote_requests
       SET response_proof_url = $2, response_proof_key = $3
       WHERE id = $1`,
      [id, uploaded.url, uploaded.key],
    )
  } else {
    await pool.query(
      `UPDATE quote_requests
       SET acceptance_proof_url = $2, acceptance_proof_key = $3
       WHERE id = $1`,
      [id, uploaded.url, uploaded.key],
    )
  }

  const { rows } = await pool.query(
    `SELECT ${QUOTE_DETAIL_COLS} FROM quote_requests WHERE id = $1`,
    [id],
  )
  return c.json({
    ok: true,
    url: uploaded.url,
    quote: await mapQuoteDetail(rows[0]),
  })
})

const patchQuoteSchema = z.object({
  status: z.enum(QUOTE_PIPELINE).optional(),
  revisionNote: z.string().trim().max(500).optional().nullable(),
  responseNote: z.string().trim().max(500).optional().nullable(),
  acceptanceNote: z.string().trim().max(500).optional().nullable(),
  closeNote: z.string().trim().max(500).optional().nullable(),
})

adminQuotesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Cotización no válida.' }, 400)
  }
  const body = patchQuoteSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Datos de cotización no válidos.' }, 400)
  }

  const current = await pool.query(
    `SELECT ${QUOTE_DETAIL_COLS} FROM quote_requests WHERE id = $1`,
    [id],
  )
  if (!current.rows[0]) return c.json({ error: 'Cotización no encontrada.' }, 404)
  const row = current.rows[0] as QuoteEvidenceRow & { status: string }

  const nextEv = {
    revisionNote:
      body.data.revisionNote !== undefined
        ? body.data.revisionNote
        : row.revision_note,
    responseProofUrl: row.response_proof_url,
    responseNote:
      body.data.responseNote !== undefined
        ? body.data.responseNote
        : row.response_note,
    acceptanceProofUrl: row.acceptance_proof_url,
    acceptanceNote:
      body.data.acceptanceNote !== undefined
        ? body.data.acceptanceNote
        : row.acceptance_note,
    closeNote:
      body.data.closeNote !== undefined ? body.data.closeNote : row.close_note,
  }

  if (body.data.status) {
    const miss = missingQuoteEvidence(body.data.status, nextEv)
    if (miss) return c.json({ error: miss }, 400)
  }

  await pool.query(
    `UPDATE quote_requests SET
       revision_note = CASE WHEN $2::boolean THEN $3 ELSE revision_note END,
       response_note = CASE WHEN $4::boolean THEN $5 ELSE response_note END,
       acceptance_note = CASE WHEN $6::boolean THEN $7 ELSE acceptance_note END,
       close_note = CASE WHEN $8::boolean THEN $9 ELSE close_note END,
       status = COALESCE($10, status)
     WHERE id = $1`,
    [
      id,
      body.data.revisionNote !== undefined,
      body.data.revisionNote ?? null,
      body.data.responseNote !== undefined,
      body.data.responseNote ?? null,
      body.data.acceptanceNote !== undefined,
      body.data.acceptanceNote ?? null,
      body.data.closeNote !== undefined,
      body.data.closeNote ?? null,
      body.data.status ?? null,
    ],
  )

  const refreshed = await pool.query(
    `SELECT ${QUOTE_DETAIL_COLS} FROM quote_requests WHERE id = $1`,
    [id],
  )
  const quote = await mapQuoteDetail(refreshed.rows[0])
  return c.json({
    ok: true,
    id: quote.id,
    code: quote.code,
    status: quote.status,
    quote,
  })
})

adminQuotesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Cotización no válida.' }, 400)
  }
  const { rows } = await pool.query(
    `DELETE FROM quote_requests WHERE id = $1 RETURNING id, code`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'Cotización no encontrada.' }, 404)
  return c.json({ ok: true, id: rows[0].id, code: rows[0].code })
})
