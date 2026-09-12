import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

const claimKind = z.enum(['reclamo', 'queja'])
const goodKind = z.enum(['producto', 'servicio'])
const docType = z.enum(['DNI', 'CE', 'RUC', 'PASAPORTE'])

const createSchema = z
  .object({
    claimKind,
    goodKind,
    consumerName: z.string().trim().min(2).max(160),
    consumerDocType: docType,
    consumerDocNumber: z.string().trim().min(5).max(20),
    consumerAddress: z.string().trim().min(5).max(240),
    consumerDistrict: z.string().trim().max(80).optional().nullable(),
    consumerProvince: z.string().trim().max(80).optional().nullable(),
    consumerDepartment: z.string().trim().max(80).optional().nullable(),
    consumerPhone: z.string().trim().min(6).max(30),
    consumerEmail: z.string().trim().email().max(160),
    consumerIsMinor: z.boolean().default(false),
    guardianName: z.string().trim().max(160).optional().nullable(),
    guardianDocType: docType.optional().nullable(),
    guardianDocNumber: z.string().trim().max(20).optional().nullable(),
    contractedDetail: z.string().trim().min(5).max(2000),
    amount: z.number().finite().nonnegative().optional().nullable(),
    claimDetail: z.string().trim().min(10).max(4000),
    consumerRequest: z.string().trim().min(5).max(2000),
  })
  .superRefine((data, ctx) => {
    if (data.consumerIsMinor) {
      if (!data.guardianName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indica el nombre del padre, madre o apoderado.',
          path: ['guardianName'],
        })
      }
      if (!data.guardianDocType || !data.guardianDocNumber?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indica el documento del apoderado.',
          path: ['guardianDocNumber'],
        })
      }
    }
  })

function mapRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    code: String(r.code),
    claimKind: String(r.claim_kind),
    goodKind: String(r.good_kind),
    consumerName: String(r.consumer_name),
    consumerDocType: String(r.consumer_doc_type),
    consumerDocNumber: String(r.consumer_doc_number),
    consumerAddress: String(r.consumer_address),
    consumerDistrict: r.consumer_district ? String(r.consumer_district) : null,
    consumerProvince: r.consumer_province ? String(r.consumer_province) : null,
    consumerDepartment: r.consumer_department
      ? String(r.consumer_department)
      : null,
    consumerPhone: String(r.consumer_phone),
    consumerEmail: String(r.consumer_email),
    consumerIsMinor: Boolean(r.consumer_is_minor),
    guardianName: r.guardian_name ? String(r.guardian_name) : null,
    guardianDocType: r.guardian_doc_type ? String(r.guardian_doc_type) : null,
    guardianDocNumber: r.guardian_doc_number
      ? String(r.guardian_doc_number)
      : null,
    contractedDetail: String(r.contracted_detail),
    amount: r.amount != null ? Number(r.amount) : null,
    claimDetail: String(r.claim_detail),
    consumerRequest: String(r.consumer_request),
    status: String(r.status),
    providerResponse: r.provider_response ? String(r.provider_response) : null,
    respondedAt: r.responded_at
      ? new Date(String(r.responded_at)).toISOString()
      : null,
    createdAt: new Date(String(r.created_at)).toISOString(),
  }
}

async function nextComplaintCode(): Promise<string> {
  const year = new Date().getFullYear()
  const { rows } = await pool.query<{ n: string }>(
    `SELECT nextval('consumer_complaints_code_seq')::text AS n`,
  )
  const n = String(rows[0]?.n ?? '1').padStart(6, '0')
  return `REC-${year}-${n}`
}

/** Público: alta + consulta por código. */
export const complaintsRoutes = new Hono()

complaintsRoutes.post('/', async (c) => {
  const body = createSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos inválidos' },
      400,
    )
  }
  const d = body.data
  const code = await nextComplaintCode()
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    null
  const ua = c.req.header('user-agent')?.slice(0, 400) || null

  const { rows } = await pool.query(
    `INSERT INTO consumer_complaints (
       code, claim_kind, good_kind,
       consumer_name, consumer_doc_type, consumer_doc_number,
       consumer_address, consumer_district, consumer_province, consumer_department,
       consumer_phone, consumer_email, consumer_is_minor,
       guardian_name, guardian_doc_type, guardian_doc_number,
       contracted_detail, amount, claim_detail, consumer_request,
       ip_address, user_agent
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
     )
     RETURNING *`,
    [
      code,
      d.claimKind,
      d.goodKind,
      d.consumerName,
      d.consumerDocType,
      d.consumerDocNumber.toUpperCase(),
      d.consumerAddress,
      d.consumerDistrict || null,
      d.consumerProvince || null,
      d.consumerDepartment || null,
      d.consumerPhone,
      d.consumerEmail.toLowerCase(),
      d.consumerIsMinor,
      d.consumerIsMinor ? d.guardianName || null : null,
      d.consumerIsMinor ? d.guardianDocType || null : null,
      d.consumerIsMinor ? d.guardianDocNumber?.toUpperCase() || null : null,
      d.contractedDetail,
      d.amount ?? null,
      d.claimDetail,
      d.consumerRequest,
      ip,
      ua,
    ],
  )

  const complaint = mapRow(rows[0] as Record<string, unknown>)
  return c.json(
    {
      ok: true,
      complaint: {
        code: complaint.code,
        claimKind: complaint.claimKind,
        createdAt: complaint.createdAt,
        status: complaint.status,
      },
      message:
        'Hoja registrada. Conserva el código. El proveedor tiene hasta 15 días calendario para responder un reclamo.',
    },
    201,
  )
})

complaintsRoutes.get('/:code', async (c) => {
  const code = c.req.param('code').trim().toUpperCase()
  if (!/^REC-\d{4}-\d{6}$/.test(code)) {
    return c.json({ error: 'Código no válido' }, 400)
  }
  const { rows } = await pool.query(
    `SELECT code, claim_kind, good_kind, status, created_at, responded_at,
            provider_response IS NOT NULL AS has_response
     FROM consumer_complaints WHERE code = $1`,
    [code],
  )
  if (!rows[0]) return c.json({ error: 'No encontramos esa hoja' }, 404)
  const r = rows[0]
  return c.json({
    complaint: {
      code: String(r.code),
      claimKind: String(r.claim_kind),
      goodKind: String(r.good_kind),
      status: String(r.status),
      createdAt: new Date(String(r.created_at)).toISOString(),
      respondedAt: r.responded_at
        ? new Date(String(r.responded_at)).toISOString()
        : null,
      hasResponse: Boolean(r.has_response),
    },
  })
})

/** Admin: listado + respuesta. */
export const adminComplaintsRoutes = new Hono<{ Variables: AuthVariables }>()

adminComplaintsRoutes.use('*', requireAuth, requireRole('admin'))

adminComplaintsRoutes.get('/', async (c) => {
  const status = c.req.query('status')?.trim()
  const params: unknown[] = []
  let where = ''
  if (
    status &&
    ['recibido', 'en_revision', 'respondido', 'archivado'].includes(status)
  ) {
    params.push(status)
    where = `WHERE status = $${params.length}`
  }
  const { rows } = await pool.query(
    `SELECT * FROM consumer_complaints ${where}
     ORDER BY created_at DESC
     LIMIT 200`,
    params,
  )
  return c.json({
    complaints: rows.map((r) => mapRow(r as Record<string, unknown>)),
  })
})

adminComplaintsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await pool.query(
    `SELECT * FROM consumer_complaints WHERE id = $1`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'No encontrado' }, 404)
  return c.json({ complaint: mapRow(rows[0] as Record<string, unknown>) })
})

adminComplaintsRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      status: z
        .enum(['recibido', 'en_revision', 'respondido', 'archivado'])
        .optional(),
      providerResponse: z.string().trim().min(5).max(4000).optional().nullable(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos inválidos' },
      400,
    )
  }
  const { status, providerResponse } = body.data
  if (!status && providerResponse === undefined) {
    return c.json({ error: 'Nada que actualizar' }, 400)
  }

  const { rows } = await pool.query(
    `UPDATE consumer_complaints SET
       status = COALESCE($2, status),
       provider_response = COALESCE($3, provider_response),
       responded_at = CASE
         WHEN $3 IS NOT NULL THEN now()
         WHEN $2 = 'respondido' THEN COALESCE(responded_at, now())
         ELSE responded_at
       END,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, status ?? null, providerResponse ?? null],
  )
  if (!rows[0]) return c.json({ error: 'No encontrado' }, 404)
  return c.json({ ok: true, complaint: mapRow(rows[0] as Record<string, unknown>) })
})

adminComplaintsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'Hoja no válida.' }, 400)
  }
  const { rows } = await pool.query(
    `DELETE FROM consumer_complaints WHERE id = $1 RETURNING id, code`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'No encontrado' }, 404)
  return c.json({ ok: true, id: rows[0].id, code: rows[0].code })
})
