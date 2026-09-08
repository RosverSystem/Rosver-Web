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

export const config = {
  port: Number(req('PORT') || req('API_PORT', '8787')),
  databaseUrl:
    req('DATABASE_PUBLIC_URL') ||
    req('DATABASE_URL') ||
    '',
  corsOrigin: req(
    'CORS_ORIGIN',
    req('APP_URL', 'http://localhost:5173'),
  ),
  appUrl: req('APP_URL', 'http://localhost:5173'),
  apiUrl: req('API_URL', 'http://localhost:8787'),
  sessionCookie: req('SESSION_COOKIE', 'rosver_session'),
  sessionDays: Number(req('SESSION_DAYS', '14')),
  smtp: {
    host: req('SMTP_HOST', 'smtp.hostinger.com'),
    port: Number(req('SMTP_PORT', '465')),
    secure: req('SMTP_SECURE', 'true') !== 'false',
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
  },
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
    /** Si hay dominio/r2.dev público; si no, se sirve vía /api/media/… */
    publicBaseUrl: req('R2_PUBLIC_BASE_URL'),
  },
  /** Redis Railway — caché home/featured; opcional (degrada a Postgres) */
  redis: buildRedisConnection(),
  isProd: req('NODE_ENV') === 'production',
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
