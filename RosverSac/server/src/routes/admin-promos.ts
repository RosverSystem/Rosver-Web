/**
 * CRUD de promociones BOGO para el admin.
 * Base: /api/admin/promos
 */
import { Hono } from 'hono'
import { z } from 'zod'
import {
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
} from '../lib/product-promos.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminPromosRoutes = new Hono<{ Variables: AuthVariables }>()
adminPromosRoutes.use('*', requireAuth, requireRole('admin'))

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

const createSchema = z.object({
  productId: z.string().uuid({ message: 'Selecciona un producto válido.' }),
  packagingId: z.string().uuid().nullable().optional(),
  buyQty: z
    .number()
    .int()
    .min(2, { message: 'buyQty debe ser al menos 2.' }),
  payQty: z
    .number()
    .int()
    .min(1, { message: 'payQty debe ser al menos 1.' }),
  validFrom: z.string().datetime({ offset: true }).nullable().optional(),
  validTo: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

const patchSchema = z.object({
  buyQty: z.number().int().min(2).optional(),
  payQty: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
  validFrom: z.string().datetime({ offset: true }).nullable().optional(),
  validTo: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

// ---------------------------------------------------------------------------
// GET /api/admin/promos
// ---------------------------------------------------------------------------

adminPromosRoutes.get('/', async (c) => {
  const promos = await getAllPromos()
  return c.json({ items: promos })
})

// ---------------------------------------------------------------------------
// POST /api/admin/promos
// ---------------------------------------------------------------------------

adminPromosRoutes.post('/', async (c) => {
  const body = createSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos inválidos.' },
      400,
    )
  }
  const d = body.data
  if (d.payQty >= d.buyQty) {
    return c.json(
      { error: 'payQty debe ser menor que buyQty (ej. 2x1: buy=2, pay=1).' },
      400,
    )
  }
  const promo = await createPromo({
    productId: d.productId,
    packagingId: d.packagingId ?? null,
    buyQty: d.buyQty,
    payQty: d.payQty,
    validFrom: d.validFrom ?? null,
    validTo: d.validTo ?? null,
    notes: d.notes ?? null,
  })
  return c.json({ ok: true, promo }, 201)
})

// ---------------------------------------------------------------------------
// PATCH /api/admin/promos/:id
// ---------------------------------------------------------------------------

adminPromosRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'ID de promo inválido.' }, 400)
  }
  const body = patchSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos inválidos.' },
      400,
    )
  }
  if (
    body.data.buyQty !== undefined &&
    body.data.payQty !== undefined &&
    body.data.payQty >= body.data.buyQty
  ) {
    return c.json(
      { error: 'payQty debe ser menor que buyQty.' },
      400,
    )
  }
  const promo = await updatePromo(id, body.data)
  if (!promo) return c.json({ error: 'Promo no encontrada.' }, 404)
  return c.json({ ok: true, promo })
})

// ---------------------------------------------------------------------------
// DELETE /api/admin/promos/:id
// ---------------------------------------------------------------------------

adminPromosRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return c.json({ error: 'ID de promo inválido.' }, 400)
  }
  const deleted = await deletePromo(id)
  if (!deleted) return c.json({ error: 'Promo no encontrada.' }, 404)
  return c.json({ ok: true })
})
