import { cn, cnField } from '@/shared/lib'
import { api } from '@/shared/lib/api'
import { attachNestedScrollWheel } from '@/shared/lib/nested-scroll-wheel'
import {
  emptyUbigeo,
  PeruUbigeoFields,
  type UbigeoValue,
} from '@/shared/ui/peru-ubigeo-fields'
import { Search } from 'cssvg-icons'
import { useEffect, useId, useRef, useState } from 'react'

export type AddressSuggestItem = UbigeoValue & {
  id: string
  label: string
  addressLine: string
  source: 'ubigeo' | 'maps'
}

type PeruAddressSuggestProps = {
  id?: string
  address: string
  ubigeo: UbigeoValue
  onAddressChange: (address: string) => void
  onUbigeoChange: (ubigeo: UbigeoValue) => void
  invalidAddress?: boolean
  invalidUbigeo?: boolean
  className?: string
}

const GOOGLE_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
)?.trim()

function formatUbigeoLine(u: Pick<
  UbigeoValue,
  'districtName' | 'provinceName' | 'departmentName'
>) {
  return `${u.districtName} · Prov. ${u.provinceName} · ${u.departmentName}`
}

/**
 * Dirección de destino:
 * - Con `VITE_GOOGLE_MAPS_API_KEY` → Google Places.
 * - Sin key → Geoapify / Nominatim vía API.
 * - Ubigeo siempre editable a mano (dep / prov / dist).
 */
export function PeruAddressSuggest(props: PeruAddressSuggestProps) {
  if (GOOGLE_KEY) {
    return <GoogleAddressSuggest apiKey={GOOGLE_KEY} {...props} />
  }
  return <OsmAddressSuggest {...props} />
}

function UbigeoManualBlock({
  idPrefix,
  ubigeo,
  onUbigeoChange,
  invalidUbigeo,
  manualOpen,
  onToggleManual,
}: {
  idPrefix: string
  ubigeo: UbigeoValue
  onUbigeoChange: (ubigeo: UbigeoValue) => void
  invalidUbigeo?: boolean
  manualOpen: boolean
  onToggleManual: () => void
}) {
  const filled =
    Boolean(ubigeo.departmentCode) &&
    Boolean(ubigeo.provinceCode) &&
    Boolean(ubigeo.districtCode)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-rosver-muted">
          {filled
            ? formatUbigeoLine(ubigeo)
            : 'Distrito, provincia y departamento'}
        </p>
        <button
          type="button"
          onClick={onToggleManual}
          className="text-xs font-bold text-rosver-red underline-offset-2 hover:underline"
        >
          {manualOpen ? 'Ocultar selects' : 'Elegir a mano'}
        </button>
      </div>
      {manualOpen ? (
        <PeruUbigeoFields
          idPrefix={idPrefix}
          value={ubigeo}
          onChange={onUbigeoChange}
          invalid={
            invalidUbigeo
              ? { department: true, province: true, district: true }
              : undefined
          }
        />
      ) : filled ? (
        <div className="grid gap-2 rounded-xl border border-rosver-line bg-rosver-soft/50 px-3.5 py-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-rosver-muted uppercase">
              Departamento
            </p>
            <p className="font-semibold text-rosver-ink">
              {ubigeo.departmentName}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-rosver-muted uppercase">
              Provincia
            </p>
            <p className="font-semibold text-rosver-ink">
              {ubigeo.provinceName}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-rosver-muted uppercase">
              Distrito
            </p>
            <p className="font-semibold text-rosver-ink">
              {ubigeo.districtName}
            </p>
          </div>
        </div>
      ) : invalidUbigeo ? (
        <p className="text-xs font-medium text-rosver-red">
          Elige una sugerencia o completa ubicación a mano.
        </p>
      ) : null}
    </div>
  )
}

/* ─── Google Places ───────────────────────────────────────────── */

function GoogleAddressSuggest({
  id,
  address,
  ubigeo,
  onAddressChange,
  onUbigeoChange,
  invalidAddress,
  invalidUbigeo,
  className,
  apiKey,
}: PeruAddressSuggestProps & { apiKey: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)

  useEffect(() => {
    if (inputRef.current && address && inputRef.current.value !== address) {
      inputRef.current.value = address
    }
  }, [address])

  useEffect(() => {
    let cancelled = false
    let listener: google.maps.MapsEventListener | null = null
    let autocomplete: google.maps.places.Autocomplete | null = null

    async function boot() {
      try {
        const { setOptions, importLibrary } = await import(
          '@googlemaps/js-api-loader'
        )
        setOptions({
          key: apiKey,
          v: 'weekly',
          language: 'es',
          region: 'PE',
        })
        await importLibrary('places')
        if (cancelled || !inputRef.current) return

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'pe' },
          fields: ['address_components', 'formatted_address', 'name'],
          types: ['address'],
        })

        inputRef.current.setAttribute('autocomplete', 'new-password')

        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete?.getPlace()
          if (!place?.address_components?.length) return

          const get = (...types: string[]) =>
            place.address_components?.find((c) =>
              types.some((t) => c.types.includes(t)),
            )?.long_name ?? null

          const route = get('route')
          const streetNumber = get('street_number')
          const line =
            [route, streetNumber].filter(Boolean).join(' ') ||
            place.name ||
            place.formatted_address ||
            ''

          void api<{
            departmentCode: string
            departmentName: string
            provinceCode: string
            provinceName: string
            districtCode: string
            districtName: string
            addressLine: string
          }>('/api/peru/match-ubigeo', {
            method: 'POST',
            body: JSON.stringify({
              addressLine: line || place.formatted_address,
              state: get('administrative_area_level_1'),
              county: get('administrative_area_level_2'),
              city: get('locality'),
              town: get('sublocality', 'sublocality_level_1'),
              suburb: get(
                'sublocality_level_1',
                'sublocality',
                'neighborhood',
              ),
              city_district: get('sublocality_level_1', 'sublocality'),
              municipality: get('locality'),
            }),
          })
            .then((matched) => {
              const next = matched.addressLine || line
              if (inputRef.current) inputRef.current.value = next
              onAddressChange(next)
              onUbigeoChange({
                departmentCode: matched.departmentCode,
                departmentName: matched.departmentName,
                provinceCode: matched.provinceCode,
                provinceName: matched.provinceName,
                districtCode: matched.districtCode,
                districtName: matched.districtName,
              })
              setManualOpen(false)
            })
            .catch(() => {
              if (line) {
                if (inputRef.current) inputRef.current.value = line
                onAddressChange(line)
              }
              setManualOpen(true)
            })
        })

        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar Google Places.')
          setManualOpen(true)
        }
      }
    }

    void boot()
    return () => {
      cancelled = true
      if (listener) listener.remove()
    }
  }, [apiKey, onAddressChange, onUbigeoChange])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative">
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-bold text-rosver-ink"
        >
          Dirección de destino *
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            defaultValue={address}
            placeholder="Calle, número, distrito…"
            aria-invalid={invalidAddress || invalidUbigeo}
            onInput={(e) => {
              const v = e.currentTarget.value
              onAddressChange(v)
              if (
                ubigeo.departmentCode ||
                ubigeo.provinceCode ||
                ubigeo.districtCode
              ) {
                onUbigeoChange(emptyUbigeo())
              }
            }}
            className={cnField(
              'min-h-12 w-full rounded-xl border border-rosver-line bg-rosver-soft/50 py-2.5 pr-11 pl-3.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted/80 focus:border-rosver-red/35 focus:bg-white focus:ring-2 focus:ring-rosver-red/10',
              Boolean(invalidAddress || invalidUbigeo),
            )}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-rosver-muted">
            <Search size={18} color="currentColor" strokeWidth={2} />
          </span>
        </div>
        {loadError ? (
          <p className="mt-1 text-[11px] text-rosver-red">{loadError}</p>
        ) : !ready ? (
          <p className="mt-1 text-[11px] text-rosver-muted">Cargando Maps…</p>
        ) : null}
      </div>
      <UbigeoManualBlock
        idPrefix={`${id ?? 'ship'}-ubi`}
        ubigeo={ubigeo}
        onUbigeoChange={onUbigeoChange}
        invalidUbigeo={invalidUbigeo}
        manualOpen={manualOpen}
        onToggleManual={() => setManualOpen((v) => !v)}
      />
    </div>
  )
}

/* ─── Geoapify / Nominatim via API ────────────────────────────── */

function OsmAddressSuggest({
  id,
  address,
  ubigeo,
  onAddressChange,
  onUbigeoChange,
  invalidAddress,
  invalidUbigeo,
  className,
}: PeruAddressSuggestProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const lockedRef = useRef(false)
  const [query, setQuery] = useState(address)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [items, setItems] = useState<AddressSuggestItem[]>([])
  const [manualOpen, setManualOpen] = useState(false)

  useEffect(() => {
    setQuery(address)
  }, [address])

  useEffect(() => {
    if (lockedRef.current) return
    const q = query.trim()
    if (q.length < 3) {
      setItems([])
      setOpen(false)
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      setBusy(true)
      void api<{ items: AddressSuggestItem[] }>(
        `/api/peru/address-suggest?q=${encodeURIComponent(q)}`,
      )
        .then((data) => {
          if (cancelled || lockedRef.current) return
          setItems(data.items)
          setOpen(data.items.length > 0)
        })
        .catch(() => {
          if (!cancelled && !lockedRef.current) {
            setItems([])
            setOpen(false)
          }
        })
        .finally(() => {
          if (!cancelled) setBusy(false)
        })
    }, 320)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [query])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    return attachNestedScrollWheel(el)
  }, [open, items.length])

  function pick(item: AddressSuggestItem) {
    const nextAddress =
      item.addressLine.trim() ||
      query.trim() ||
      `${item.districtName}, ${item.provinceName}`
    lockedRef.current = true
    setItems([])
    setOpen(false)
    setBusy(false)
    setQuery(nextAddress)
    setManualOpen(false)
    onAddressChange(nextAddress)
    onUbigeoChange({
      departmentCode: item.departmentCode,
      departmentName: item.departmentName,
      provinceCode: item.provinceCode,
      provinceName: item.provinceName,
      districtCode: item.districtCode,
      districtName: item.districtName,
    })
  }

  return (
    <div ref={rootRef} className={cn('flex flex-col gap-3', className)}>
      <div className="relative">
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-bold text-rosver-ink"
        >
          Dirección de destino *
        </label>
        <div className="relative">
          <input
            id={id}
            value={query}
            autoComplete="off"
            placeholder="Calle, número, distrito…"
            aria-invalid={invalidAddress || invalidUbigeo}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            onChange={(e) => {
              lockedRef.current = false
              const v = e.target.value
              setQuery(v)
              onAddressChange(v)
              if (
                ubigeo.departmentCode ||
                ubigeo.provinceCode ||
                ubigeo.districtCode
              ) {
                onUbigeoChange(emptyUbigeo())
              }
            }}
            className={cnField(
              'min-h-12 w-full rounded-xl border border-rosver-line bg-rosver-soft/50 py-2.5 pr-11 pl-3.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted/80 focus:border-rosver-red/35 focus:bg-white focus:ring-2 focus:ring-rosver-red/10',
              Boolean(invalidAddress || invalidUbigeo),
            )}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-rosver-muted">
            <Search size={18} color="currentColor" strokeWidth={2} />
          </span>
        </div>
        {busy ? (
          <p className="mt-1 text-[11px] text-rosver-muted">Buscando…</p>
        ) : null}
        {open && items.length > 0 ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-xl border border-rosver-line bg-white py-1 shadow-[0_16px_40px_-24px_rgba(17,17,17,0.55)]"
            data-lenis-prevent
          >
            {items.map((item) => (
              <li key={item.id} role="option">
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-rosver-soft"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(item)
                  }}
                >
                  <span className="text-sm font-semibold text-rosver-ink">
                    {item.addressLine || item.districtName}
                  </span>
                  <span className="text-xs text-rosver-muted">
                    {formatUbigeoLine(item)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <UbigeoManualBlock
        idPrefix={`${id ?? 'ship'}-ubi`}
        ubigeo={ubigeo}
        onUbigeoChange={onUbigeoChange}
        invalidUbigeo={invalidUbigeo}
        manualOpen={manualOpen}
        onToggleManual={() => setManualOpen((v) => !v)}
      />
    </div>
  )
}
