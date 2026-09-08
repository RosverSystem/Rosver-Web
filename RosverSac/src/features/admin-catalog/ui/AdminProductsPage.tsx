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
  code: number
  sku: string
  name: string
  brandName: string | null
  categoryName: string | null
  availability: string
  visible: boolean
  featured: boolean
  featuredSort: number
}

type Brand = { id: string; name: string; sku: string }
type Category = { id: string; name: string; parentId: string | null }
type UnitType = { id: string; name: string; code: string }
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

const PRICE_KIND_LABEL: Record<string, string> = {
  list: 'Precio de venta',
  wholesale: 'Precio mayorista',
  offer: 'Precio en oferta',
  custom: 'Otro precio',
}

export function AdminProductsPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [listQuery, setListQuery] = useState('')

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [createFeatured, setCreateFeatured] = useState(false)
  const [featuredBusy, setFeaturedBusy] = useState(false)
  const [featuredSortDraft, setFeaturedSortDraft] = useState('0')

  const [unitTypeId, setUnitTypeId] = useState('')
  const [contentQty, setContentQty] = useState('1')

  const [packagingId, setPackagingId] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('list')
  const [minQty, setMinQty] = useState('1')
  const [amount, setAmount] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [editPriceId, setEditPriceId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selected = products.find((p) => p.id === selectedId) ?? null

  const filteredProducts = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false),
    )
  }, [products, listQuery])

  async function loadList() {
    setLoading(true)
    try {
      const [p, b, c, u] = await Promise.all([
        api<{ products: ProductRow[] }>('/api/admin/products'),
        api<{ brands: Brand[] }>('/api/admin/brands'),
        api<{ categories: Category[] }>('/api/admin/categories'),
        api<{ unitTypes: UnitType[] }>('/api/admin/unit-types'),
      ])
      setProducts(p.products)
      setBrands(b.brands)
      setCategories(c.categories)
      setUnitTypes(u.unitTypes)
      if (!unitTypeId && u.unitTypes[0]) setUnitTypeId(u.unitTypes[0].id)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo cargar el listado',
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(id: string) {
    try {
      const data = await api<{
        packagings: Packaging[]
        prices: Price[]
      }>(`/api/admin/products/${id}`)
      setPackagings(data.packagings)
      setPrices(data.prices)
      const def = data.packagings.find((x) => x.isDefault) ?? data.packagings[0]
      if (def) setPackagingId(def.id)
    } catch (e) {
      showMessages([e instanceof ApiError ? e.message : 'No se pudo abrir el producto'])
    }
  }

  useEffect(() => {
    void loadList()
  }, [])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
  }, [selectedId])

  useEffect(() => {
    if (!selected) return
    setFeaturedSortDraft(String(selected.featuredSort ?? 0))
  }, [selected?.id, selected?.featuredSort])

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!name.trim() || !sku.trim()) {
      showMessages(['Completa el nombre y el código del producto'])
      return
    }
    setBusy(true)
    try {
      const res = await api<{ product: { id: string } }>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          brandId: brandId || null,
          categoryId: categoryId || null,
          featured: createFeatured,
          featuredSort: createFeatured ? Number(featuredSortDraft) || 0 : 0,
        }),
      })
      setName('')
      setSku('')
      setCreateFeatured(false)
      await loadList()
      setSelectedId(res.product.id)
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo crear'])
    } finally {
      setBusy(false)
    }
  }

  async function saveFeatured(next: { featured?: boolean; featuredSort?: number }) {
    if (!selectedId) return
    setFeaturedBusy(true)
    clear()
    try {
      await api(`/api/admin/products/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(next),
      })
      await loadList()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo actualizar el destacado',
      ])
    } finally {
      setFeaturedBusy(false)
    }
  }

  async function addPackaging(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !unitTypeId) return
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica cuántas unidades van en esa presentación'])
      return
    }
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/packagings`, {
        method: 'POST',
        body: JSON.stringify({ unitTypeId, contentQty: qty }),
      })
      await loadDetail(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo agregar la presentación',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function savePrice(saveAsNew: boolean) {
    clear()
    if (!selectedId || !packagingId) {
      showMessages(['Elige un producto y una presentación'])
      return
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 0) {
      showMessages(['El precio no es válido'])
      return
    }
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/prices`, {
        method: 'POST',
        body: JSON.stringify({
          id: editPriceId || undefined,
          packagingId,
          priceKind,
          minQty: Number(minQty) || 1,
          amount: amt,
          compareAtAmount: compareAt ? Number(compareAt) : null,
          saveAsNew: saveAsNew || !editPriceId,
        }),
      })
      setAmount('')
      setCompareAt('')
      setEditPriceId(null)
      await loadDetail(selectedId)
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo guardar el precio'])
    } finally {
      setBusy(false)
    }
  }

  function pickPrice(p: Price) {
    setEditPriceId(p.id)
    setPackagingId(p.packagingId)
    setPriceKind(p.priceKind as 'list' | 'wholesale' | 'offer')
    setMinQty(String(p.minQty))
    setAmount(String(p.amount))
    setCompareAt(p.compareAtAmount != null ? String(p.compareAtAmount) : '')
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Productos"
        actions={
          <Link
            to="/admin/marcas"
            className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
          >
            Ver marcas
          </Link>
        }
      />

      <form
        noValidate
        onSubmit={createProduct}
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="mb-4 text-sm font-semibold text-rosver-ink">Nuevo producto</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AdminField label="Nombre" htmlFor="prod-name" className="lg:col-span-2">
            <AdminInput
              id="prod-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Taladro 20V"
            />
          </AdminField>
          <AdminField label="Código producto" htmlFor="prod-sku">
            <AdminInput
              id="prod-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU"
              className="uppercase"
            />
          </AdminField>
          <AdminField label="Marca" htmlFor="prod-brand">
            <AdminSelect
              id="prod-brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">Sin marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Categoría" htmlFor="prod-cat">
            <AdminSelect
              id="prod-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Elegir categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `Dentro de menú · ${c.name}` : c.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-rosver-ink">
            <input
              type="checkbox"
              checked={createFeatured}
              onChange={(e) => setCreateFeatured(e.target.checked)}
              className="size-4 rounded border-rosver-line text-rosver-red"
            />
            Destacado en el inicio
          </label>
          {createFeatured ? (
            <AdminField label="Orden en el carrusel" htmlFor="prod-feat-sort">
              <AdminInput
                id="prod-feat-sort"
                value={featuredSortDraft}
                onChange={(e) => setFeaturedSortDraft(e.target.value)}
                placeholder="0"
                className="w-24"
              />
            </AdminField>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-rosver-ink px-5 text-sm font-semibold text-white hover:bg-rosver-red disabled:opacity-60"
          >
            {busy ? 'Creando…' : 'Crear producto'}
          </button>
        </div>
      </form>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
          <div className="border-b border-rosver-line p-3">
            <AdminInput
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Buscar en el listado…"
            />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <AdminEmptyState title="Cargando…" />
            ) : filteredProducts.length === 0 ? (
              <AdminEmptyState
                title="No hay productos"
                detail="Crea una marca y una categoría, luego agrega tu primer producto."
              />
            ) : (
              <ul className="divide-y divide-rosver-line">
                {filteredProducts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition',
                        selectedId === p.id
                          ? 'bg-rosver-red/8 ring-inset ring-1 ring-rosver-red/20'
                          : 'hover:bg-rosver-soft/70',
                      )}
                    >
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-rosver-soft text-xs font-bold text-rosver-ink">
                        {p.sku.slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-rosver-ink">
                          {p.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-rosver-muted">
                          {p.sku}
                          {p.brandName ? ` · ${p.brandName}` : ''}
                          {p.categoryName ? ` · ${p.categoryName}` : ''}
                        </span>
                      </span>
                      {p.featured ? (
                        <span className="shrink-0 rounded-full bg-rosver-yellow px-2 py-0.5 text-[10px] font-bold text-rosver-ink">
                          Inicio
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          {!selected ? (
            <AdminEmptyState
              title="Elige un producto"
              detail="Selecciona uno a la izquierda para ver presentaciones y precios."
            />
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-rosver-ink">{selected.name}</h3>
                <p className="text-sm text-rosver-muted">{selected.sku}</p>
              </div>

              <div className="rounded-xl border border-rosver-line bg-rosver-soft/40 p-3">
                <p className="mb-2 text-sm font-semibold text-rosver-ink">
                  Destacados para ti (inicio)
                </p>
                <label className="flex items-center gap-2 text-sm text-rosver-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.featured)}
                    disabled={featuredBusy}
                    onChange={(e) =>
                      void saveFeatured({ featured: e.target.checked })
                    }
                    className="size-4 rounded border-rosver-line text-rosver-red"
                  />
                  Mostrar en el carrusel del inicio
                </label>
                {selected.featured ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <AdminField label="Orden" htmlFor="feat-sort-edit">
                      <AdminInput
                        id="feat-sort-edit"
                        value={featuredSortDraft}
                        onChange={(e) => setFeaturedSortDraft(e.target.value)}
                        className="w-24"
                      />
                    </AdminField>
                    <button
                      type="button"
                      disabled={featuredBusy}
                      onClick={() =>
                        void saveFeatured({
                          featuredSort: Number(featuredSortDraft) || 0,
                        })
                      }
                      className="h-11 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                    >
                      Guardar orden
                    </button>
                  </div>
                ) : null}
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-rosver-ink">
                  Presentaciones de venta
                </h4>
                <div className="mb-3 flex flex-wrap gap-2">
                  {packagings.map((pk) => (
                    <button
                      key={pk.id}
                      type="button"
                      onClick={() => setPackagingId(pk.id)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
                        packagingId === pk.id
                          ? 'bg-rosver-red text-white ring-rosver-red'
                          : 'bg-rosver-soft text-rosver-ink ring-transparent hover:ring-rosver-line',
                      )}
                    >
                      {pk.label || `${pk.unitName} de ${pk.contentQty}`}
                      {pk.isDefault ? ' · habitual' : ''}
                    </button>
                  ))}
                </div>
                <form
                  noValidate
                  onSubmit={addPackaging}
                  className="grid gap-3 rounded-xl bg-rosver-soft/50 p-3 sm:grid-cols-[1fr_7rem_auto]"
                >
                  <AdminField label="Tipo" htmlFor="pk-unit">
                    <AdminSelect
                      id="pk-unit"
                      value={unitTypeId}
                      onChange={(e) => setUnitTypeId(e.target.value)}
                    >
                      {unitTypes.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Cantidad" htmlFor="pk-qty">
                    <AdminInput
                      id="pk-qty"
                      value={contentQty}
                      onChange={(e) => setContentQty(e.target.value)}
                      inputMode="decimal"
                    />
                  </AdminField>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="h-11 w-full rounded-xl border border-rosver-red px-3 text-sm font-semibold text-rosver-red hover:bg-rosver-red hover:text-white"
                    >
                      Agregar
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-rosver-ink">Precios</h4>
                <ul className="mb-3 max-h-36 space-y-1 overflow-y-auto">
                  {prices.filter((p) => p.isActive).length === 0 ? (
                    <li className="rounded-xl bg-rosver-soft/60 px-3 py-2 text-sm text-rosver-muted">
                      Aún no hay precios. Completa el formulario de abajo.
                    </li>
                  ) : (
                    prices
                      .filter((p) => p.isActive)
                      .map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => pickPrice(p)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-rosver-soft"
                          >
                            <span>
                              <span className="font-medium text-rosver-ink">
                                {PRICE_KIND_LABEL[p.priceKind] ?? p.priceKind}
                              </span>
                              <span className="text-rosver-muted">
                                {' '}
                                · desde {p.minQty} · S/ {p.amount.toFixed(2)}
                              </span>
                            </span>
                            <span className="text-xs font-semibold text-rosver-red">
                              Editar
                            </span>
                          </button>
                        </li>
                      ))
                  )}
                </ul>

                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminField label="Presentación" htmlFor="pr-pack" className="sm:col-span-2">
                    <AdminSelect
                      id="pr-pack"
                      value={packagingId}
                      onChange={(e) => setPackagingId(e.target.value)}
                    >
                      <option value="">Elegir presentación</option>
                      {packagings.map((pk) => (
                        <option key={pk.id} value={pk.id}>
                          {pk.label || `${pk.unitName} de ${pk.contentQty}`}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Tipo de precio" htmlFor="pr-kind">
                    <AdminSelect
                      id="pr-kind"
                      value={priceKind}
                      onChange={(e) =>
                        setPriceKind(e.target.value as 'list' | 'wholesale' | 'offer')
                      }
                    >
                      <option value="list">Precio de venta</option>
                      <option value="wholesale">Precio mayorista</option>
                      <option value="offer">Precio en oferta</option>
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Cantidad mínima" htmlFor="pr-min">
                    <AdminInput
                      id="pr-min"
                      value={minQty}
                      onChange={(e) => setMinQty(e.target.value)}
                      inputMode="decimal"
                    />
                  </AdminField>
                  <AdminField label="Precio (S/)" htmlFor="pr-amt">
                    <AdminInput
                      id="pr-amt"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="decimal"
                    />
                  </AdminField>
                  <AdminField label="Precio anterior (opcional)" htmlFor="pr-cmp">
                    <AdminInput
                      id="pr-cmp"
                      value={compareAt}
                      onChange={(e) => setCompareAt(e.target.value)}
                      inputMode="decimal"
                      placeholder="Para mostrar tachado"
                    />
                  </AdminField>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePrice(false)}
                    className="h-11 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                  >
                    {editPriceId ? 'Guardar cambios' : 'Guardar precio'}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !editPriceId}
                    onClick={() => void savePrice(true)}
                    className="h-11 rounded-xl border border-rosver-ink px-4 text-sm font-semibold text-rosver-ink disabled:opacity-40"
                  >
                    Guardar como precio nuevo
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
