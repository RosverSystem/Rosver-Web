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
  if (qty === 1) return `${base} · 1 unidad`
  return `${base} · ${qty} unidades`
}

/**
 * Listado de precios: crear presentaciones (con N unidades) y precios por opción.
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

  const [packLabel, setPackLabel] = useState('')
  const [unitTypeId, setUnitTypeId] = useState('')
  const [contentQty, setContentQty] = useState('1')
  const [newUnitName, setNewUnitName] = useState('')
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)

  const [packagingId, setPackagingId] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('list')
  const [amount, setAmount] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [minQty, setMinQty] = useState('1')

  const selected = products.find((p) => p.id === selectedId) ?? null

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

  async function loadDetail(id: string) {
    setBusy(true)
    try {
      const data = await api<{
        packagings: Packaging[]
        prices: Price[]
      }>(`/api/admin/products/${id}`)
      setPackagings(data.packagings)
      setPrices(data.prices)
      const def = data.packagings.find((x) => x.isDefault) ?? data.packagings[0]
      setPackagingId((prev) =>
        data.packagings.some((x) => x.id === prev) ? prev : (def?.id ?? ''),
      )
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

  async function saveUnitType(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const name = newUnitName.trim()
    if (!name) {
      showMessages(['Escribe el nombre de la unidad (ej. Caja)'])
      return
    }
    const wasEditing = Boolean(editingUnitId)
    setBusy(true)
    try {
      if (editingUnitId) {
        await api(`/api/admin/unit-types/${editingUnitId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        })
      } else {
        const created = await api<{ unitType: UnitType }>('/api/admin/unit-types', {
          method: 'POST',
          body: JSON.stringify({ name }),
        })
        if (created.unitType?.id) setUnitTypeId(created.unitType.id)
      }
      setNewUnitName('')
      setEditingUnitId(null)
      const list = await loadUnitTypes()
      if (!wasEditing) {
        const match = list.find((u) => u.name.toLowerCase() === name.toLowerCase())
        if (match) setUnitTypeId(match.id)
      }
      showMessages([wasEditing ? 'Unidad actualizada' : 'Unidad creada'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar la unidad',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function deleteUnitType(u: UnitType) {
    clear()
    if (!window.confirm(`¿Eliminar la unidad «${u.name}»?`)) return
    setBusy(true)
    try {
      await api(`/api/admin/unit-types/${u.id}`, { method: 'DELETE' })
      if (editingUnitId === u.id) {
        setEditingUnitId(null)
        setNewUnitName('')
      }
      await loadUnitTypes()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
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
      showMessages(['Elige un tipo de unidad'])
      return
    }
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica cuántas unidades van en esa presentación'])
      return
    }
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/packagings`, {
        method: 'POST',
        body: JSON.stringify({
          unitTypeId,
          contentQty: qty,
          label: packLabel.trim() || undefined,
          isDefault: packagings.length === 0,
        }),
      })
      await loadDetail(selectedId)
      setPackLabel('')
      setContentQty('1')
      showMessages(['Presentación agregada'])
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
        '¿Eliminar esta presentación? También se quitan sus precios.',
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
      showMessages(['Elige una presentación'])
      return
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 0) {
      showMessages(['Escribe un precio válido'])
      return
    }
    const min = Number(minQty)
    if (!Number.isFinite(min) || min <= 0) {
      showMessages(['La cantidad mínima debe ser mayor a 0'])
      return
    }
    const compare =
      compareAt.trim() === '' ? null : Number(compareAt)
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
      await loadDetail(selectedId)
      setAmount('')
      setCompareAt('')
      showMessages(['Precio guardado'])
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
      await loadDetail(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo quitar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  if (selected) {
    const activePrices = prices.filter((p) => p.isActive)
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

        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-rosver-ink">Tipo de unidad rápida</h2>
          <form
            noValidate
            onSubmit={saveUnitType}
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
          >
            <AdminField label="Nueva unidad" htmlFor="pl-unit-quick">
              <AdminInput
                id="pl-unit-quick"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Ej. Blíster"
              />
            </AdminField>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy}
                className="h-11 rounded-xl bg-rosver-ink px-5 text-sm font-semibold text-white hover:bg-rosver-red disabled:opacity-60"
              >
                Crear unidad
              </button>
            </div>
          </form>
        </section>

        {/* Presentaciones */}
        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-rosver-ink">Presentaciones</h2>
          <p className="text-xs text-rosver-muted">
            Cada opción indica de qué unidad es y cuántas unidades incluye (ej.
            Caja con 12).
          </p>
          <form
            noValidate
            onSubmit={addPresentation}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <AdminField label="Nombre (opcional)" htmlFor="pl-label">
              <AdminInput
                id="pl-label"
                value={packLabel}
                onChange={(e) => setPackLabel(e.target.value)}
                placeholder="Ej. Caja, Blíster…"
              />
            </AdminField>
            <AdminField label="Tipo de unidad" htmlFor="pl-unit">
              <AdminSelect
                id="pl-unit"
                value={unitTypeId}
                onChange={(e) => setUnitTypeId(e.target.value)}
              >
                {unitTypes.length === 0 ? (
                  <option value="">Sin unidades — créalas primero</option>
                ) : (
                  unitTypes.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))
                )}
              </AdminSelect>
            </AdminField>
            <AdminField label="Unidades en esta presentación" htmlFor="pl-qty">
              <AdminInput
                id="pl-qty"
                inputMode="decimal"
                value={contentQty}
                onChange={(e) => setContentQty(e.target.value)}
                placeholder="Ej. 12"
              />
            </AdminField>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy || unitTypes.length === 0}
                className="h-11 w-full rounded-xl bg-rosver-ink text-sm font-semibold text-white hover:bg-rosver-red disabled:opacity-60"
              >
                Agregar presentación
              </button>
            </div>
          </form>
          {unitTypes.length === 0 ? (
            <p className="text-xs text-rosver-muted">
              Crea primero un tipo de unidad (arriba).
            </p>
          ) : null}
          <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
            {packagings.length === 0 ? (
              <li className="px-4 py-3 text-sm text-rosver-muted">
                Sin presentaciones. Agrega al menos una (ej. Unidad × 1 o Caja ×
                12).
              </li>
            ) : (
              packagings.map((pk) => (
                <li
                  key={pk.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
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
                      {pk.unitName} · contenido {pk.contentQty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPackagingId(pk.id)}
                      className={cn(
                        'rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                        packagingId === pk.id
                          ? 'bg-rosver-red text-white'
                          : 'border border-rosver-line text-rosver-ink hover:border-rosver-red/40',
                      )}
                    >
                      Usar para precio
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removePresentation(pk.id)}
                      className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Precios */}
        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-rosver-ink">
            Precios por presentación
          </h2>
          <form
            noValidate
            onSubmit={savePrice}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <AdminField label="Presentación" htmlFor="pl-pack">
              <AdminSelect
                id="pl-pack"
                value={packagingId}
                onChange={(e) => setPackagingId(e.target.value)}
              >
                {packagings.length === 0 ? (
                  <option value="">Agrega una presentación</option>
                ) : (
                  packagings.map((pk) => (
                    <option key={pk.id} value={pk.id}>
                      {packagingTitle(pk)}
                    </option>
                  ))
                )}
              </AdminSelect>
            </AdminField>
            <AdminField label="Tipo" htmlFor="pl-kind">
              <AdminSelect
                id="pl-kind"
                value={priceKind}
                onChange={(e) =>
                  setPriceKind(e.target.value as 'list' | 'wholesale' | 'offer')
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
            <AdminField label="Tachado (opcional)" htmlFor="pl-cmp">
              <AdminInput
                id="pl-cmp"
                inputMode="decimal"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                placeholder="Solo ofertas"
              />
            </AdminField>
            <div className="flex items-end gap-2">
              <AdminField label="Desde" htmlFor="pl-min" className="w-24">
                <AdminInput
                  id="pl-min"
                  inputMode="decimal"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                />
              </AdminField>
              <button
                type="submit"
                disabled={busy || packagings.length === 0}
                className="h-11 flex-1 rounded-xl bg-rosver-red text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                Guardar precio
              </button>
            </div>
          </form>
          <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
            {activePrices.length === 0 ? (
              <li className="px-4 py-3 text-sm text-rosver-muted">
                Sin precios activos en este producto
              </li>
            ) : (
              activePrices.map((pr) => {
                const pk = packagings.find((x) => x.id === pr.packagingId)
                return (
                  <li
                    key={pr.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-rosver-ink">
                        {pk ? packagingTitle(pk) : 'Presentación'}
                        <span className="ml-2 rounded-full bg-rosver-soft px-2 py-0.5 text-[11px] font-bold">
                          {KIND_LABEL[pr.priceKind] ?? pr.priceKind}
                        </span>
                      </p>
                      <p className="text-xs text-rosver-muted">
                        Desde {pr.minQty}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-right">
                        {pr.compareAtAmount != null &&
                        pr.compareAtAmount > pr.amount ? (
                          <span className="mr-2 text-xs text-rosver-muted line-through">
                            S/ {pr.compareAtAmount.toFixed(2)}
                          </span>
                        ) : null}
                        <span className="font-bold text-rosver-red">
                          S/ {pr.amount.toFixed(2)}
                        </span>
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
                )
              })
            )}
          </ul>
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

      <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-rosver-ink">Tipos de unidad</h2>
        <p className="text-xs text-rosver-muted">
          Unidad, caja, paquete… luego las usas al armar presentaciones de cada
          producto.
        </p>
        <form
          noValidate
          onSubmit={saveUnitType}
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
        >
          <AdminField
            label={editingUnitId ? 'Editar nombre' : 'Nueva unidad'}
            htmlFor="pl-unit-name"
          >
            <AdminInput
              id="pl-unit-name"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Ej. Caja"
            />
          </AdminField>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {editingUnitId ? 'Guardar' : 'Crear'}
            </button>
            {editingUnitId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingUnitId(null)
                  setNewUnitName('')
                }}
                className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
        <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
          {unitTypes.length === 0 ? (
            <li className="px-4 py-3 text-sm text-rosver-muted">
              Sin tipos aún. Crea Unidad, Caja o Paquete.
            </li>
          ) : (
            unitTypes.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold text-rosver-ink">{u.name}</p>
                  <p className="text-xs text-rosver-muted">
                    {u.code}
                    {u.isBase ? ' · base' : ''}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUnitId(u.id)
                      setNewUnitName(u.name)
                    }}
                    className="text-xs font-semibold text-rosver-red"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteUnitType(u)}
                    className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

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
            detail="Crea un producto primero y luego define sus presentaciones y precios aquí."
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
