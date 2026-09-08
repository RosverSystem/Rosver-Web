import { Redis } from 'ioredis'
import { config } from '../config.js'

const FEATURED_KEY = 'rosver:catalog:featured:v1'
const FEATURED_TTL_SEC = 90

let client: Redis | null | undefined

/** Cliente ioredis crudo, para módulos que necesitan comandos que no son cache JSON (ej. rate-limit). */
export function getRedisClient(): Redis | null {
  return getClient()
}

function getClient(): Redis | null {
  if (client !== undefined) return client
  const url = config.redisUrl
  if (!url) {
    client = null
    return null
  }
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 4_000,
      enableOfflineQueue: false,
      // Evita spam infinito de reconnect con WRONGPASS.
      retryStrategy(times) {
        if (times > 5) return null
        return Math.min(times * 500, 3_000)
      },
    })
    client.on('error', (err) => {
      const msg = err.message || String(err)
      console.warn('[redis]', msg)
      if (/WRONGPASS|invalid username-password|NOAUTH/i.test(msg)) {
        try {
          client?.disconnect()
        } catch {
          /* ignore */
        }
        client = null
      }
    })
    return client
  } catch (err) {
    console.warn('[redis] init failed', err)
    client = null
    return null
  }
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const r = getClient()
  if (!r) return null
  try {
    const raw = await r.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSec = FEATURED_TTL_SEC,
) {
  const r = getClient()
  if (!r) return
  try {
    await r.set(key, JSON.stringify(value), 'EX', ttlSec)
  } catch {
    /* degradación */
  }
}

export async function cacheDel(...keys: string[]) {
  const r = getClient()
  if (!r || !keys.length) return
  try {
    await r.del(...keys)
  } catch {
    /* ignore */
  }
}

export const featuredCache = {
  key: FEATURED_KEY,
  ttlSec: FEATURED_TTL_SEC,
  async get<T>() {
    return cacheGetJson<T>(FEATURED_KEY)
  },
  async set(value: unknown) {
    return cacheSetJson(FEATURED_KEY, value, FEATURED_TTL_SEC)
  },
  async invalidate() {
    return cacheDel(FEATURED_KEY)
  },
}

const TRENDING_PREFIX = 'rosver:catalog:trending:v1:'

export function trendingCacheKey(categorySlug?: string | null) {
  const slug = categorySlug?.trim() || 'all'
  return `${TRENDING_PREFIX}${slug}`
}

export const trendingCache = {
  ttlSec: FEATURED_TTL_SEC,
  keyFor: trendingCacheKey,
  async get<T>(categorySlug?: string | null) {
    return cacheGetJson<T>(trendingCacheKey(categorySlug))
  },
  async set(categorySlug: string | null | undefined, value: unknown) {
    return cacheSetJson(trendingCacheKey(categorySlug), value, FEATURED_TTL_SEC)
  },
  async invalidateAll() {
    const r = getClient()
    if (!r) return
    try {
      let cursor = '0'
      do {
        const [next, keys] = await r.scan(
          cursor,
          'MATCH',
          `${TRENDING_PREFIX}*`,
          'COUNT',
          50,
        )
        cursor = next
        if (keys.length) await r.del(...keys)
      } while (cursor !== '0')
    } catch {
      /* ignore */
    }
  },
}

/** Invalida destacados + tendencia (cambios de producto/precio/reseña). */
export async function invalidateCatalogHomeCaches() {
  await featuredCache.invalidate()
  await trendingCache.invalidateAll()
}

export function redisStatus() {
  const r = getClient()
  return {
    configured: Boolean(config.redisUrl),
    status: r?.status ?? 'disabled',
  }
}
