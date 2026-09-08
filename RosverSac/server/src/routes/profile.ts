import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { pool } from '../db.js'
import { putPublicObject, r2Enabled } from '../lib/r2.js'
import { profileSchema } from '../lib/validation.js'
import { loadUserById } from '../lib/session.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

export const profileRoutes = new Hono<{ Variables: AuthVariables }>()

profileRoutes.use('*', requireAuth)

profileRoutes.get('/', async (c) => {
  return c.json({ user: c.get('user') })
})

profileRoutes.patch('/', async (c) => {
  const current = c.get('user')
  const body = await c.req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      400,
    )
  }
  const d = parsed.data
  const phone = d.phone ?? current.phone
  if (!phone || phone.replace(/\D/g, '').length < 9) {
    return c.json({ error: 'El teléfono es obligatorio.' }, 400)
  }

  await pool.query(
    `UPDATE users SET
       full_name = $2,
       phone = $3,
       company_name = $4,
       document_type = $5,
       document_number = $6,
       avatar_url = $7,
       updated_at = now()
     WHERE id = $1`,
    [
      current.id,
      d.fullName ?? current.fullName,
      phone,
      d.companyName !== undefined ? d.companyName : current.companyName,
      d.documentType !== undefined ? d.documentType : current.documentType,
      d.documentNumber !== undefined
        ? d.documentNumber
        : current.documentNumber,
      d.avatarUrl ?? current.avatarUrl,
    ],
  )

  const user = await loadUserById(current.id)
  return c.json({ ok: true, user })
})

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

profileRoutes.post('/avatar', async (c) => {
  if (!r2Enabled()) {
    return c.json(
      { error: 'Almacenamiento R2 no configurado en el servidor.' },
      503,
    )
  }

  const current = c.get('user')
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) {
    return c.json({ error: 'Adjunta una imagen (campo file).' }, 400)
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json(
      { error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF.' },
      400,
    )
  }
  if (file.size > 2.5 * 1024 * 1024) {
    return c.json({ error: 'La imagen no debe superar 2.5 MB.' }, 400)
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg'
  const key = `avatars/${current.id}/${randomUUID()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const avatarUrl = await putPublicObject({
    key,
    body: buf,
    contentType: file.type,
  })

  await pool.query(
    `UPDATE users SET avatar_url = $2, updated_at = now() WHERE id = $1`,
    [current.id, avatarUrl],
  )

  const user = await loadUserById(current.id)
  return c.json({ ok: true, user, avatarUrl })
})
