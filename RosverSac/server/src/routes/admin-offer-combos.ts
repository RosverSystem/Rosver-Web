import { Hono } from 'hono'
import { z } from 'zod'
import {
  createOfferCombo,
  getOfferComboById,
  queryOfferCombos,
  softDeleteOfferCombo,
  toPublicCombo,
  updateOfferCombo,
  type OfferComboKind,
} from '../lib/offer-combos.js'
import { validateUuidParams } from '../middleware/validate-params.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminOfferCombosRoutes = new Hono<{ Variables: AuthVariables }>()

adminOfferCombosRoutes.use('*', requireAuth, requireRole('admin'))
adminOfferCombosRoutes.use('/offer-combos/:id', validateUuidParams('id'))

const itemSchema = z.object({
  productId: z.string().uuid(),
  packagingId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(999),
})

const upsertSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  kind: z.enum(['bogo', 'bundle_fixed', 'qty_pack']),
  buyQty: z.number().int().min(1).max(99).nullable().optional(),
  payQty: z.number().int().min(1).max(99).nullable().optional(),
  fixedPrice: z.number().nonnegative().nullable().optional(),
  maxPerUser: z.number().int().min(1).max(999).nullable().optional(),
  visible: z.boolean().optional(),
  validFrom: z.string().max(40).nullable().optional(),
  validTo: z.string().max(40).nullable().optional(),
  sortOrder: z.number().int().optional(),
  sku: z.string().trim().min(1).max(60).optional(),
  items: z.array(itemSchema).min(1).max(40),
})

function validateKindPayload(
  kind: OfferComboKind,
  d: z.infer<typeof upsertSchema>,
): string | null {
  if (kind === 'bogo') {
    const buy = d.buyQty ?? 2
    const pay = d.payQty ?? 1
    if (buy < pay) return 'En 2x1, la cantidad a llevar debe ser ≥ la que se paga'
    if (d.items.length < 1) return 'Agrega al menos un producto'
  } else {
    if (d.fixedPrice == null || !Number.isFinite(d.fixedPrice)) {
      return 'Indica el precio del combo'
    }
    if (d.items.length < 1) return 'Agrega al menos un producto'
  }
  return null
}

adminOfferCombosRoutes.get('/offer-combos', async (c) => {
  const combos = await queryOfferCombos({ visibleOnly: false, limit: 300 })
  return c.json({
    combos: combos.map(toPublicCombo).map((x, i) => ({
      ...x,
      visible: combos[i].visible,
      validFrom: combos[i].validFrom,
      validTo: combos[i].validTo,
      code: combos[i].code,
    })),
    count: combos.length,
  })
})

adminOfferCombosRoutes.get('/offer-combos/:id', async (c) => {
  const combo = await getOfferComboById(c.req.param('id'))
  if (!combo) return c.json({ error: 'Combo no encontrado' }, 404)
  return c.json({
    combo: {
      ...toPublicCombo(combo),
      visible: combo.visible,
      validFrom: combo.validFrom,
      validTo: combo.validTo,
      code: combo.code,
    },
  })
})

adminOfferCombosRoutes.post('/offer-combos', async (c) => {
  const body = upsertSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos inválidos' },
      400,
    )
  }
  const err = validateKindPayload(body.data.kind, body.data)
  if (err) return c.json({ error: err }, 400)
  try {
    const combo = await createOfferCombo({
      ...body.data,
      validFrom: body.data.validFrom || null,
      validTo: body.data.validTo || null,
    })
    return c.json(
      {
        ok: true,
        combo: {
          ...toPublicCombo(combo),
          visible: combo.visible,
          code: combo.code,
        },
      },
      201,
    )
  } catch (e) {
    console.error('[offer-combos POST]', e)
    return c.json({ error: 'No se pudo crear el combo' }, 500)
  }
})

adminOfferCombosRoutes.patch('/offer-combos/:id', async (c) => {
  const body = upsertSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json(
      { error: body.error.issues[0]?.message ?? 'Datos inválidos' },
      400,
    )
  }
  const err = validateKindPayload(body.data.kind, body.data)
  if (err) return c.json({ error: err }, 400)
  try {
    const combo = await updateOfferCombo(c.req.param('id'), {
      ...body.data,
      validFrom: body.data.validFrom || null,
      validTo: body.data.validTo || null,
    })
    if (!combo) return c.json({ error: 'Combo no encontrado' }, 404)
    return c.json({
      ok: true,
      combo: {
        ...toPublicCombo(combo),
        visible: combo.visible,
        code: combo.code,
      },
    })
  } catch (e) {
    console.error('[offer-combos PATCH]', e)
    return c.json({ error: 'No se pudo actualizar el combo' }, 500)
  }
})

adminOfferCombosRoutes.delete('/offer-combos/:id', async (c) => {
  const ok = await softDeleteOfferCombo(c.req.param('id'))
  if (!ok) return c.json({ error: 'Combo no encontrado' }, 404)
  return c.json({ ok: true })
})
