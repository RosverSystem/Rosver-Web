/**
 * Script: Migrar product_prices con price_kind='offer' → offer_combos.
 *
 * Por cada precio de oferta activo, crea un offer_combo de tipo bundle_fixed
 * con un solo ítem (ese producto + empaque), usando el precio de oferta como
 * fixed_price. Idempotente: omite si ya existe un combo con sku=OFFER-{código}.
 *
 * Los precios de oferta originales NO se destruyen; se marcan con migrated_to_combo_id.
 *
 * Uso:
 *   npx tsx server/scripts/migrate-offer-prices-to-combos.ts [--dry-run]
 *   npm run db:migrate-offers-to-combos
 *   npm run db:migrate-offers-to-combos -- --dry-run
 */

import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const sacRoot = path.resolve(here, '../..')
const repoRoot = path.resolve(sacRoot, '..')
loadEnv({ path: path.join(repoRoot, '.env') })
loadEnv({ path: path.join(sacRoot, '.env') })

import pg from 'pg'

const DRY_RUN = process.argv.includes('--dry-run')

const databaseUrl =
  process.env['DATABASE_PUBLIC_URL'] || process.env['DATABASE_URL']

if (!databaseUrl) {
  console.error('❌  Falta DATABASE_URL o DATABASE_PUBLIC_URL en el entorno.')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl:
    databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
})

type OfferPriceRow = {
  price_id: string
  product_id: string
  product_code: number
  product_sku: string
  product_slug: string
  product_name: string
  packaging_id: string
  packaging_label: string | null
  amount: string
  currency: string
  is_active: boolean
  migrated_to_combo_id: string | null
}

function buildComboSku(productCode: number | null, productSku: string): string {
  const base = productCode != null ? String(productCode) : productSku
  return `OFFER-${base}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function main() {
  console.log(`\n🚀  Migración offer prices → combos ${DRY_RUN ? '[DRY-RUN]' : ''}\n`)

  const client = await pool.connect()
  try {
    // 1. Leer precios de oferta activos no migrados aún
    const { rows: offerPrices } = await client.query<OfferPriceRow>(`
      SELECT
        pp.id AS price_id,
        p.id AS product_id,
        p.code AS product_code,
        p.sku AS product_sku,
        p.slug AS product_slug,
        p.name AS product_name,
        pk.id AS packaging_id,
        pk.label AS packaging_label,
        pp.amount,
        pp.currency,
        pp.is_active,
        pp.migrated_to_combo_id
      FROM product_prices pp
      JOIN products p ON p.id = pp.product_id
      JOIN product_packagings pk ON pk.id = pp.packaging_id
      WHERE pp.price_kind = 'offer'
        AND pp.is_active = true
        AND pp.migrated_to_combo_id IS NULL
      ORDER BY pp.created_at ASC
    `)

    if (offerPrices.length === 0) {
      console.log('ℹ️   No hay precios de oferta pendientes de migrar.')
      return
    }

    console.log(`📋  Precios de oferta encontrados: ${offerPrices.length}\n`)

    let created = 0
    let skipped = 0
    let errors = 0

    for (const row of offerPrices) {
      const comboSku = buildComboSku(row.product_code, row.product_sku)
      const comboSlug = slugify(`${comboSku}-${row.product_name}`)
      const comboName = `Oferta ${row.product_name}${row.packaging_label ? ` (${row.packaging_label})` : ''}`
      const fixedPrice = Number(row.amount)

      console.log(`  → ${row.product_sku} | SKU combo: ${comboSku} | Precio: S/ ${fixedPrice.toFixed(2)}`)

      if (DRY_RUN) {
        console.log(`     [dry-run] Crearía combo "${comboName}" (${comboSku})`)
        created++
        continue
      }

      // Verificar idempotencia: ¿ya existe el combo?
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM offer_combos WHERE sku = $1 LIMIT 1`,
        [comboSku],
      )

      if (existing.rows[0]) {
        const comboId = existing.rows[0].id
        console.log(`     ⏭  Ya existe combo ${comboSku} (${comboId}), marcando precio.`)
        // Marcar el precio con el combo existente
        await client.query(
          `UPDATE product_prices SET migrated_to_combo_id = $1 WHERE id = $2`,
          [comboId, row.price_id],
        )
        skipped++
        continue
      }

      // Crear el combo
      try {
        await client.query('BEGIN')

        const { rows: newCombo } = await client.query<{ id: string }>(
          `INSERT INTO offer_combos
             (sku, slug, name, description, kind, fixed_price, visible, sort_order)
           VALUES ($1, $2, $3, '', 'bundle_fixed', $4, true, 0)
           RETURNING id`,
          [comboSku, comboSlug, comboName, fixedPrice],
        )
        const comboId = newCombo[0].id

        // Agregar ítem al combo
        await client.query(
          `INSERT INTO offer_combo_items (combo_id, product_id, packaging_id, quantity, sort_order)
           VALUES ($1, $2, $3, 1, 0)`,
          [comboId, row.product_id, row.packaging_id],
        )

        // Marcar el precio original
        await client.query(
          `UPDATE product_prices SET migrated_to_combo_id = $1 WHERE id = $2`,
          [comboId, row.price_id],
        )

        await client.query('COMMIT')
        console.log(`     ✅  Combo creado: ${comboId}`)
        created++
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`     ❌  Error en ${comboSku}:`, err)
        errors++
      }
    }

    console.log(`\n📊  Resumen:`)
    console.log(`    Creados:  ${created}`)
    console.log(`    Omitidos: ${skipped}`)
    console.log(`    Errores:  ${errors}`)
    if (DRY_RUN) {
      console.log(`\n⚠️   Modo dry-run: ningún cambio fue persistido.\n`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
