import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { authRoutes } from './routes/auth.js'
import { profileRoutes } from './routes/profile.js'
import { adminRoutes } from './routes/admin.js'
import { adminCatalogRoutes } from './routes/admin-catalog.js'
import { mediaRoutes } from './routes/media.js'
import { catalogRoutes } from './routes/catalog.js'

const app = new Hono()
const sacRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const distRoot = path.join(sacRoot, 'dist')
const hasDist = fs.existsSync(path.join(distRoot, 'index.html'))

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return config.corsOrigin
      if (origin === config.corsOrigin || origin === config.appUrl) return origin
      if (!config.isProd && origin.startsWith('http://localhost:')) return origin
      return config.corsOrigin
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'rosver-api', time: new Date().toISOString() }),
)

app.route('/api/auth', authRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/admin', adminCatalogRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/catalog', catalogRoutes)

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
serve({ fetch: app.fetch, port: config.port })
