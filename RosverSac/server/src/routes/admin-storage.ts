import { Hono } from 'hono'
import { z } from 'zod'
import {
  deletePublicObject,
  listPublicObjects,
  publicUrlForKey,
  r2Enabled,
} from '../lib/r2.js'
import { isUploadFolder, uploadPublicImage } from '../lib/upload-image.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminStorageRoutes = new Hono<{ Variables: AuthVariables }>()

adminStorageRoutes.use('*', requireAuth, requireRole('admin'))

const FOLDER_LABELS: Record<string, string> = {
  products: 'Productos',
  categories: 'Categorías',
  brands: 'Marcas',
  avatars: 'Avatares',
}

adminStorageRoutes.get('/storage/status', (c) => {
  return c.json({
    enabled: r2Enabled(),
    bucket: process.env.R2_BUCKET_PUBLIC?.trim() || null,
  })
})

adminStorageRoutes.get('/storage', async (c) => {
  if (!r2Enabled()) {
    return c.json(
      { error: 'R2 no está configurado en este entorno.', objects: [], folders: [] },
      503,
    )
  }
  const prefix = (c.req.query('prefix') ?? '').replace(/^\//, '')
  const cursor = c.req.query('cursor') ?? undefined
  const q = (c.req.query('q') ?? '').trim().toLowerCase()

  try {
    const listed = await listPublicObjects({
      prefix: prefix || undefined,
      continuationToken: cursor,
      maxKeys: 120,
      groupFolders: !prefix,
    })

    const objects = q
      ? listed.objects.filter((o) => o.key.toLowerCase().includes(q))
      : listed.objects

    const folders = listed.folders.map((p) => {
      const slug = p.replace(/\/$/, '')
      return {
        prefix: p,
        name: FOLDER_LABELS[slug] ?? slug,
        id: slug,
      }
    })

    return c.json({
      prefix,
      folders,
      objects,
      truncated: listed.truncated,
      nextCursor: listed.nextToken,
    })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'No se pudo listar el almacenamiento.' }, 500)
  }
})

adminStorageRoutes.delete('/storage', async (c) => {
  if (!r2Enabled()) {
    return c.json({ error: 'R2 no está configurado.' }, 503)
  }
  const body = z
    .object({ key: z.string().trim().min(1).max(500) })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Indica la clave del archivo.' }, 400)
  const key = body.data.key.replace(/^\/+/, '')
  if (key.includes('..')) return c.json({ error: 'Clave inválida.' }, 400)
  try {
    await deletePublicObject(key)
    return c.json({ ok: true })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'No se pudo eliminar el archivo.' }, 500)
  }
})

adminStorageRoutes.post('/storage/upload', async (c) => {
  if (!r2Enabled()) {
    return c.json({ error: 'R2 no está configurado.' }, 503)
  }
  const body = await c.req.parseBody()
  const file = body.file
  const folderRaw = typeof body.folder === 'string' ? body.folder : 'products'
  if (!(file instanceof File)) {
    return c.json({ error: 'Adjunta una imagen (campo file).' }, 400)
  }
  if (!isUploadFolder(folderRaw) && folderRaw !== 'avatars') {
    return c.json(
      { error: 'Carpeta inválida. Usa products, categories, brands o avatars.' },
      400,
    )
  }
  if (folderRaw === 'avatars') {
    // Reuse products upload path naming for library; keep avatars via existing profile
    return c.json(
      { error: 'Los avatares se suben desde el perfil. Usa products, categories o brands.' },
      400,
    )
  }
  const result = await uploadPublicImage({
    file,
    folder: folderRaw as 'products' | 'categories' | 'brands',
  })
  if (!result.ok) {
    return c.json({ error: result.error }, result.status)
  }
  return c.json({
    ok: true,
    url: result.url,
    key: result.key,
    publicUrl: publicUrlForKey(result.key),
  })
})
