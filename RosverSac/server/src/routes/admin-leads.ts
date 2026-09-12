import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth.js'

export const adminLeadsRoutes = new Hono<{ Variables: AuthVariables }>()
adminLeadsRoutes.use('*', requireAuth, requireRole('admin'))

type LeadRow = {
  id: string
  code: string
  full_name: string
  email: string | null
  phone: string | null
  document_type: string | null
  document_number: string | null
  business_name: string | null
  message: string
  status: string
  admin_note: string | null
  confirmation_sent: boolean
  user_id: string | null
  created_at: string
  updated_at: string | null
}

function mapLead(row: LeadRow) {
  return {
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    documentType: row.document_type,
    documentNumber: row.document_number,
    businessName: row.business_name,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    confirmationSent: row.confirmation_sent,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** GET /api/admin/leads — list, newest first */
adminLeadsRoutes.get('/leads', async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 100, 1), 500)

  let where = ''
  const values: unknown[] = []
  if (status && ['nuevo', 'en_proceso', 'cerrado'].includes(status)) {
    where = `WHERE status = $1`
    values.push(status)
  }
  values.push(limit)

  const { rows } = await pool.query<LeadRow>(
    `SELECT id, code, full_name, email, phone, document_type, document_number,
            business_name, message, status, admin_note, confirmation_sent, user_id,
            created_at, updated_at
     FROM contact_messages
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values,
  )
  return c.json({ leads: rows.map(mapLead) })
})

/** GET /api/admin/leads/:id */
adminLeadsRoutes.get('/leads/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await pool.query<LeadRow>(
    `SELECT id, code, full_name, email, phone, document_type, document_number,
            business_name, message, status, admin_note, confirmation_sent, user_id,
            created_at, updated_at
     FROM contact_messages WHERE id = $1`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'No encontrado.' }, 404)
  return c.json({ lead: mapLead(rows[0]) })
})

const patchSchema = z.object({
  status: z.enum(['nuevo', 'en_proceso', 'cerrado']).optional(),
  adminNote: z.string().max(2000).nullable().optional(),
})

/** PATCH /api/admin/leads/:id — update status and/or note */
adminLeadsRoutes.patch('/leads/:id', async (c) => {
  const id = c.req.param('id')
  const body = patchSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos.' }, 400)
  }
  if (!body.data.status && body.data.adminNote === undefined) {
    return c.json({ error: 'Nada que actualizar.' }, 400)
  }

  const sets: string[] = ['updated_at = now()']
  const values: unknown[] = []
  let i = 1
  if (body.data.status) {
    sets.push(`status = $${i++}`)
    values.push(body.data.status)
  }
  if (body.data.adminNote !== undefined) {
    sets.push(`admin_note = $${i++}`)
    values.push(body.data.adminNote)
  }
  values.push(id)

  const { rows } = await pool.query<{ id: string }>(
    `UPDATE contact_messages SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`,
    values,
  )
  if (!rows[0]) return c.json({ error: 'No encontrado.' }, 404)
  return c.json({ ok: true })
})

/** DELETE /api/admin/leads/:id */
adminLeadsRoutes.delete('/leads/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await pool.query<{ id: string }>(
    `DELETE FROM contact_messages WHERE id = $1 RETURNING id`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'No encontrado.' }, 404)
  return c.json({ ok: true })
})
