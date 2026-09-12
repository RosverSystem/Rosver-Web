/**
 * Vacía los datos de negocio de la base (Postgres) manteniendo intacto:
 *   - RBAC (modules, roles, permissions, role_permissions)
 *   - Ubigeo Perú (peru_departments/provinces/districts) — lo necesitan
 *     los formularios de /cotizar y /pedido para funcionar.
 *   - site_content — textos del home; sin esto la portada queda vacía.
 *   - users: NO se toca aquí. El admin pedido se crea vía `npm run db:seed`
 *     (o boot.ts) usando SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD.
 *
 * Uso (con DATABASE_URL apuntando a la Postgres de Railway):
 *   npx tsx server/scripts/reset-production-data.ts
 *   npx tsx server/scripts/reset-production-data.ts --apply   (sin --apply = dry-run)
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
]

const apply = process.argv.includes('--apply')

async function main() {
  console.log(apply ? '⚠️  APLICANDO (--apply): se borran datos de verdad' : 'Dry-run (sin --apply): solo cuenta filas')
  console.log('Tablas a vaciar:', BUSINESS_TABLES.join(', '))
  console.log('')

  for (const t of BUSINESS_TABLES) {
    const { rows } = await pool.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM ${t}`)
    console.log(`  ${t}: ${rows[0]?.n ?? '?'} filas`)
  }

  if (apply) {
    console.log('\nBorrando...')
    await pool.query(`TRUNCATE ${BUSINESS_TABLES.join(', ')} RESTART IDENTITY CASCADE`)
    console.log('✓ Listo. RBAC, ubigeo y site_content quedaron intactos.')
    console.log('  Corre ahora: npm run db:seed   (crea/actualiza el admin y el cliente demo)')
  } else {
    console.log('\nNada borrado. Vuelve a correr con --apply para ejecutar de verdad.')
  }

  await pool.end()
}

main().catch((err) => {
  console.error('reset-production-data falló:', err)
  process.exit(1)
})
