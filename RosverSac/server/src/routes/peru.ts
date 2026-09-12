import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../config.js'
import {
  listDepartments,
  listDistricts,
  listProvinces,
  matchUbigeoFromPlaceNames,
} from '../lib/ubigeo.js'
import { suggestPeruAddresses } from '../lib/address-suggest.js'

/**
 * Proxy Decolecta (RUC/DNI) + ubigeo Perú + sugerencias de dirección.
 */
export const peruRoutes = new Hono()

peruRoutes.get('/departments', (c) => c.json({ items: listDepartments() }))

peruRoutes.get('/provinces', (c) => {
  const department = String(c.req.query('department') ?? '').trim()
  if (!/^\d{2}$/.test(department)) {
    return c.json({ error: 'Indica el departamento (código de 2 dígitos).' }, 400)
  }
  return c.json({ items: listProvinces(department) })
})

peruRoutes.get('/districts', (c) => {
  const province = String(c.req.query('province') ?? '').trim()
  if (!/^\d{4}$/.test(province)) {
    return c.json({ error: 'Indica la provincia (código de 4 dígitos).' }, 400)
  }
  return c.json({ items: listDistricts(province) })
})

peruRoutes.get('/address-suggest', async (c) => {
  const q = String(c.req.query('q') ?? '').trim()
  if (q.length < 3) {
    return c.json({ items: [] })
  }
  const items = await suggestPeruAddresses(q)
  return c.json({ items })
})

/** Resuelve componentes de Google Places → ubigeo Rosver. */
peruRoutes.post('/match-ubigeo', async (c) => {
  const body = z
    .object({
      state: z.string().optional().nullable(),
      county: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      town: z.string().optional().nullable(),
      suburb: z.string().optional().nullable(),
      city_district: z.string().optional().nullable(),
      municipality: z.string().optional().nullable(),
      addressLine: z.string().trim().min(1).max(240),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Datos de ubicación incompletos.' }, 400)
  }
  const matched = matchUbigeoFromPlaceNames(body.data)
  if (!matched) {
    return c.json(
      { error: 'No pudimos ubicar departamento, provincia y distrito.' },
      404,
    )
  }
  return c.json({
    ...matched,
    addressLine: body.data.addressLine,
  })
})

const lookupSchema = z.object({
  docType: z.enum(['DNI', 'RUC']),
  docNumber: z.string().trim().min(8).max(11),
})

peruRoutes.post('/lookup', async (c) => {
  const body = lookupSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Indica DNI (8 dígitos) o RUC (11 dígitos).' }, 400)
  }

  const key = config.decolectaApiKey
  if (!key) {
    return c.json(
      { error: 'Consulta de documento no configurada. Falta DECOLECTA_API_KEY.' },
      503,
    )
  }

  const digits = body.data.docNumber.replace(/\D/g, '')
  const { docType } = body.data

  if (docType === 'DNI' && !/^\d{8}$/.test(digits)) {
    return c.json({ error: 'El DNI debe tener 8 dígitos.' }, 400)
  }
  if (docType === 'RUC' && !/^(10|20)\d{9}$/.test(digits)) {
    return c.json(
      { error: 'El RUC debe tener 11 dígitos y empezar con 10 o 20.' },
      400,
    )
  }

  const url =
    docType === 'DNI'
      ? `https://api.decolecta.com/v1/reniec/dni?numero=${digits}`
      : `https://api.decolecta.com/v1/sunat/ruc?numero=${digits}`

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

    if (!res.ok) {
      const msg =
        typeof data.error === 'string'
          ? data.error
          : typeof data.message === 'string'
            ? data.message
            : 'No se pudo consultar el documento.'
      return c.json({ error: msg }, res.status === 404 ? 404 : 502)
    }

    if (docType === 'DNI') {
      const fullName =
        (typeof data.full_name === 'string' && data.full_name) ||
        [
          data.first_last_name,
          data.second_last_name,
          data.first_name,
        ]
          .filter((x) => typeof x === 'string' && x.trim())
          .join(' ')
          .trim()
      if (!fullName) {
        return c.json({ error: 'No encontramos datos para ese DNI.' }, 404)
      }
      return c.json({
        docType: 'DNI',
        docNumber: digits,
        fullName,
        firstName: typeof data.first_name === 'string' ? data.first_name : null,
        paternalLastName:
          typeof data.first_last_name === 'string' ? data.first_last_name : null,
        maternalLastName:
          typeof data.second_last_name === 'string'
            ? data.second_last_name
            : null,
      })
    }

    const businessName =
      (typeof data.razon_social === 'string' && data.razon_social) ||
      (typeof data.nombre_o_razon_social === 'string' &&
        data.nombre_o_razon_social) ||
      null
    if (!businessName) {
      return c.json({ error: 'No encontramos datos para ese RUC.' }, 404)
    }
    return c.json({
      docType: 'RUC',
      docNumber: digits,
      businessName,
      status: typeof data.estado === 'string' ? data.estado : null,
      condition: typeof data.condicion === 'string' ? data.condicion : null,
      address: typeof data.direccion === 'string' ? data.direccion : null,
    })
  } catch {
    return c.json({ error: 'Error al consultar Decolecta.' }, 502)
  }
})
