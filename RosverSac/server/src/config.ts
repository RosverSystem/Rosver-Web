import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const sacRoot = path.resolve(here, '../..')
const repoRoot = path.resolve(sacRoot, '..')

loadEnv({ path: path.join(repoRoot, '.env') })
loadEnv({ path: path.join(sacRoot, '.env') })

function req(name: string, fallback = '') {
  return process.env[name]?.trim() || fallback
}

/**
 * Construye el conjunto de orígenes CORS permitidos.
 * Prioridad:
 *   1. CORS_ORIGINS (lista separada por comas)
 *   2. CORS_ORIGIN (único origen legacy)
 *   3. APP_URL como fallback
 * Si APP_URL es rosversac.com o www.rosversac.com, ambas variantes se incluyen automáticamente.
 */
function buildCorsOrigins(): Set<string> {
  const list = req('CORS_ORIGINS') || req('CORS_ORIGIN') || req('APP_URL', 'http://localhost:5173')
  const origins = new Set<string>(
    list.split(',').map((s) => s.trim()).filter(Boolean),
  )
  // Incluir www ↔ apex automáticamente para el dominio de producción
  for (const o of [...origins]) {
    if (o === 'https://rosversac.com') origins.add('https://www.rosversac.com')
    if (o === 'https://www.rosversac.com') origins.add('https://rosversac.com')
  }
  const appUrl = req('APP_URL', 'http://localhost:5173')
  if (appUrl === 'https://rosversac.com' || appUrl === 'https://www.rosversac.com') {
    origins.add('https://rosversac.com')
    origins.add('https://www.rosversac.com')
  }
  return origins
}

export const config = {
  port: Number(req('PORT') || req('API_PORT', '8787')),
  databaseUrl:
    req('DATABASE_PUBLIC_URL') ||
    req('DATABASE_URL') ||
    '',
  /** Conjunto de orígenes CORS permitidos (incluye www ↔ apex automáticamente). */
  corsOrigins: buildCorsOrigins(),
  /** Primer origen de la lista (compat. legacy para logs / redirects). */
  corsOrigin: req('CORS_ORIGIN') || req('CORS_ORIGINS', '').split(',')[0]?.trim() || req('APP_URL', 'http://localhost:5173'),
  appUrl: req('APP_URL', 'http://localhost:5173'),
  apiUrl: req('API_URL', 'http://localhost:8787'),
  sessionCookie: req('SESSION_COOKIE', 'rosver_session'),
  /** Dominio de la cookie (ej. .rosversac.com para subdominio). Solo si está en COOKIE_DOMAIN. */
  cookieDomain: req('COOKIE_DOMAIN') || undefined,
  sessionDays: Number(req('SESSION_DAYS', '14')),
  smtp: {
    host: req('SMTP_HOST', 'smtp.hostinger.com'),
    port: Number(req('SMTP_PORT', '587')),
    secure: req('SMTP_SECURE', 'false') === 'true',
    user: req('SMTP_USER', 'admin@multiserviciosmta.site'),
    pass: req('SMTP_PASS'),
    from: req('SMTP_FROM', 'Rosver SAC <admin@multiserviciosmta.site>'),
  },
  google: {
    clientId: req('GOOGLE_CLIENT_ID'),
    clientSecret: req('GOOGLE_CLIENT_SECRET'),
    redirectUri: req(
      'GOOGLE_REDIRECT_URI',
      'http://localhost:8787/api/auth/google/callback',
    ),
    /** Places / Maps (autocomplete de dirección en cotizar). Opcional. */
    mapsApiKey: req('GOOGLE_MAPS_API_KEY') || req('GOOGLE_PLACES_API_KEY'),
  },
  /** Geoapify Autocomplete (freemium). Si se agota → Nominatim. */
  geoapifyApiKey: req('GEOAPIFY_API_KEY'),
  seed: {
    adminEmail: req('SEED_ADMIN_EMAIL', 'admin@multiserviciosmta.site'),
    adminPassword: req('SEED_ADMIN_PASSWORD', 'RosverAdmin!2026'),
    clientEmail: req('SEED_CLIENT_EMAIL', 'acosta.wp076@gmail.com'),
    clientPassword: req('SEED_CLIENT_PASSWORD', 'RosverCliente!2026'),
  },
  r2: {
    endpoint: req('R2_ENDPOINT'),
    accessKeyId: req('R2_ACCESS_KEY_ID'),
    secretAccessKey: req('R2_SECRET_ACCESS_KEY'),
    bucketPublic: req('R2_BUCKET_PUBLIC', 'rosver-public-media'),
    /** Bucket sin CDN público (imports JSON, evidencias, docs). */
    bucketPrivate: req('R2_BUCKET_PRIVATE', 'rosver-private-docs'),
    /** Si hay dominio/r2.dev público; si no, se sirve vía /api/media/… */
    publicBaseUrl: req('R2_PUBLIC_BASE_URL'),
  },
  /** Redis Railway — caché home/featured; opcional (degrada a Postgres) */
  redis: buildRedisConnection(),
  /** Decolecta — consulta RUC/DNI (solo server) */
  decolectaApiKey: req('DECOLECTA_API_KEY'),
  isProd: req('NODE_ENV') === 'production',
  /** SHA del commit desplegado (Railway/CI → RAILWAY_GIT_COMMIT_SHA o GIT_COMMIT). */
  commitSha:
    req('RAILWAY_GIT_COMMIT_SHA') ||
    req('GIT_COMMIT') ||
    null as string | null,
}

export type RedisConnection = {
  /** Solo para health / logs (sin password). */
  configured: boolean
  host?: string
  port?: number
  password?: string
  /** URL normalizada sin user `default` (fallback ioredis). */
  url?: string
}

/**
 * Alpine + `--requirepass`: no enviar username `default` (ACL → WRONGPASS).
 * Preferimos host/port/password explícitos; la URL es respaldo.
 */
function buildRedisConnection(): RedisConnection {
  const full = req('REDIS_URL') || req('REDIS_PRIVATE_URL')
  if (full) {
    try {
      const u = new URL(full)
      const password = decodeURIComponent(u.password || '')
      const host = u.hostname
      const port = u.port ? Number(u.port) : 6379
      // Quitar user "default" / vacío en URL de respaldo
      u.username = ''
      const url = password
        ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
        : `redis://${host}:${port}`
      return { configured: true, host, port, password: password || undefined, url }
    } catch {
      return { configured: true, url: full }
    }
  }
  const host = req('REDISHOST') || req('REDIS_HOST')
  const port = Number(req('REDISPORT') || req('REDIS_PORT', '6379'))
  const password = req('REDISPASSWORD') || req('REDIS_PASSWORD')
  if (!host) return { configured: false }
  const url = password
    ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
    : `redis://${host}:${port}`
  return {
    configured: true,
    host,
    port,
    password: password || undefined,
    url,
  }
}

if (!config.databaseUrl) {
  console.warn('[config] Falta DATABASE_PUBLIC_URL o DATABASE_URL')
}
