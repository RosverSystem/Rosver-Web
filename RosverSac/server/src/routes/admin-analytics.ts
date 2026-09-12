import { Hono } from 'hono'
import {
  getAnalyticsOverview,
  rebuildDemandCountsFromHistory,
} from '../lib/product-analytics.js'
import { getDashboardSummary } from '../lib/admin-dashboard.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminAnalyticsRoutes = new Hono<{ Variables: AuthVariables }>()

adminAnalyticsRoutes.use('*', requireAuth, requireRole('admin'))

/** Resumen Inicio ERP. */
adminAnalyticsRoutes.get('/dashboard', async (c) => {
  try {
    const data = await getDashboardSummary()
    return c.json(data)
  } catch (err) {
    console.error('admin dashboard', err)
    return c.json({ error: 'No se pudo cargar el inicio.' }, 500)
  }
})

/** Resumen KPIs + tops + serie diaria. */
adminAnalyticsRoutes.get('/analytics', async (c) => {
  const days = Number(c.req.query('days') || 14)
  try {
    const data = await getAnalyticsOverview(days)
    return c.json(data)
  } catch (err) {
    console.error('admin analytics', err)
    return c.json({ error: 'No se pudo cargar la analítica.' }, 500)
  }
})

/** Recalcula pedidos/cotizaciones desde el historial (una vez / mantenimiento). */
adminAnalyticsRoutes.post('/analytics/rebuild-demand', async (c) => {
  try {
    await rebuildDemandCountsFromHistory()
    const data = await getAnalyticsOverview(14)
    return c.json(data)
  } catch (err) {
    console.error('rebuild demand', err)
    return c.json({ error: 'No se pudo recalcular la demanda.' }, 500)
  }
})
