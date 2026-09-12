import { Hono } from 'hono'
import { getClientDetail, listClients } from '../lib/admin-clients.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'
import { validateUuidParams } from '../middleware/validate-params.js'

export const adminClientsRoutes = new Hono<{ Variables: AuthVariables }>()

adminClientsRoutes.use('*', requireAuth, requireRole('admin'))
adminClientsRoutes.use('/clients/:id', validateUuidParams('id'))

/** Listado de clientes (rol client). */
adminClientsRoutes.get('/clients', async (c) => {
  const q = c.req.query('q')?.trim() || ''
  try {
    const clients = await listClients({ q: q || undefined })
    return c.json({ ok: true, clients, count: clients.length })
  } catch (err) {
    console.error('admin clients list', err)
    return c.json({ error: 'No se pudo cargar clientes.' }, 500)
  }
})

/** Detalle + interés (frecuentes / recientes) + pedidos/cotiz. */
adminClientsRoutes.get('/clients/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const client = await getClientDetail(id)
    if (!client) return c.json({ error: 'Cliente no encontrado.' }, 404)
    return c.json({ ok: true, client })
  } catch (err) {
    console.error('admin client detail', err)
    return c.json({ error: 'No se pudo cargar el cliente.' }, 500)
  }
})
