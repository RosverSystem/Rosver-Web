import Redis from 'ioredis'
import { config } from '../config.js'

const FEATURED_KEY = 'rosver:catalog:featured:v1'
const FEATURED_TTL_SEC = 90

let client: Redis | null | undefined

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
    })
    client.on('error', (err) => {
      console.warn('[redis]', err.message)
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

export function redisStatus() {
  const r = getClient()
  return {
    configured: Boolean(config.redisUrl),
    status: r?.status ?? 'disabled',
  }
}
