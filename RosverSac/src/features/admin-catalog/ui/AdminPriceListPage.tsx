import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
} from '@/shared/ui/admin-field'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

type ProductRow = {
  id: string
  name: string
  sku: string
  brandName: string | null
}

type UnitType = {
  id: string
  code: string
  name: string
  isBase?: boolean
}

type Packaging = {
  id: string
  unitTypeId: string
  unitName: string
  contentQty: number
  label: string | null
  isDefault: boolean
}

type Price = {
  id: string
  packagingId: string
  priceKind: string
  minQty: number
  amount: number
  compareAtAmount: number | null
  isActive: boolean
}

const KIND_LABEL: Record<string, string> = {
  list: 'Venta',
  wholesale: 'Mayorista',
  offer: 'Oferta',
  custom: 'Otro',
}

function packagingTitle(pk: Packaging) {
  const base = pk.label?.trim() || pk.unitName
  const qty = Number(pk.contentQty)
  return qty === 1 ? `${base} · 1 u.` : `${base} · ${qty} u.`
}

/**
 * Listado de precios — flujo tipo ubicación:
 * 1) tipo de unidad + cantidad → presentación
 * 2) dentro de esa presentación → varios precios (venta, mayorista, oferta…)
 */
export function AdminPriceListPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  const [unitTypeId, setUnitTypeId] = useState('')
  const [contentQty, setContentQty] = useState('1')
  const [packLabel, setPackLabel] = useState('')
  const [newUnitName, setNewUnitName] = useState('')
  const [listAmount, setListAmount] = useState('')
  const [wholesaleAmount, setWholesaleAmount] = useState('')

  const [packagingId, setPackagingId] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('list')
  const [amount, setAmount] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [minQty, setMinQty] = useState('1')

  const selected = products.find((p) => p.id === selectedId) ?? null
  const activePack = packagings.find((p) => p.id === packagingId) ?? null
  const pricesForPack = prices.filter(
    (p) => p.isActive && p.packagingId === packagingId,
  )

  async function loadUnitTypes() {
    const units = await api<{ unitTypes: UnitType[] }>('/api/admin/unit-types')
    setUnitTypes(units.unitTypes)
    setUnitTypeId((prev) =>
      units.unitTypes.some((u) => u.id === prev)
        ? prev
        : (units.unitTypes[0]?.id ?? ''),
    )
    return units.unitTypes
  }

  async function loadProducts() {
    setLoading(true)
    try {
      const [prod] = await Promise.all([
        api<{ products: ProductRow[] }>('/api/admin/products'),
        loadUnitTypes(),
      ])
      setProducts(prod.products)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo cargar el listado',
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(id: string, preferPackId?: string) {
    setBusy(true)
    try {
      const data = await api<{
        packagings: Packaging[]
        prices: Price[]
      }>(`/api/admin/products/${id}`)
      setPackagings(data.packagings)
      setPrices(data.prices)
      const prefer =
        preferPackId && data.packagings.some((x) => x.id === preferPackId)
          ? preferPackId
          : null
      const def =
        prefer ??
        (data.packagings.find((x) => x.isDefault) ?? data.packagings[0])?.id ??
        ''
      setPackagingId(def)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo abrir el producto',
      ])
      setSelectedId(null)
    } finally {
      setBusy(false)
    }
  }

  async function openProduct(id: string) {
    clear()
    setSelectedId(id)
    setPackLabel('')
    setContentQty('1')
    setAmount('')
    setCompareAt('')
    setMinQty('1')
    setPriceKind('list')
    setNewUnitName('')
    await loadDetail(id)
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false),
    )
  }, [products, query])

  async function createUnitTypeInline() {
    clear()
    const name = newUnitName.trim()
    if (!name) {
      showMessages(['Escribe el tipo (ej. Caja, Paquete)'])
      return
    }
    setBusy(true)
    try {
      const created = await api<{ unitType: UnitType }>('/api/admin/unit-types', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      setNewUnitName('')
      const list = await loadUnitTypes()
      const id = created.unitType?.id
      if (id) setUnitTypeId(id)
      else {
        const match = list.find((u) => u.name.toLowerCase() === name.toLowerCase())
        if (match) setUnitTypeId(match.id)
      }
      showMessages(['Tipo de unidad creado — ahora pon la cantidad'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo crear el tipo',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function addPresentation(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId) return
    if (!unitTypeId) {
      showMessages(['Selecciona o crea un tipo de unidad'])
      return
    }
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica cuántas unidades lleva esa presentación'])
      return
    }
    const listAmt = Number(listAmount)
    if (!Number.isFinite(listAmt) || listAmt < 0) {
      showMessages(['Pon el precio de venta'])
      return
    }
    const whAmt =
      wholesaleAmount.trim() === '' ? null : Number(wholesaleAmount)
    if (whAmt != null && (!Number.isFinite(whAmt) || whAmt < 0)) {
      showMessages(['El precio mayorista no es válido'])
      return
    }
    setBusy(true)
    try {
      const res = await api<{ packaging: { id: string } }>(
        `/api/admin/products/${selectedId}/packagings`,
        {
          method: 'POST',
          body: JSON.stringify({
            unitTypeId,
            contentQty: qty,
            label: packLabel.trim() || undefined,
            isDefault: packagings.length === 0,
          }),
        },
      )
      const packId = res.packaging.id
      await api(`/api/admin/products/${selectedId}/prices`, {
        method: 'POST',
        body: JSON.stringify({
          packagingId: packId,
          priceKind: 'list',
          minQty: 1,
          amount: listAmt,
        }),
      })
      if (whAmt != null) {
        await api(`/api/admin/products/${selectedId}/prices`, {
          method: 'POST',
          body: JSON.stringify({
            packagingId: packId,
            priceKind: 'wholesale',
            minQty: 1,
            amount: whAmt,
          }),
        })
      }
      setPackLabel('')
      setContentQty('1')
      setListAmount('')
      setWholesaleAmount('')
      await loadDetail(selectedId, packId)
      showMessages(['Presentación creada con precio'])
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo agregar la presentación',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function removePresentation(id: string) {
    if (!selectedId) return
    clear()
    if (
      !window.confirm(
        '¿Eliminar esta presentación y todos sus precios?',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/packagings/${id}`, {
        method: 'DELETE',
      })
      await loadDetail(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar la presentación',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function savePrice(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId) return
    if (!packagingId) {
      showMessages(['Primero selecciona una presentación'])
      return
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 0) {
      showMessages(['Escribe un precio válido'])
      return
    }
    const min = Number(minQty)
    if (!Number.isFinite(min) || min <= 0) {
      showMessages(['«Desde» debe ser mayor a 0 (usa 1 para el precio base)'])
      return
    }
    const compare = compareAt.trim() === '' ? null : Number(compareAt)
    if (compare != null && (!Number.isFinite(compare) || compare < 0)) {
      showMessages(['El precio tachado no es válido'])
      return
    }
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/prices`, {
        method: 'POST',
        body: JSON.stringify({
          packagingId,
          priceKind,
          minQty: min,
          amount: amt,
          compareAtAmount: compare,
        }),
      })
      await loadDetail(selectedId, packagingId)
      setAmount('')
      setCompareAt('')
      setMinQty('1')
      showMessages(['Precio agregado a esta presentación'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function removePrice(id: string) {
    if (!selectedId) return
    clear()
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/prices/${id}`, {
        method: 'DELETE',
      })
      await loadDetail(selectedId, packagingId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo quitar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  if (selected) {
    return (
      <div className="space-y-5">
        <FloatingToasts toasts={toasts} onDismiss={dismiss} />
        <AdminPageHeader
          title="Listado de precios"
          actions={
            <button
              type="button"
              onClick={() => {
                setSelectedId(null)
                setPackagings([])
                setPrices([])
              }}
              className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
            >
              ← Todos los productos
            </button>
          }
        />

        <div className="rounded-2xl border border-rosver-line bg-white px-4 py-3 shadow-sm sm:px-5">
          <p className="text-base font-bold text-rosver-ink">{selected.name}</p>
          <p className="text-xs text-rosver-muted">
            {selected.sku}
            {selected.brandName ? ` · ${selected.brandName}` : ''}
          </p>
        </div>

        {/* 1 — Crear presentación: tipo + cantidad */}
        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-rosver-ink">
              1. Nueva presentación
            </h2>
            <p className="mt-1 text-xs text-rosver-muted">
              Tipo → cantidad → precio de venta (y mayorista si quieres). Todo
              junto.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-rosver-line bg-rosver-soft/30 p-3 sm:flex-row sm:items-end">
            <AdminField label="¿Falta un tipo? Créalo" htmlFor="pl-new-unit" className="flex-1">
              <AdminInput
                id="pl-new-unit"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Ej. Caja"
              />
            </AdminField>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createUnitTypeInline()}
              className="h-11 rounded-xl border border-rosver-line bg-white px-4 text-sm font-semibold text-rosver-ink hover:border-rosver-red/40 disabled:opacity-60"
            >
              Crear tipo
            </button>
          </div>

          <form
            noValidate
            onSubmit={addPresentation}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AdminField label="Tipo de unidad" htmlFor="pl-unit">
              <AdminSelect
                id="pl-unit"
                value={unitTypeId}
                onChange={(e) => setUnitTypeId(e.target.value)}
              >
                {unitTypes.length === 0 ? (
                  <option value="">Crea un tipo arriba</option>
                ) : (
                  unitTypes.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))
                )}
              </AdminSelect>
            </AdminField>
            <AdminField label="Cantidad" htmlFor="pl-qty">
              <AdminInput
                id="pl-qty"
                inputMode="decimal"
                value={contentQty}
                onChange={(e) => setContentQty(e.target.value)}
                placeholder="1, 12, 24…"
              />
            </AdminField>
            <AdminField label="Nombre (opcional)" htmlFor="pl-label">
              <AdminInput
                id="pl-label"
                value={packLabel}
                onChange={(e) => setPackLabel(e.target.value)}
                placeholder="Ej. Caja x12"
              />
            </AdminField>
            <AdminField label="Precio venta S/" htmlFor="pl-list">
              <AdminInput
                id="pl-list"
                inputMode="decimal"
                value={listAmount}
                onChange={(e) => setListAmount(e.target.value)}
                placeholder="200.00"
              />
            </AdminField>
            <AdminField label="Mayorista S/ (opc.)" htmlFor="pl-wh">
              <AdminInput
                id="pl-wh"
                inputMode="decimal"
                value={wholesaleAmount}
                onChange={(e) => setWholesaleAmount(e.target.value)}
                placeholder="184.00"
              />
            </AdminField>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy || !unitTypeId}
                className="h-11 w-full rounded-xl bg-rosver-red text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                Crear con precio
              </button>
            </div>
          </form>
        </section>

        {/* 2 — Lista de presentaciones (ubicaciones) */}
        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-rosver-ink">
              2. Presentaciones de este producto
            </h2>
            <p className="mt-1 text-xs text-rosver-muted">
              Selecciona una para configurarle varios precios (venta, mayorista,
              oferta…) sobre esa misma cantidad.
            </p>
          </div>

          {packagings.length === 0 ? (
            <p className="rounded-xl border border-rosver-line px-4 py-6 text-center text-sm text-rosver-muted">
              Aún no hay presentaciones. Crea una arriba.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {packagings.map((pk) => {
                const count = prices.filter(
                  (p) => p.isActive && p.packagingId === pk.id,
                ).length
                const active = packagingId === pk.id
                return (
                  <li key={pk.id}>
                    <button
                      type="button"
                      onClick={() => setPackagingId(pk.id)}
                      className={cn(
                        'flex w-full items-start justify-between gap-2 rounded-xl border px-4 py-3 text-left transition',
                        active
                          ? 'border-rosver-red bg-rosver-red/5 ring-1 ring-rosver-red/30'
                          : 'border-rosver-line bg-white hover:border-rosver-red/35',
                      )}
                    >
                      <div>
                        <p className="font-semibold text-rosver-ink">
                          {packagingTitle(pk)}
                          {pk.isDefault ? (
                            <span className="ml-2 text-[10px] font-bold text-rosver-red">
                              Principal
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-rosver-muted">
                          {count === 0
                            ? 'Sin precios aún'
                            : `${count} precio${count === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation()
                          void removePresentation(pk.id)
                        }}
                        className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                      >
                        Eliminar
                      </button>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* 3 — Precios de la presentación seleccionada */}
        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-rosver-ink">
              3. Precios de esta presentación
            </h2>
            {activePack ? (
              <p className="mt-1 text-xs text-rosver-muted">
                Configurando:{' '}
                <span className="font-semibold text-rosver-ink">
                  {packagingTitle(activePack)}
                </span>
                . Puedes agregar varios (venta S/ 200, mayorista S/ 184, oferta…).
                Usa «Desde 1» para el precio de esa presentación.
              </p>
            ) : (
              <p className="mt-1 text-xs text-rosver-muted">
                Selecciona una presentación arriba.
              </p>
            )}
          </div>

          {activePack ? (
            <>
              <form
                noValidate
                onSubmit={savePrice}
                className="grid gap-3 rounded-xl border border-rosver-line bg-rosver-soft/20 p-3 sm:grid-cols-2 lg:grid-cols-5"
              >
                <AdminField label="Tipo de precio" htmlFor="pl-kind">
                  <AdminSelect
                    id="pl-kind"
                    value={priceKind}
                    onChange={(e) =>
                      setPriceKind(
                        e.target.value as 'list' | 'wholesale' | 'offer',
                      )
                    }
                  >
                    <option value="list">Venta</option>
                    <option value="wholesale">Mayorista</option>
                    <option value="offer">Oferta</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Precio (S/)" htmlFor="pl-amt">
                  <AdminInput
                    id="pl-amt"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </AdminField>
                <AdminField label="Tachado (oferta)" htmlFor="pl-cmp">
                  <AdminInput
                    id="pl-cmp"
                    inputMode="decimal"
                    value={compareAt}
                    onChange={(e) => setCompareAt(e.target.value)}
                    placeholder="Opcional"
                  />
                </AdminField>
                <AdminField label="Desde (cantidad)" htmlFor="pl-min">
                  <AdminInput
                    id="pl-min"
                    inputMode="decimal"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                  />
                </AdminField>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-11 w-full rounded-xl bg-rosver-red text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                  >
                    Agregar precio
                  </button>
                </div>
              </form>

              <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
                {pricesForPack.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-rosver-muted">
                    Esta presentación aún no tiene precios. Agrega al menos
                    Venta.
                  </li>
                ) : (
                  pricesForPack.map((pr) => (
                    <li
                      key={pr.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                    >
                      <div>
                        <span className="rounded-full bg-rosver-soft px-2 py-0.5 text-[11px] font-bold text-rosver-ink">
                          {KIND_LABEL[pr.priceKind] ?? pr.priceKind}
                        </span>
                        <span className="ml-2 text-xs text-rosver-muted">
                          desde {pr.minQty}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {pr.compareAtAmount != null &&
                        pr.compareAtAmount > pr.amount ? (
                          <span className="text-xs text-rosver-muted line-through">
                            S/ {pr.compareAtAmount.toFixed(2)}
                          </span>
                        ) : null}
                        <span className="font-bold text-rosver-red">
                          S/ {pr.amount.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removePrice(pr.id)}
                          className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Listado de precios"
        actions={
          <Link
            to="/admin/productos"
            className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
          >
            Productos
          </Link>
        }
      />

      <p className="text-sm text-rosver-muted">
        Abre un producto → crea presentaciones (tipo + cantidad) → en cada una
        configura varios precios.
      </p>

      <AdminInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto, SKU, marca…"
        className="max-w-md"
      />

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : filteredProducts.length === 0 ? (
          <AdminEmptyState
            title="Sin productos"
            detail="Crea un producto primero."
          />
        ) : (
          <ul className="divide-y divide-rosver-line">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => void openProduct(p.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-rosver-soft/50 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-rosver-ink">
                      {p.name}
                    </p>
                    <p className="text-xs text-rosver-muted">
                      {p.sku}
                      {p.brandName ? ` · ${p.brandName}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-rosver-red">
                    Presentaciones y precios →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
