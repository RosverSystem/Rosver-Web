/**
 * Sugerencias de dirección Perú.
 * Orden: Google (si hay key) → Geoapify (freemium) → Nominatim gratis.
 * Si Geoapify llega al límite (429 / error de cuota) → Nominatim.
 */
import { config } from '../config.js'
import {
  matchUbigeoFromPlaceNames,
  searchUbigeoLocal,
  type AddressSuggestion,
} from './ubigeo.js'

type NominatimItem = {
  place_id: number
  display_name: string
  address?: Record<string, string>
}

type GooglePrediction = {
  place_id: string
  description: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

type GoogleDetails = {
  result?: {
    address_components?: {
      long_name: string
      short_name: string
      types: string[]
    }[]
    formatted_address?: string
    name?: string
  }
}

type GeoapifyFeature = {
  properties?: {
    place_id?: string
    formatted?: string
    address_line1?: string
    address_line2?: string
    street?: string
    housenumber?: string
    name?: string
    city?: string
    state?: string
    county?: string
    suburb?: string
    district?: string
    municipality?: string
    country_code?: string
  }
}

/** Soft-limit: si Geoapify responde 429, usamos Nominatim el resto del día. */
let geoapifyCooldownUntil = 0

function geoapifyOnCooldown() {
  return Date.now() < geoapifyCooldownUntil
}

function markGeoapifyLimited(hours = 6) {
  geoapifyCooldownUntil = Date.now() + hours * 60 * 60 * 1000
  console.warn(
    `[geoapify] límite/cuota — fallback Nominatim por ${hours}h`,
  )
}

/** Extrae nº de puerta del texto escrito (ej. "… 1669" o "1669-A"). */
export function extractHouseNumber(query: string): string | null {
  const all = [
    ...query.matchAll(/(?:^|[\s,.#])(\d{1,6}(?:-\d{1,4})?[A-Za-z]?)(?=\s|$|,)/g),
  ]
  const last = all[all.length - 1]
  return last?.[1] ?? null
}

function hasHouseNumber(line: string, house: string): boolean {
  return new RegExp(
    `(^|[\\s,#])${house.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s,#-])`,
    'i',
  ).test(line)
}

/** Une calle + número (si el proveedor no lo trae, usa el que escribió el usuario). */
export function withHouseNumber(
  line: string,
  house: string | null | undefined,
): string {
  const base = line.trim()
  if (!house) return base
  if (!base) return house
  if (hasHouseNumber(base, house)) return base
  return `${base} ${house}`
}

export async function suggestPeruAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const house = extractHouseNumber(q)
  const streetLike = looksLikeStreetAddress(q)

  let primary: AddressSuggestion[] = []

  if (config.google.mapsApiKey) {
    primary = await searchGooglePlaces(q, house, config.google.mapsApiKey)
  } else if (config.geoapifyApiKey && !geoapifyOnCooldown()) {
    primary = await searchGeoapify(q, house, config.geoapifyApiKey)
    // Si Geoapify falló/limitó y dejó vacío, Nominatim
    if (primary.length === 0) {
      primary = await searchNominatim(q, house)
    }
  } else {
    primary = await searchNominatim(q, house)
  }

  const local = streetLike
    ? []
    : searchUbigeoLocal(q, 4).map((item) => ({
        ...item,
        addressLine: withHouseNumber(
          item.addressLine || item.districtName,
          house,
        ),
        label: withHouseNumber(item.label, house),
      }))

  const merged: AddressSuggestion[] = []
  const seen = new Set<string>()

  for (const item of [...primary, ...local]) {
    const key = `${item.districtCode}:${item.addressLine}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
    if (merged.length >= 8) break
  }
  return merged
}

function looksLikeStreetAddress(q: string): boolean {
  return (
    /\b(jr\.?|jiron|jirón|av\.?|avenida|calle|psje\.?|pasaje|asoc\.?|asociacion|asociación|mz\.?|manzana|lt\.?|lote|urb\.?|urbanizacion|urbanización|etapa)\b/i.test(
      q,
    ) || /\d{2,}/.test(q)
  )
}

/**
 * Geoapify Autocomplete (Perú).
 * Docs: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
 */
async function searchGeoapify(
  query: string,
  houseFromQuery: string | null,
  apiKey: string,
): Promise<AddressSuggestion[]> {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
  url.searchParams.set('text', query)
  url.searchParams.set('filter', 'countrycode:pe')
  url.searchParams.set('lang', 'es')
  url.searchParams.set('limit', '8')
  url.searchParams.set('apiKey', apiKey)

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (res.status === 401 || res.status === 403 || res.status === 429) {
      markGeoapifyLimited(res.status === 429 ? 12 : 6)
      return []
    }
    if (!res.ok) return []

    const data = (await res.json()) as {
      features?: GeoapifyFeature[]
      message?: string
      error?: string
    }

    const errMsg = `${data.message ?? ''} ${data.error ?? ''}`.toLowerCase()
    if (
      errMsg.includes('limit') ||
      errMsg.includes('quota') ||
      errMsg.includes('credit')
    ) {
      markGeoapifyLimited(12)
      return []
    }

    const out: AddressSuggestion[] = []
    for (const f of data.features ?? []) {
      const p = f.properties ?? {}
      // En Perú Geoapify: city ≈ distrito; district/suburb ≈ barrio.
      // No mezclar barrio como único hint de distrito antes que city.
      const matched = matchUbigeoFromPlaceNames({
        state: p.state,
        county: p.county,
        city: p.city,
        town: null,
        suburb: p.suburb,
        city_district: p.district,
        municipality: p.municipality,
      })
      if (!matched) continue

      const road = p.street || p.name || ''
      const house = p.housenumber || houseFromQuery
      const addressLine =
        withHouseNumber(road, house) ||
        p.address_line1 ||
        matched.districtName

      out.push({
        id: `geo-${p.place_id ?? `${addressLine}-${matched.districtCode}`}`,
        label: addressLine,
        addressLine,
        source: 'maps',
        ...matched,
      })
    }
    return out
  } catch {
    return []
  }
}

async function searchNominatim(
  query: string,
  houseFromQuery: string | null,
): Promise<AddressSuggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', `${query}, Perú`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'pe')
  url.searchParams.set('limit', '8')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RosverSacCotizar/1.0 (contacto@rosver)',
      },
    })
    if (!res.ok) return []
    const rows = (await res.json()) as NominatimItem[]
    const out: AddressSuggestion[] = []
    for (const row of rows) {
      const a = row.address ?? {}
      const matched = matchUbigeoFromPlaceNames({
        state: a.state,
        county: a.county,
        city: a.city,
        town: a.town,
        suburb: a.suburb,
        city_district: a.city_district,
        municipality: a.municipality,
      })
      if (!matched) continue

      const road =
        a.road ||
        a.pedestrian ||
        a.path ||
        firstStreetFromDisplay(row.display_name)
      const house = a.house_number || houseFromQuery
      const addressLine = withHouseNumber(
        road || matched.districtName,
        house,
      )

      out.push({
        id: `osm-${row.place_id}`,
        label: addressLine,
        addressLine,
        source: 'maps',
        ...matched,
      })
    }
    return out
  } catch {
    return []
  }
}

function firstStreetFromDisplay(display: string): string {
  const first = display.split(',')[0]?.trim() ?? ''
  return first
}

async function searchGooglePlaces(
  query: string,
  houseFromQuery: string | null,
  apiKey: string,
): Promise<AddressSuggestion[]> {
  try {
    const autoUrl = new URL(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    )
    autoUrl.searchParams.set('input', query)
    autoUrl.searchParams.set('components', 'country:pe')
    autoUrl.searchParams.set('language', 'es')
    autoUrl.searchParams.set('types', 'address')
    autoUrl.searchParams.set('key', apiKey)

    const autoRes = await fetch(autoUrl.toString())
    if (!autoRes.ok) return searchNominatim(query, houseFromQuery)
    const autoJson = (await autoRes.json()) as {
      status?: string
      predictions?: GooglePrediction[]
    }
    if (
      autoJson.status !== 'OK' &&
      autoJson.status !== 'ZERO_RESULTS'
    ) {
      return searchNominatim(query, houseFromQuery)
    }

    const predictions = autoJson.predictions ?? []
    const out: AddressSuggestion[] = []

    for (const pred of predictions.slice(0, 6)) {
      const details = await fetchPlaceDetails(pred.place_id, apiKey)
      const comps = details?.result?.address_components ?? []
      const get = (...types: string[]) =>
        comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name ??
        null

      const matched = matchUbigeoFromPlaceNames({
        state: get('administrative_area_level_1'),
        county: get('administrative_area_level_2'),
        city: get('locality', 'administrative_area_level_2'),
        town: get('sublocality', 'sublocality_level_1'),
        suburb: get(
          'sublocality_level_1',
          'sublocality',
          'neighborhood',
        ),
        city_district: get('sublocality_level_1', 'sublocality'),
        municipality: get('locality'),
      })
      if (!matched) continue

      const route = get('route')
      const streetNumber =
        get('street_number') ||
        houseFromQuery ||
        extractHouseNumber(pred.structured_formatting?.main_text ?? '') ||
        extractHouseNumber(pred.description)
      const main =
        pred.structured_formatting?.main_text ||
        details?.result?.name ||
        route ||
        matched.districtName
      const addressLine = withHouseNumber(
        route ? withHouseNumber(route, streetNumber) : main,
        streetNumber,
      )

      out.push({
        id: `g-${pred.place_id}`,
        label: addressLine,
        addressLine,
        source: 'maps',
        ...matched,
      })
    }
    return out.length > 0 ? out : searchNominatim(query, houseFromQuery)
  } catch {
    return searchNominatim(query, houseFromQuery)
  }
}

async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<GoogleDetails | null> {
  const url = new URL(
    'https://maps.googleapis.com/maps/api/place/details/json',
  )
  url.searchParams.set('place_id', placeId)
  url.searchParams.set(
    'fields',
    'address_component,formatted_address,name',
  )
  url.searchParams.set('language', 'es')
  url.searchParams.set('key', apiKey)
  const res = await fetch(url.toString())
  if (!res.ok) return null
  return (await res.json()) as GoogleDetails
}
