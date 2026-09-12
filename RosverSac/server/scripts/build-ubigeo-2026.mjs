/**
 * Regenera `server/data/ubigeo/*.json` desde el padrón 2026
 * (open-admin-data / peru-administrative-divisions).
 *
 * Uso: node server/scripts/build-ubigeo-2026.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, '../data/ubigeo')

const BASE =
  'https://raw.githubusercontent.com/open-admin-data/peru-administrative-divisions/master/data'

async function fetchJson(name) {
  const res = await fetch(`${BASE}/${name}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${name}`)
  return res.json()
}

function codeFromId(id) {
  return String(id).replace(/^PE/i, '')
}

function upperName(n) {
  return String(n || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .trim()
}

const depRaw = await fetchJson('all-department.json')
const provRaw = await fetchJson('all-province.json')
const distRaw = await fetchJson('all-district.json')

const departments = depRaw
  .slice()
  .sort((a, b) => codeFromId(a.id).localeCompare(codeFromId(b.id)))
  .map((d, i) => ({
    id: i + 1,
    departamento: upperName(d.name.local),
    ubigeo: codeFromId(d.id).padStart(2, '0'),
  }))

const depCodeToId = new Map(departments.map((d) => [d.ubigeo, d.id]))

const provinces = provRaw
  .slice()
  .sort((a, b) => codeFromId(a.id).localeCompare(codeFromId(b.id)))
  .map((p, i) => {
    const code = codeFromId(p.id).padStart(4, '0')
    const departamento_id = depCodeToId.get(code.slice(0, 2))
    if (!departamento_id) throw new Error(`Provincia sin depto: ${code}`)
    return {
      id: i + 1,
      provincia: upperName(p.name.local),
      ubigeo: code,
      departamento_id,
    }
  })

const provCodeToId = new Map(provinces.map((p) => [p.ubigeo, p.id]))

const districts = distRaw
  .slice()
  .sort((a, b) => codeFromId(a.id).localeCompare(codeFromId(b.id)))
  .map((d, i) => {
    const code = codeFromId(d.id).padStart(6, '0')
    const provincia_id = provCodeToId.get(code.slice(0, 4))
    const departamento_id = depCodeToId.get(code.slice(0, 2))
    if (!provincia_id || !departamento_id) {
      throw new Error(`Distrito sin padre: ${code}`)
    }
    return {
      id: i + 1,
      distrito: upperName(d.name.local),
      ubigeo: code,
      provincia_id,
      departamento_id,
    }
  })

const meta = {
  source: 'open-admin-data/peru-administrative-divisions',
  updated: '2026-06-28',
  year: 2026,
  counts: {
    departments: departments.length,
    provinces: provinces.length,
    districts: districts.length,
  },
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2))
fs.writeFileSync(
  path.join(outDir, 'departamentos.json'),
  JSON.stringify({ ubigeo_departamentos: departments }, null, '\t'),
)
fs.writeFileSync(
  path.join(outDir, 'provincias.json'),
  JSON.stringify({ ubigeo_provincias: provinces }, null, '\t'),
)
fs.writeFileSync(
  path.join(outDir, 'distritos.json'),
  JSON.stringify({ ubigeo_distritos: districts }, null, '\t'),
)

console.log('✓ Ubigeo 2026 escrito en', outDir)
console.log(meta)
