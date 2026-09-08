import { Hono } from 'hono'

/**
 * Catálogo público para la tienda.
 * Mientras no exista CRUD (P10), `live: false` y el cliente usa mocks del bundle.
 * Cuando el ERP publique productos, devolver `live: true` + arrays.
 */
export const catalogRoutes = new Hono()

catalogRoutes.get('/', (c) =>
  c.json({
    ok: true,
    live: false,
    updatedAt: new Date().toISOString(),
    products: [],
    categories: [],
    message: 'Catálogo vivo pendiente de CRUD ERP (P10). Cliente usa mocks.',
  }),
)
