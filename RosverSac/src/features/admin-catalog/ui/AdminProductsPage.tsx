import { api, ApiError } from '@/shared/lib/api'
import { cnField } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type ProductRow = {
  id: string
  code: number
  sku: string
  name: string
  brandName: string | null
  categoryName: string | null
  availability: string
  visible: boolean
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

  // create product
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // packaging
  const [unitTypeId, setUnitTypeId] = useState('')
  const [contentQty, setContentQty] = useState('1')

  // price
  const [packagingId, setPackagingId] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('list')
  const [minQty, setMinQty] = useState('1')
  const [amount, setAmount] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [editPriceId, setEditPriceId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
        e instanceof ApiError ? e.message : 'Error cargando listado (¿migración 002?)',
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
      showMessages([e instanceof ApiError ? e.message : 'No se pudo abrir producto'])
    }
  }

  useEffect(() => {
    void loadList()
  }, [])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
  }, [selectedId])

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!name.trim() || !sku.trim()) {
      showMessages(['Nombre y SKU son obligatorios'])
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
        }),
      })
      setName('')
      setSku('')
      await loadList()
      setSelectedId(res.product.id)
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo crear'])
    } finally {
      setBusy(false)
    }
  }

  async function addPackaging(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !unitTypeId) return
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Cantidad de contenido inválida'])
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
      showMessages([err instanceof ApiError ? err.message : 'No se pudo crear empaque'])
    } finally {
      setBusy(false)
    }
  }

  async function savePrice(saveAsNew: boolean) {
    clear()
    if (!selectedId || !packagingId) {
      showMessages(['Selecciona producto y empaque'])
      return
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 0) {
      showMessages(['Monto inválido'])
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
      showMessages([err instanceof ApiError ? err.message : 'No se pudo guardar precio'])
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-rosver-ink">
            Listado de productos / precios
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-rosver-muted">
            Cascada: unidad → contenido (×10, ×100…) → precio por tramo. Edita y guarda, o
            “guardar como nuevo” si no estaba registrado.
          </p>
        </div>
        <Link to="/admin/marcas" className="text-sm font-semibold text-rosver-red">
          Ir a marcas →
        </Link>
      </header>

      <form
        noValidate
        onSubmit={createProduct}
        className="grid gap-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre producto"
          className={cnField(
            'h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm',
            false,
          )}
        />
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU empresa"
          className="h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm uppercase"
        />
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm"
        >
          <option value="">Marca…</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm"
        >
          <option value="">Categoría…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? '↳ ' : ''}
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl bg-rosver-ink px-4 text-sm font-semibold text-white hover:bg-rosver-red disabled:opacity-60"
        >
          Crear producto
        </button>
      </form>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rosver-line bg-rosver-soft/50 text-xs uppercase text-rosver-muted">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Marca</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-rosver-muted">
                    Cargando…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-rosver-muted">
                    Sin productos. Crea marca/categoría y luego un producto.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-b border-rosver-line last:border-0 ${
                      selectedId === p.id ? 'bg-rosver-red/5' : 'hover:bg-rosver-soft/60'
                    }`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td className="px-3 py-2.5 font-semibold">{p.sku}</td>
                    <td className="px-3 py-2.5">{p.name}</td>
                    <td className="px-3 py-2.5 text-rosver-muted">{p.brandName ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm">
          {!selectedId ? (
            <p className="text-sm text-rosver-muted">Selecciona un producto para precios.</p>
          ) : (
            <>
              <h3 className="text-sm font-bold tracking-wide text-rosver-ink uppercase">
                Empaques (unidad → contenido)
              </h3>
              <ul className="space-y-1 text-sm">
                {packagings.map((pk) => (
                  <li key={pk.id} className="flex justify-between gap-2 rounded-lg bg-rosver-soft/50 px-3 py-2">
                    <span>
                      {pk.label || `${pk.unitName} ×${pk.contentQty}`}
                      {pk.isDefault ? (
                        <span className="ml-2 text-[10px] font-bold text-rosver-red">DEFAULT</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rosver-red"
                      onClick={() => setPackagingId(pk.id)}
                    >
                      Usar
                    </button>
                  </li>
                ))}
              </ul>
              <form noValidate onSubmit={addPackaging} className="flex flex-wrap gap-2">
                <select
                  value={unitTypeId}
                  onChange={(e) => setUnitTypeId(e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-rosver-line px-2 text-sm"
                >
                  {unitTypes.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <input
                  value={contentQty}
                  onChange={(e) => setContentQty(e.target.value)}
                  placeholder="Contenido (10, 100…)"
                  className="h-10 w-28 rounded-xl border border-rosver-line px-2 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-xl border border-rosver-red px-3 text-sm font-semibold text-rosver-red"
                >
                  + Empaque
                </button>
              </form>

              <h3 className="pt-2 text-sm font-bold tracking-wide text-rosver-ink uppercase">
                Precios del empaque
              </h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {prices
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => pickPrice(p)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-rosver-soft"
                      >
                        <span>
                          {p.priceKind} · min {p.minQty} → S/ {p.amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-rosver-muted">editar</span>
                      </button>
                    </li>
                  ))}
              </ul>

              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={packagingId}
                  onChange={(e) => setPackagingId(e.target.value)}
                  className="h-10 rounded-xl border border-rosver-line px-2 text-sm sm:col-span-2"
                >
                  <option value="">Empaque…</option>
                  {packagings.map((pk) => (
                    <option key={pk.id} value={pk.id}>
                      {pk.label || `${pk.unitName} ×${pk.contentQty}`}
                    </option>
                  ))}
                </select>
                <select
                  value={priceKind}
                  onChange={(e) =>
                    setPriceKind(e.target.value as 'list' | 'wholesale' | 'offer')
                  }
                  className="h-10 rounded-xl border border-rosver-line px-2 text-sm"
                >
                  <option value="list">Lista</option>
                  <option value="wholesale">Mayorista</option>
                  <option value="offer">Oferta</option>
                </select>
                <input
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="Cant. mínima"
                  className="h-10 rounded-xl border border-rosver-line px-2 text-sm"
                />
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Precio S/"
                  className="h-10 rounded-xl border border-rosver-line px-2 text-sm"
                />
                <input
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  placeholder="Antes (tachado)"
                  className="h-10 rounded-xl border border-rosver-line px-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void savePrice(false)}
                  className="h-10 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                >
                  {editPriceId ? 'Modificar' : 'Guardar precio'}
                </button>
                <button
                  type="button"
                  disabled={busy || !editPriceId}
                  onClick={() => void savePrice(true)}
                  className="h-10 rounded-xl border border-rosver-ink px-4 text-sm font-semibold text-rosver-ink disabled:opacity-40"
                >
                  Guardar como nuevo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
