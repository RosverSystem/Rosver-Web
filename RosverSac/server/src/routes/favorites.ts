import { Hono } from 'hono'
import { z } from 'zod'
import {
  addFavorite,
  listFavoriteIds,
  listFavoriteKeys,
  listFavorites,
  removeFavorite,
  resolveFavoriteProductId,
} from '../lib/product-favorites.js'
import {
  requireAuth,
  type AuthVariables,
} from '../middleware/auth.js'
import { validateUuidParams } from '../middleware/validate-params.js'

const bodySchema = z
  .object({
    productId: z.string().uuid().optional(),
    slug: z.string().min(1).max(200).optional(),
  })
  .refine((v) => Boolean(v.productId || v.slug), {
    message: 'Indica productId o slug.',
  })

export const favoritesRoutes = new Hono<{ Variables: AuthVariables }>()

favoritesRoutes.use('*', requireAuth)

/** IDs ligeros para el store del front. */
favoritesRoutes.get('/ids', async (c) => {
  const user = c.get('user')
  try {
    const { ids, slugs } = await listFavoriteKeys(user.id)
    return c.json({ ok: true, ids, slugs, count: ids.length })
  } catch (err) {
    console.error('favorites ids', err)
    return c.json({ error: 'No se pudieron cargar favoritos.' }, 500)
  }
})

/** Listado con datos de producto. */
favoritesRoutes.get('/', async (c) => {
  const user = c.get('user')
  try {
    const [products, ids] = await Promise.all([
      listFavorites(user.id, 120),
      listFavoriteIds(user.id),
    ])
    return c.json({
      ok: true,
      products,
      ids,
      count: products.length,
    })
  } catch (err) {
    console.error('favorites list', err)
    return c.json({ error: 'No se pudieron cargar favoritos.' }, 500)
  }
})

/** Agregar favorito. */
favoritesRoutes.post('/', async (c) => {
  const user = c.get('user')
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await c.req.json())
  } catch {
    return c.json({ error: 'Datos inválidos.' }, 400)
  }

  try {
    const productId = await resolveFavoriteProductId(body)
    if (!productId) {
      return c.json({ error: 'Producto no encontrado.' }, 404)
    }
    await addFavorite(user.id, productId)
    const { ids, slugs } = await listFavoriteKeys(user.id)
    return c.json({
      ok: true,
      favorited: true,
      productId,
      ids,
      slugs,
      count: ids.length,
    })
  } catch (err) {
    console.error('favorites add', err)
    return c.json({ error: 'No se pudo guardar el favorito.' }, 500)
  }
})

/** Toggle: si existe lo quita; si no, lo agrega. */
favoritesRoutes.post('/toggle', async (c) => {
  const user = c.get('user')
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await c.req.json())
  } catch {
    return c.json({ error: 'Datos inválidos.' }, 400)
  }

  try {
    const productId = await resolveFavoriteProductId(body)
    if (!productId) {
      return c.json({ error: 'Producto no encontrado.' }, 404)
    }

    const removed = await removeFavorite(user.id, productId)
    let favorited = false
    if (!removed) {
      await addFavorite(user.id, productId)
      favorited = true
    }
    const { ids, slugs } = await listFavoriteKeys(user.id)
    return c.json({
      ok: true,
      favorited,
      productId,
      ids,
      slugs,
      count: ids.length,
    })
  } catch (err) {
    console.error('favorites toggle', err)
    return c.json({ error: 'No se pudo actualizar el favorito.' }, 500)
  }
})

/** Quitar favorito. */
favoritesRoutes.delete(
  '/:productId',
  validateUuidParams('productId'),
  async (c) => {
    const user = c.get('user')
    const productId = c.req.param('productId')
    try {
      await removeFavorite(user.id, productId)
      const { ids, slugs } = await listFavoriteKeys(user.id)
      return c.json({
        ok: true,
        favorited: false,
        productId,
        ids,
        slugs,
        count: ids.length,
      })
    } catch (err) {
      console.error('favorites remove', err)
      return c.json({ error: 'No se pudo quitar el favorito.' }, 500)
    }
  },
)
