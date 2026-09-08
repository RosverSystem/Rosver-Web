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
  isProd: req('NODE_ENV') === 'production',
}

if (!config.databaseUrl) {
  console.warn('[config] Falta DATABASE_PUBLIC_URL o DATABASE_URL')
}
