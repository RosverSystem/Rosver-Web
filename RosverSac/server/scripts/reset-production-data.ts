/**
 * Vacía los datos de negocio de la base (Postgres) manteniendo intacto:
 *   - RBAC (modules, roles, permissions, role_permissions)
 *   - Ubigeo Perú (peru_departments/provinces/districts)
 *
 * También vacía `users` y `site_content` (arranque limpio).
 * El admin se recrea después con `npm run db:seed`
 * (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
 *
 * Uso (con DATABASE_URL de Railway):
 *   npx tsx server/scripts/reset-production-data.ts
 *   npx tsx server/scripts/reset-production-data.ts --apply
 */
import { pool } from '../src/db.js'

const BUSINESS_TABLES = [
  'offer_combo_items',
  'offer_combos',
  'product_promos',
  'product_reviews',
  'product_spec_values',
  'product_prices',
  'price_audit',
  'product_packagings',
  'unit_type_quantities',
  'products',
  'spec_attributes',
  'unit_types',
  'categories',
  'brands',
  'order_requests',
  'quote_requests',
  'contact_messages',
  'consumer_complaints',
  'user_product_views',
  'product_metrics_daily',
  'login_audit',
  'sessions',
  'auth_otps',
  'oauth_accounts',
  'login_challenges',
  'pending_registrations',
  'site_content',
  'users',
]

const apply = process.argv.includes('--apply')

async function main() {
  console.log(
    apply
      ? 'APLICANDO (--apply): se borran datos de verdad'
      : 'Dry-run (sin --apply): solo cuenta filas',
  )
  console.log('Tablas a vaciar:', BUSINESS_TABLES.join(', '))
  console.log('')

  for (const t of BUSINESS_TABLES) {
    try {
      const { rows } = await pool.query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM ${t}`,
      )
      console.log(`  ${t}: ${rows[0]?.n ?? '?'} filas`)
    } catch {
      console.log(`  ${t}: (no existe, se omite)`)
    }
  }

  if (apply) {
    console.log('\nBorrando...')
    const existing: string[] = []
    for (const t of BUSINESS_TABLES) {
      const { rows } = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = $1
         ) AS exists`,
        [t],
      )
      if (rows[0]?.exists) existing.push(t)
    }
    if (existing.length === 0) {
      console.log('No hay tablas que vaciar.')
    } else {
      await pool.query(
        `TRUNCATE ${existing.join(', ')} RESTART IDENTITY CASCADE`,
      )
      console.log('Listo. RBAC y ubigeo quedaron intactos.')
      console.log('  Corre ahora: npm run db:seed   (crea el admin)')
    }
  } else {
    console.log(
      '\nNada borrado. Vuelve a correr con --apply para ejecutar de verdad.',
    )
  }

  await pool.end()
}

main().catch((err) => {
  console.error('reset-production-data fallo:', err)
  process.exit(1)
})
