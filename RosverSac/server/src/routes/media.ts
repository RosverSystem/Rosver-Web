import { Hono } from 'hono'
import { getPublicObject, r2Enabled } from '../lib/r2.js'

export const mediaRoutes = new Hono()

mediaRoutes.get('/*', async (c) => {
  if (!r2Enabled()) {
    return c.json({ error: 'R2 no configurado' }, 503)
  }
  const key = c.req.path.replace(/^\/api\/media\/?/, '')
  if (!key || key.includes('..')) {
    return c.json({ error: 'Clave inválida' }, 400)
  }
  try {
    const obj = await getPublicObject(key)
    const body = obj.Body
    if (!body) return c.json({ error: 'Vacío' }, 404)
    const bytes = await body.transformToByteArray()
    return new Response(bytes, {
      headers: {
        'Content-Type': obj.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return c.json({ error: 'No encontrado' }, 404)
  }
})
