/**
 * Carga departamentos, provincias y distritos de Perú desde
 * `server/data/ubigeo/*.json` hacia Postgres (idempotente).
 *
 * Uso: npm run db:seed-ubigeo
 * También corre en boot de producción tras migrate.
 */
import { pool } from './db.js'
import {
  readUbigeoCatalogRows,
  ubigeoCatalogCounts,
} from './lib/ubigeo.js'

function titleCase(raw: string) {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')
}

async function seedUbigeo() {
  const { departments, provinces, districts } = readUbigeoCatalogRows()
  const expected = ubigeoCatalogCounts()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    // Reemplazo total: evita códigos viejos fuera del padrón 2026
    await client.query('DELETE FROM peru_districts')
    await client.query('DELETE FROM peru_provinces')
    await client.query('DELETE FROM peru_departments')

    const depIdToCode = new Map(departments.map((d) => [d.id, d.ubigeo]))
    const provIdToCode = new Map(provinces.map((p) => [p.id, p.ubigeo]))

    await client.query(
      `INSERT INTO peru_departments (code, name, sort_id)
       SELECT * FROM UNNEST($1::text[], $2::text[], $3::int[])
       ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             sort_id = EXCLUDED.sort_id`,
      [
        departments.map((d) => d.ubigeo),
        departments.map((d) => titleCase(d.departamento)),
        departments.map((d) => d.id),
      ],
    )

    const provCodes: string[] = []
    const provDepCodes: string[] = []
    const provNames: string[] = []
    const provSort: number[] = []
    for (const p of provinces) {
      const depCode = depIdToCode.get(p.departamento_id)
      if (!depCode) {
        throw new Error(
          `Provincia ${p.ubigeo} sin departamento_id=${p.departamento_id}`,
        )
      }
      provCodes.push(p.ubigeo)
      provDepCodes.push(depCode)
      provNames.push(titleCase(p.provincia))
      provSort.push(p.id)
    }

    await client.query(
      `INSERT INTO peru_provinces (code, department_code, name, sort_id)
       SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::int[])
       ON CONFLICT (code) DO UPDATE
         SET department_code = EXCLUDED.department_code,
             name = EXCLUDED.name,
             sort_id = EXCLUDED.sort_id`,
      [provCodes, provDepCodes, provNames, provSort],
    )

    const distCodes: string[] = []
    const distProvCodes: string[] = []
    const distDepCodes: string[] = []
    const distNames: string[] = []
    const distSort: number[] = []
    for (const d of districts) {
      const provCode = provIdToCode.get(d.provincia_id)
      const depCode = depIdToCode.get(d.departamento_id)
      if (!provCode || !depCode) {
        throw new Error(
          `Distrito ${d.ubigeo} sin provincia/departamento (p=${d.provincia_id} dep=${d.departamento_id})`,
        )
      }
      distCodes.push(d.ubigeo)
      distProvCodes.push(provCode)
      distDepCodes.push(depCode)
      distNames.push(titleCase(d.distrito))
      distSort.push(d.id)
    }

    await client.query(
      `INSERT INTO peru_districts (code, province_code, department_code, name, sort_id)
       SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::int[])
       ON CONFLICT (code) DO UPDATE
         SET province_code = EXCLUDED.province_code,
             department_code = EXCLUDED.department_code,
             name = EXCLUDED.name,
             sort_id = EXCLUDED.sort_id`,
      [distCodes, distProvCodes, distDepCodes, distNames, distSort],
    )

    await client.query('COMMIT')

    const counts = await client.query<{
      departments: string
      provinces: string
      districts: string
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM peru_departments) AS departments,
         (SELECT COUNT(*)::text FROM peru_provinces) AS provinces,
         (SELECT COUNT(*)::text FROM peru_districts) AS districts`,
    )
    const row = counts.rows[0]!
    console.log(
      `✓ Ubigeo seed: ${row.departments} deptos, ${row.provinces} provincias, ${row.districts} distritos`,
    )
    console.log(
      `  (JSON fuente: ${expected.departments}/${expected.provinces}/${expected.districts})`,
    )
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seedUbigeo().catch((err) => {
  console.error('Seed ubigeo falló:', err)
  process.exit(1)
})
