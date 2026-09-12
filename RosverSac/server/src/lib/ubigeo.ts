import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type DepRow = { id: number; departamento: string; ubigeo: string }
type ProvRow = {
  id: number
  provincia: string
  ubigeo: string
  departamento_id: number
}
type DistRow = {
  id: number
  distrito: string
  ubigeo: string
  provincia_id: number
  departamento_id: number
}

export type UbigeoOption = { code: string; name: string }

export type ResolvedUbigeo = {
  departmentCode: string
  departmentName: string
  provinceCode: string
  provinceName: string
  districtCode: string
  districtName: string
}

export type AddressSuggestion = ResolvedUbigeo & {
  id: string
  label: string
  addressLine: string
  source: 'ubigeo' | 'maps'
}

function titleCase(raw: string) {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function norm(raw: string) {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Quita prefijos OSM/Geoapify que no son el nombre ubigeo. */
function normalizePlaceHint(raw: string): string {
  let n = norm(raw)
  n = n
    .replace(/^provincia (de |del )?/, '')
    .replace(/^departamento (de |del )?/, '')
    .replace(/^distrito (de |del )?/, '')
    .replace(/\s+metropolitana$/, '')
    .trim()
  if (n === 'lima metropolitana' || n === 'callao region') {
    return n.startsWith('callao') ? 'callao' : 'lima'
  }
  return n
}

const dataDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/ubigeo',
)

const departments: DepRow[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'departamentos.json'), 'utf8'),
).ubigeo_departamentos

const provinces: ProvRow[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'provincias.json'), 'utf8'),
).ubigeo_provincias

const districts: DistRow[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'distritos.json'), 'utf8'),
).ubigeo_distritos

const depByCode = new Map(departments.map((d) => [d.ubigeo, d]))
const depById = new Map(departments.map((d) => [d.id, d]))
const provByCode = new Map(provinces.map((p) => [p.ubigeo, p]))
const provById = new Map(provinces.map((p) => [p.id, p]))
const distByCode = new Map(districts.map((d) => [d.ubigeo, d]))

const districtsIndexed = districts.map((d) => {
  const prov = provById.get(d.provincia_id)!
  const dep = depById.get(d.departamento_id)!
  return {
    dist: d,
    prov,
    dep,
    key: norm(`${d.distrito} ${prov.provincia} ${dep.departamento}`),
    distKey: norm(d.distrito),
  }
})

export function listDepartments(): UbigeoOption[] {
  return departments
    .map((d) => ({ code: d.ubigeo, name: titleCase(d.departamento) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function listProvinces(departmentCode: string): UbigeoOption[] {
  const dep = depByCode.get(departmentCode)
  if (!dep) return []
  return provinces
    .filter((p) => p.departamento_id === dep.id)
    .map((p) => ({ code: p.ubigeo, name: titleCase(p.provincia) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function listDistricts(provinceCode: string): UbigeoOption[] {
  const prov = provByCode.get(provinceCode)
  if (!prov) return []
  return districts
    .filter((d) => d.provincia_id === prov.id)
    .map((d) => ({ code: d.ubigeo, name: titleCase(d.distrito) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function resolveUbigeo(input: {
  departmentCode: string
  provinceCode: string
  districtCode: string
}): ResolvedUbigeo | null {
  const dep = depByCode.get(input.departmentCode)
  const prov = provByCode.get(input.provinceCode)
  const dist = distByCode.get(input.districtCode)
  if (!dep || !prov || !dist) return null
  if (prov.departamento_id !== dep.id) return null
  if (dist.provincia_id !== prov.id || dist.departamento_id !== dep.id) {
    return null
  }
  return {
    departmentCode: dep.ubigeo,
    departmentName: titleCase(dep.departamento),
    provinceCode: prov.ubigeo,
    provinceName: titleCase(prov.provincia),
    districtCode: dist.ubigeo,
    districtName: titleCase(dist.distrito),
  }
}

function toResolved(dep: DepRow, prov: ProvRow, dist: DistRow): ResolvedUbigeo {
  return {
    departmentCode: dep.ubigeo,
    departmentName: titleCase(dep.departamento),
    provinceCode: prov.ubigeo,
    provinceName: titleCase(prov.provincia),
    districtCode: dist.ubigeo,
    districtName: titleCase(dist.distrito),
  }
}

/** Busca distrito/provincia/depto en catálogo ubigeo (rápido, offline). */
export function searchUbigeoLocal(query: string, limit = 8): AddressSuggestion[] {
  const q = norm(query)
  if (q.length < 2) return []
  const tokens = q.split(' ').filter((t) => t.length >= 2)
  const scored: { score: number; item: (typeof districtsIndexed)[number] }[] =
    []

  for (const row of districtsIndexed) {
    let score = 0
    if (row.distKey === q || row.key === q) score = 100
    else if (row.distKey.startsWith(q)) score = 80
    else if (row.key.includes(q)) score = 60
    else if (tokens.length > 0 && tokens.every((t) => row.key.includes(t))) {
      score = 50 + tokens.length * 5
    } else if (tokens.some((t) => row.distKey.includes(t))) {
      score = 30
    }
    if (score > 0) scored.push({ score, item: row })
  }

  scored.sort(
    (a, b) =>
      b.score - a.score || a.item.distKey.localeCompare(b.item.distKey),
  )
  return scored.slice(0, limit).map(({ item }) => {
    const resolved = toResolved(item.dep, item.prov, item.dist)
    return {
      id: `ubi-${resolved.districtCode}`,
      label: `${resolved.districtName}, ${resolved.provinceName}, ${resolved.departmentName}`,
      addressLine: '',
      source: 'ubigeo' as const,
      ...resolved,
    }
  })
}

function findByExactName<T>(
  rows: T[],
  hints: string[],
  nameOf: (row: T) => string,
): T | null {
  for (const hint of hints) {
    if (!hint) continue
    const hit = rows.find((row) => normalizePlaceHint(nameOf(row)) === hint)
    if (hit) return hit
  }
  return null
}

function findByFuzzyName<T>(
  rows: T[],
  hints: string[],
  nameOf: (row: T) => string,
): T | null {
  for (const hint of hints) {
    if (!hint || hint.length < 3) continue
    const hit = rows.find((row) => {
      const n = normalizePlaceHint(nameOf(row))
      return n.includes(hint) || hint.includes(n)
    })
    if (hit) return hit
  }
  return null
}

/**
 * Empareja nombres OSM/Nominatim/Geoapify con nuestro ubigeo.
 * Prioriza distrito real (suburb/district/city) y evita caer en «Lima»
 * cuando city=Lima pero el distrito viene en otro campo.
 */
export function matchUbigeoFromPlaceNames(input: {
  state?: string | null
  county?: string | null
  city?: string | null
  town?: string | null
  suburb?: string | null
  city_district?: string | null
  municipality?: string | null
}): ResolvedUbigeo | null {
  const depName = normalizePlaceHint(input.state ?? '')
  if (!depName) return null

  const dep =
    departments.find((d) => {
      const n = normalizePlaceHint(d.departamento)
      return n === depName || n.includes(depName) || depName.includes(n)
    }) ?? null
  if (!dep) return null

  const provCandidates = provinces.filter((p) => p.departamento_id === dep.id)
  const depNorm = normalizePlaceHint(dep.departamento)

  const provHints = [
    input.county,
    input.municipality,
    input.city,
    input.town,
  ]
    .filter(Boolean)
    .map((x) => normalizePlaceHint(String(x)))
    .filter(Boolean)

  let prov =
    findByExactName(provCandidates, provHints, (p) => p.provincia) ??
    findByFuzzyName(provCandidates, provHints, (p) => p.provincia)

  if (!prov && dep.ubigeo === '15') {
    // Lima Metropolitana / city genérica → provincia Lima
    prov = provCandidates.find((p) => p.ubigeo === '1501') ?? null
  }
  if (!prov && dep.ubigeo === '07') {
    prov = provCandidates.find((p) => p.ubigeo === '0701') ?? null
  }
  if (!prov && provCandidates.length === 1) prov = provCandidates[0]!
  if (!prov) return null

  const distCandidates = districts.filter((d) => d.provincia_id === prov!.id)
  const provNorm = normalizePlaceHint(prov.provincia)

  const notDepOrProv = (h: string) => Boolean(h) && h !== depNorm && h !== provNorm

  /**
   * En Perú (Geoapify/OSM) `city` suele ser el distrito.
   * `suburb`/`district` a veces son barrios → van después.
   * Si city = "Lima" (mismo que depto/prov), se descarta y se usa el barrio.
   */
  const cityHints = [input.city, input.municipality]
    .filter(Boolean)
    .map((x) => normalizePlaceHint(String(x)))
    .filter(notDepOrProv)

  const neighborhoodHints = [
    input.suburb,
    input.city_district,
    input.town,
  ]
    .filter(Boolean)
    .map((x) => normalizePlaceHint(String(x)))
    .filter(notDepOrProv)

  const dist =
    findByExactName(distCandidates, cityHints, (d) => d.distrito) ??
    findByExactName(distCandidates, neighborhoodHints, (d) => d.distrito) ??
    findByFuzzyName(distCandidates, cityHints, (d) => d.distrito) ??
    findByFuzzyName(distCandidates, neighborhoodHints, (d) => d.distrito)

  if (!dist) return null
  return toResolved(dep, prov, dist)
}

/** Conteos del catálogo (JSON) — útil para seed/scripts. */
export function ubigeoCatalogCounts() {
  return {
    departments: departments.length,
    provinces: provinces.length,
    districts: districts.length,
  }
}

export function readUbigeoCatalogRows() {
  return { departments, provinces, districts }
}
