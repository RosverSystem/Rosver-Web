import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { sendContactConfirmationEmail } from '../lib/mail.js'
import { resolveSessionUser } from '../lib/session.js'

/**
 * Formulario público de contacto → Postgres + email de confirmación.
 */
export const contactRoutes = new Hono()

const createSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().max(40).optional().nullable(),
    documentType: z.enum(['DNI', 'RUC']).optional().nullable(),
    documentNumber: z.string().trim().max(20).optional().nullable(),
    businessName: z.string().trim().max(160).optional().nullable(),
    message: z
      .string()
      .trim()
      .min(5, { message: 'El mensaje debe tener al menos 5 caracteres (máx. 1000).' })
      .max(1000, { message: 'El mensaje puede tener como máximo 1000 caracteres.' }),
  })
  .superRefine((data, ctx) => {
    const phoneDigits = (data.phone ?? '').replace(/\D/g, '')
    if (data.phone?.trim() && phoneDigits.length < 9) {
      ctx.addIssue({
        code: 'custom',
        message: 'El WhatsApp/teléfono no es válido.',
        path: ['phone'],
      })
    }
    if (data.documentType === 'DNI') {
      const d = (data.documentNumber ?? '').replace(/\D/g, '')
      if (d.length !== 8) {
        ctx.addIssue({
          code: 'custom',
          message: 'El DNI debe tener 8 dígitos.',
          path: ['documentNumber'],
        })
      }
    }
    if (data.documentType === 'RUC') {
      const d = (data.documentNumber ?? '').replace(/\D/g, '')
      if (!/^(10|20)\d{9}$/.test(d)) {
        ctx.addIssue({
          code: 'custom',
          message: 'El RUC debe tener 11 dígitos y empezar con 10 o 20.',
          path: ['documentNumber'],
        })
      }
    }
  })

async function nextContactCode(): Promise<string> {
  const year = new Date().getFullYear()
  const { rows } = await pool.query<{ n: string }>(
    `SELECT nextval('contact_messages_code_seq')::text AS n`,
  )
  const n = String(rows[0]?.n ?? '1').padStart(6, '0')
  return `CT-${year}-${n}`
}

contactRoutes.post('/', async (c) => {
  const body = createSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos incompletos.' },
      400,
    )
  }

  const sessionUser = await resolveSessionUser(c)
  const d = body.data
  const code = await nextContactCode()
  const phone = d.phone?.trim() || null
  const docNumber = d.documentNumber?.replace(/\D/g, '') || null

  const { rows } = await pool.query(
    `INSERT INTO contact_messages
       (code, full_name, email, phone, document_type, document_number,
        business_name, message, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, code, created_at`,
    [
      code,
      d.fullName,
      d.email.toLowerCase(),
      phone,
      d.documentType ?? null,
      docNumber,
      d.businessName?.trim() || null,
      d.message,
      sessionUser?.id ?? null,
    ],
  )

  const row = rows[0]
  const mail = await sendContactConfirmationEmail({
    to: d.email.toLowerCase(),
    fullName: d.fullName,
    code,
    messagePreview: d.message,
    phone,
  })

  if (mail.delivered) {
    await pool.query(
      `UPDATE contact_messages SET confirmation_sent = true WHERE id = $1`,
      [row.id],
    )
  }

  return c.json({
    ok: true,
    code: String(row.code),
    confirmationSent: mail.delivered,
    createdAt: new Date(String(row.created_at)).toISOString(),
  })
})
