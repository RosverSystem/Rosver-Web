import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { authRoutes } from './routes/auth.js'
import { profileRoutes } from './routes/profile.js'
import { adminRoutes } from './routes/admin.js'
import { adminUsersRoutes } from './routes/admin-users.js'
import { adminCatalogRoutes } from './routes/admin-catalog.js'
import { adminOfferCombosRoutes } from './routes/admin-offer-combos.js'
import { adminProductImportRoutes } from './routes/admin-product-import.js'
import { adminStorageRoutes } from './routes/admin-storage.js'
import { mediaRoutes } from './routes/media.js'
import { catalogRoutes } from './routes/catalog.js'
import {
  adminComplaintsRoutes,
  complaintsRoutes,
} from './routes/complaints.js'
import { peruRoutes } from './routes/peru.js'
import { contactRoutes } from './routes/contact.js'
import { quotesRoutes, adminQuotesRoutes } from './routes/quotes.js'
import { ordersRoutes, adminOrdersRoutes } from './routes/orders.js'
import { adminAnalyticsRoutes } from './routes/admin-analytics.js'
import { adminClientsRoutes } from './routes/admin-clients.js'
import { adminPromosRoutes } from './routes/admin-promos.js'
import { adminLeadsRoutes } from './routes/admin-leads.js'
import { adminContentRoutes, contentPublicRoutes } from './routes/admin-content.js'
import { redisStatus } from './lib/redis.js'
import { startPendingRegistrationCleanup } from './lib/pending-registrations.js'

const app = new Hono()
const sacRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const distRoot = path.join(sacRoot, 'dist')
const hasDist = fs.existsSync(path.join(distRoot, 'index.html'))

function resolveCommitSha(): string | null {
  // Primary: from config (env vars RAILWAY_GIT_COMMIT_SHA / GIT_COMMIT)
  if (config.commitSha) return config.commitSha
  // Fallback: .deploy-commit file written at build time
  try {
    return readFileSync(path.join(sacRoot, '.deploy-commit'), 'utf8').trim() || null
  } catch {
    return null
  }
}
const commitSha = resolveCommitSha()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Sin origin (curl, same-origin, server-to-server)
      if (!origin) return [...config.corsOrigins][0] ?? config.corsOrigin
      // Origen explícitamente permitido
      if (config.corsOrigins.has(origin)) return origin
      // En desarrollo: cualquier localhost
      if (!config.isProd && origin.startsWith('http://localhost:')) return origin
      // Fallback: primer origen configurado
      return [...config.corsOrigins][0] ?? config.corsOrigin
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'rosver-api',
    time: new Date().toISOString(),
    commitSha: commitSha ?? 'unknown',
    redis: redisStatus(),
  }),
)

app.route('/api/auth', authRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/admin', adminOfferCombosRoutes)
app.route('/api/admin', adminAnalyticsRoutes)
app.route('/api/admin', adminClientsRoutes)
app.route('/api/admin/promos', adminPromosRoutes)
app.route('/api/admin', adminLeadsRoutes)
app.route('/api/admin', adminContentRoutes)
app.route('/api/content', contentPublicRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/admin', adminUsersRoutes)
app.route('/api/admin', adminProductImportRoutes)
app.route('/api/admin', adminCatalogRoutes)
app.route('/api/admin', adminStorageRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/catalog', catalogRoutes)
app.route('/api/complaints', complaintsRoutes)
app.route('/api/admin/complaints', adminComplaintsRoutes)
app.route('/api/peru', peruRoutes)
app.route('/api/contact', contactRoutes)
app.route('/api/quotes', quotesRoutes)
app.route('/api/admin/quotes', adminQuotesRoutes)
app.route('/api/orders', ordersRoutes)
app.route('/api/admin/orders', adminOrdersRoutes)

if (hasDist) {
  app.use(
    '/*',
    serveStatic({
      root: distRoot,
      rewriteRequestPath: (p) => p,
    }),
  )
}

app.notFound(async (c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ error: 'No encontrado' }, 404)
  }
  if (hasDist) {
    const html = await fs.promises.readFile(
      path.join(distRoot, 'index.html'),
      'utf8',
    )
    return c.html(html)
  }
  return c.json(
    {
      error: 'SPA no construida. En local usa Vite (:5173) + npm run dev:api.',
    },
    404,
  )
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Error interno del servidor' }, 500)
})

console.log(
  `Rosver ${hasDist ? 'web+api' : 'api'} → http://localhost:${config.port}`,
)
startPendingRegistrationCleanup()
serve({ fetch: app.fetch, port: config.port })
