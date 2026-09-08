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
import { AdminImageUpload } from '@/shared/ui/admin-image-upload'
import { useEffect, useMemo, useState } from 'react'

type ProductRow = {
  id: string
  code: number
  sku: string
  name: string
  brandId?: string | null
  categoryId?: string | null
  brandName: string | null
  categoryName: string | null
  availability: string
  visible: boolean
  featured: boolean
  featuredSort: number
  trending: boolean
  trendingSort: number
  rating: number
  reviewCount: number
  imageUrl?: string | null
  description?: string
  origin?: string
  moq?: number
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
type SpecAttr = {
  id: string
  key: string
  name: string
  unitHint?: string | null
}
type SpecRow = {
  /** id temporal local o attributeId */
  key: string
  attributeId: string | null
  typeName: string
  value: string
  unit: string
}

const STEPS = [
  { id: 1, label: 'Datos' },
  { id: 2, label: 'Detalle' },
  { id: 3, label: 'Precios' },
  { id: 4, label: 'Especs' },
] as const

const PRICE_KIND_LABEL: Record<string, string> = {
  list: 'Venta',
  wholesale: 'Mayorista',
  offer: 'Oferta',
  custom: 'Otro',
}

/**
 * Alta/edición de productos por fases (estilo Odoo).
 * Specs: el usuario define tipo + valor. Calificaciones: solo lectura (clientes).
 */
export function AdminProductsPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [specAttrs, setSpecAttrs] = useState<SpecAttr[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'list' | 'wizard'>('list')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [listQuery, setListQuery] = useState('')

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [origin, setOrigin] = useState('')
  const [moq, setMoq] = useState('1')
  const [availability, setAvailability] = useState('in_stock')
  const [featured, setFeatured] = useState(false)
  const [featuredSort, setFeaturedSort] = useState('0')
  const [trending, setTrending] = useState(false)
  const [trendingSort, setTrendingSort] = useState('0')

  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [unitTypeId, setUnitTypeId] = useState('')
  const [contentQty, setContentQty] = useState('1')
  const [packagingId, setPackagingId] = useState('')
  const [listAmount, setListAmount] = useState('')
  const [wholesaleAmount, setWholesaleAmount] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('list')
  const [minQty, setMinQty] = useState('1')
  const [amount, setAmount] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)

  const [specRows, setSpecRows] = useState<SpecRow[]>([])
  const [rating, setRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

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
      const [p, b, c, u, a] = await Promise.all([
        api<{ products: ProductRow[] }>('/api/admin/products'),
        api<{ brands: Brand[] }>('/api/admin/brands'),
        api<{ categories: Category[] }>('/api/admin/categories'),
        api<{ unitTypes: UnitType[] }>('/api/admin/unit-types'),
        api<{ attributes: SpecAttr[] }>('/api/admin/spec-attributes'),
      ])
      setProducts(p.products)
      setBrands(b.brands)
      setCategories(c.categories)
      setUnitTypes(u.unitTypes)
      setSpecAttrs(a.attributes)
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
        product?: ProductRow
        specs?: {
          attributeId: string
          key: string
          name: string
          unitHint?: string | null
          valueText: string | null
          valueNumber: number | null
          unit: string | null
        }[]
      }>(`/api/admin/products/${id}`)
      setPackagings(data.packagings)
      setPrices(data.prices)
      const def = data.packagings.find((x) => x.isDefault) ?? data.packagings[0]
      if (def) setPackagingId(def.id)
      const p = data.product
      if (p) {
        setName(p.name)
        setSku(p.sku)
        setBrandId(p.brandId ?? '')
        setCategoryId(p.categoryId ?? '')
        setDescription(p.description ?? '')
        setImageUrl(p.imageUrl ?? '')
        setOrigin(p.origin ?? '')
        setMoq(String(p.moq ?? 1))
        setAvailability(p.availability || 'in_stock')
        setFeatured(Boolean(p.featured))
        setFeaturedSort(String(p.featuredSort ?? 0))
        setTrending(Boolean(p.trending))
        setTrendingSort(String(p.trendingSort ?? 0))
        setRating(Number(p.rating ?? 0))
        setReviewCount(Number(p.reviewCount ?? 0))
      }
      // Solo specs que YA tienen valor (no listar tipos vacíos por defecto)
      const loaded: SpecRow[] = []
      for (const s of data.specs ?? []) {
        const value =
          s.valueText?.trim() ||
          (s.valueNumber != null ? String(s.valueNumber) : '')
        if (!value) continue
        loaded.push({
          key: s.attributeId,
          attributeId: s.attributeId,
          typeName: s.name,
          value,
          unit: s.unit ?? s.unitHint ?? '',
        })
      }
      setSpecRows(loaded)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo abrir el producto',
      ])
    }
  }

  useEffect(() => {
    void loadList()
  }, [])

  function resetWizard() {
    setSelectedId(null)
    setStep(1)
    setName('')
    setSku('')
    setBrandId('')
    setCategoryId('')
    setDescription('')
    setImageUrl('')
    setOrigin('')
    setMoq('1')
    setAvailability('in_stock')
    setFeatured(false)
    setFeaturedSort('0')
    setTrending(false)
    setTrendingSort('0')
    setPackagings([])
    setPrices([])
    setSpecRows([])
    setRating(0)
    setReviewCount(0)
    setAmount('')
    setCompareAt('')
  }

  function startCreate() {
    resetWizard()
    setMode('wizard')
    setStep(1)
  }

  async function startEdit(id: string) {
    setMode('wizard')
    setStep(1)
    setSelectedId(id)
    await loadDetail(id)
  }

  async function saveStep1() {
    clear()
    if (!name.trim() || !sku.trim()) {
      showMessages(['Completa nombre y código del producto'])
      return false
    }
    setBusy(true)
    try {
      if (selectedId) {
        await api(`/api/admin/products/${selectedId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            sku: sku.trim(),
            brandId: brandId || null,
            categoryId: categoryId || null,
            description,
            imageUrl: imageUrl.trim() || null,
          }),
        })
      } else {
        const res = await api<{ product: { id: string } }>('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            sku: sku.trim(),
            brandId: brandId || null,
            categoryId: categoryId || null,
            description,
            imageUrl: imageUrl.trim() || undefined,
            featured,
            featuredSort: featured ? Number(featuredSort) || 0 : 0,
          }),
        })
        setSelectedId(res.product.id)
        await loadDetail(res.product.id)
      }
      await loadList()
      return true
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar',
      ])
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveStep2() {
    if (!selectedId) {
      showMessages(['Primero guarda los datos del producto'])
      return false
    }
    setBusy(true)
    clear()
    try {
      await api(`/api/admin/products/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          origin,
          moq: Number(moq) || 1,
          availability,
          featured,
          featuredSort: Number(featuredSort) || 0,
          trending,
          trendingSort: Number(trendingSort) || 0,
        }),
      })
      await loadList()
      return true
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar el detalle',
      ])
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveStep4() {
    if (!selectedId) return false
    setBusy(true)
    clear()
    try {
      const payload: {
        attributeId: string
        valueText?: string
        valueNumber?: number
        unit?: string
      }[] = []

      for (const row of specRows) {
        const value = row.value.trim()
        if (!value || !row.typeName.trim()) continue

        let attributeId = row.attributeId
        if (!attributeId) {
          const existing = specAttrs.find(
            (a) => a.name.toLowerCase() === row.typeName.trim().toLowerCase(),
          )
          if (existing) {
            attributeId = existing.id
          } else {
            const created = await api<{ attribute: SpecAttr }>(
              '/api/admin/spec-attributes',
              {
                method: 'POST',
                body: JSON.stringify({
                  name: row.typeName.trim(),
                  unitHint: row.unit.trim() || null,
                }),
              },
            )
            attributeId = created.attribute.id
            setSpecAttrs((prev) => [...prev, created.attribute])
          }
        }

        const asNum = Number(value.replace(',', '.'))
        if (Number.isFinite(asNum) && /^[\d.,]+$/.test(value)) {
          payload.push({
            attributeId,
            valueNumber: asNum,
            unit: row.unit.trim() || undefined,
          })
        } else {
          payload.push({
            attributeId,
            valueText: value,
            unit: row.unit.trim() || undefined,
          })
        }
      }

      await api(`/api/admin/products/${selectedId}/specs`, {
        method: 'PUT',
        body: JSON.stringify({ specs: payload }),
      })
      showMessages(['Especificaciones guardadas'])
      return true
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudieron guardar las especs',
      ])
      return false
    } finally {
      setBusy(false)
    }
  }

  async function goNext() {
    if (step === 1) {
      const ok = await saveStep1()
      if (ok) setStep(2)
      return
    }
    if (step === 2) {
      const ok = await saveStep2()
      if (ok) setStep(3)
      return
    }
    if (step === 3) {
      setStep(4)
      return
    }
    if (step === 4) {
      const ok = await saveStep4()
      if (ok) {
        setMode('list')
        resetWizard()
        await loadList()
      }
    }
  }

  async function addPackagingWithPrice(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId || !unitTypeId) {
      showMessages(['Elige un tipo de unidad'])
      return
    }
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica la cantidad de esa presentación'])
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
      const created = await api<{ packaging: { id: string } }>(
        `/api/admin/products/${selectedId}/packagings`,
        {
          method: 'POST',
          body: JSON.stringify({
            unitTypeId,
            contentQty: qty,
            isDefault: packagings.length === 0,
          }),
        },
      )
      const packId = created.packaging.id
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
      setContentQty('1')
      setListAmount('')
      setWholesaleAmount('')
      setPackagingId(packId)
      await loadDetail(selectedId)
      showMessages(['Presentación agregada con precio'])
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

  async function saveExtraPrice(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId || !packagingId) {
      showMessages(['Selecciona una presentación en la lista'])
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
          id: editingPriceId ?? undefined,
          packagingId,
          priceKind,
          minQty: Number(minQty) || 1,
          amount: amt,
          compareAtAmount: compareAt ? Number(compareAt) : null,
          saveAsNew: false,
        }),
      })
      setAmount('')
      setCompareAt('')
      setMinQty('1')
      setEditingPriceId(null)
      await loadDetail(selectedId)
      showMessages([editingPriceId ? 'Precio actualizado' : 'Precio agregado'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  function startEditPrice(p: Price) {
    setPackagingId(p.packagingId)
    setEditingPriceId(p.id)
    setPriceKind(p.priceKind as 'list' | 'wholesale' | 'offer')
    setAmount(String(p.amount))
    setMinQty(String(p.minQty))
    setCompareAt(
      p.compareAtAmount != null ? String(p.compareAtAmount) : '',
    )
  }

  async function removePrice(id: string) {
    if (!selectedId) return
    clear()
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/prices/${id}`, {
        method: 'DELETE',
      })
      setEditingPriceId(null)
      await loadDetail(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo quitar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function removePackaging(id: string) {
    if (!selectedId) return
    if (!window.confirm('¿Eliminar esta presentación y sus precios?')) return
    clear()
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

  async function softDelete(id: string, productName: string) {
    if (!window.confirm(`¿Ocultar el producto «${productName}»?`)) return
    try {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (selectedId === id) {
        setMode('list')
        resetWizard()
      }
      await loadList()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  if (mode === 'wizard') {
    return (
      <div className="space-y-5">
        <FloatingToasts toasts={toasts} onDismiss={dismiss} />
        <AdminPageHeader
          title={selectedId ? 'Editar producto' : 'Nuevo producto'}
          actions={
            <button
              type="button"
              onClick={() => {
                setMode('list')
                resetWizard()
              }}
              className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-muted hover:text-rosver-red"
            >
              Volver al listado
            </button>
          }
        />

        {/* Stepper */}
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s) => {
            const active = step === s.id
            const done = step > s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!selectedId && s.id > 1}
                  onClick={() => {
                    if (selectedId || s.id === 1) setStep(s.id)
                  }}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-bold transition sm:px-4 sm:text-sm',
                    active && 'bg-rosver-red text-white',
                    done && !active && 'bg-rosver-ink text-white',
                    !active &&
                      !done &&
                      'bg-white text-rosver-muted ring-1 ring-rosver-line',
                    !selectedId && s.id > 1 && 'opacity-40',
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-[10px]">
                    {s.id}
                  </span>
                  {s.label}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-rosver-ink">
                Fase 1 — Datos principales
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Nombre" htmlFor="w-name">
                  <AdminInput
                    id="w-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Taladro 20V"
                  />
                </AdminField>
                <AdminField label="Código producto" htmlFor="w-sku">
                  <AdminInput
                    id="w-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU"
                    className="uppercase"
                  />
                </AdminField>
                <AdminField label="Marca" htmlFor="w-brand">
                  <AdminSelect
                    id="w-brand"
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
                <AdminField label="Categoría" htmlFor="w-cat">
                  <AdminSelect
                    id="w-cat"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Elegir categoría</option>
                    {categories.map((c) => {
                      const parent = c.parentId
                        ? categories.find((x) => x.id === c.parentId)
                        : null
                      const label = parent
                        ? `Dentro de ${parent.name}: ${c.name}`
                        : c.name
                      return (
                        <option key={c.id} value={c.id}>
                          {label}
                        </option>
                      )
                    })}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Descripción" htmlFor="w-desc" className="sm:col-span-2">
                  <textarea
                    id="w-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-rosver-line bg-white px-3 py-2 text-sm outline-none focus:border-rosver-red/40"
                  />
                </AdminField>
              </div>
              <AdminImageUpload
                folder="products"
                value={imageUrl}
                onChange={setImageUrl}
                onError={(msg) => showMessages([msg])}
                label="Foto del producto"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-rosver-ink">
                Fase 2 — Detalle comercial
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Origen" htmlFor="w-origin">
                  <AdminInput
                    id="w-origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Ej. China"
                  />
                </AdminField>
                <AdminField label="MOQ (pedido mínimo)" htmlFor="w-moq">
                  <AdminInput
                    id="w-moq"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                  />
                </AdminField>
                <AdminField label="Disponibilidad" htmlFor="w-avail">
                  <AdminSelect
                    id="w-avail"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  >
                    <option value="in_stock">En stock</option>
                    <option value="quote_only">Solo cotización</option>
                    <option value="out_of_stock">Sin stock</option>
                  </AdminSelect>
                </AdminField>
              </div>
              <div className="space-y-3 rounded-xl border border-rosver-line bg-rosver-soft/40 p-3">
                <label className="flex items-center gap-2 text-sm text-rosver-ink">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="size-4 rounded border-rosver-line text-rosver-red"
                  />
                  Destacado en el inicio
                </label>
                {featured ? (
                  <AdminField label="Orden en carrusel" htmlFor="w-fs">
                    <AdminInput
                      id="w-fs"
                      value={featuredSort}
                      onChange={(e) => setFeaturedSort(e.target.value)}
                      className="w-28"
                    />
                  </AdminField>
                ) : null}
                <label className="flex items-center gap-2 text-sm text-rosver-ink">
                  <input
                    type="checkbox"
                    checked={trending}
                    onChange={(e) => setTrending(e.target.checked)}
                    className="size-4 rounded border-rosver-line text-rosver-red"
                  />
                  Producto en tendencia
                </label>
                {trending ? (
                  <AdminField label="Orden tendencia" htmlFor="w-ts">
                    <AdminInput
                      id="w-ts"
                      value={trendingSort}
                      onChange={(e) => setTrendingSort(e.target.value)}
                      className="w-28"
                    />
                  </AdminField>
                ) : null}
              </div>
              <div className="rounded-xl border border-dashed border-rosver-line bg-rosver-soft/30 px-4 py-3 text-sm text-rosver-muted">
                Calificación:{' '}
                <span className="font-semibold text-rosver-ink">
                  {rating.toFixed(1)} · {reviewCount} reseñas
                </span>
                <span className="mt-1 block text-xs">
                  La pone el cliente desde su cuenta. Aquí solo se muestra el promedio.
                </span>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-rosver-ink">
                  Fase 3 — Presentaciones y precios
                </p>
                <p className="mt-1 text-xs text-rosver-muted">
                  Tipo de unidad → cantidad → precio. Todo en un solo paso.
                </p>
              </div>
              <form
                noValidate
                onSubmit={addPackagingWithPrice}
                className="grid gap-3 rounded-xl border border-rosver-line p-3 sm:grid-cols-2 lg:grid-cols-5"
              >
                <AdminField label="Tipo de unidad" htmlFor="w-unit">
                  <AdminSelect
                    id="w-unit"
                    value={unitTypeId}
                    onChange={(e) => setUnitTypeId(e.target.value)}
                  >
                    {unitTypes.length === 0 ? (
                      <option value="">Sin tipos</option>
                    ) : (
                      unitTypes.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))
                    )}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Unidades por presentación" htmlFor="w-qty">
                  <AdminInput
                    id="w-qty"
                    value={contentQty}
                    onChange={(e) => setContentQty(e.target.value)}
                    placeholder="1, 12…"
                  />
                </AdminField>
                <AdminField label="Precio de venta (S/)" htmlFor="w-list">
                  <AdminInput
                    id="w-list"
                    inputMode="decimal"
                    value={listAmount}
                    onChange={(e) => setListAmount(e.target.value)}
                    placeholder="200.00"
                  />
                </AdminField>
                <AdminField label="Precio mayorista (S/)" htmlFor="w-wh">
                  <AdminInput
                    id="w-wh"
                    inputMode="decimal"
                    value={wholesaleAmount}
                    onChange={(e) => setWholesaleAmount(e.target.value)}
                    placeholder="Opcional"
                  />
                </AdminField>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={busy || !unitTypeId}
                    className="h-11 w-full rounded-xl bg-rosver-red text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
              </form>

              <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
                {packagings.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-rosver-muted">
                    Sin presentaciones aún
                  </li>
                ) : (
                  packagings.map((pk) => {
                    const pkPrices = prices.filter(
                      (p) => p.isActive && p.packagingId === pk.id,
                    )
                    return (
                      <li key={pk.id} className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPackagingId(pk.id)}
                            className={cn(
                              'text-left font-semibold',
                              packagingId === pk.id
                                ? 'text-rosver-red'
                                : 'text-rosver-ink',
                            )}
                          >
                            {pk.label || `${pk.unitName} × ${pk.contentQty}`}
                            {pk.isDefault ? (
                              <span className="ml-2 text-[10px] font-bold text-rosver-red">
                                Principal
                              </span>
                            ) : null}
                          </button>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setPackagingId(pk.id)}
                              className="text-xs font-semibold text-rosver-red"
                            >
                              Precios
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void removePackaging(pk.id)}
                              className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        {pkPrices.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {pkPrices.map((p) => (
                              <li
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs text-rosver-muted"
                              >
                                <span>
                                  {PRICE_KIND_LABEL[p.priceKind] ?? p.priceKind}
                                  <span className="ml-2 font-bold text-rosver-red">
                                    S/ {p.amount.toFixed(2)}
                                  </span>
                                </span>
                                <span className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditPrice(p)}
                                    className="font-semibold text-rosver-red"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void removePrice(p.id)}
                                    className="font-semibold text-rosver-muted hover:text-rosver-red"
                                  >
                                    Quitar
                                  </button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-xs text-rosver-muted">
                            Sin precios
                          </p>
                        )}
                      </li>
                    )
                  })
                )}
              </ul>

              {packagingId ? (
                <form
                  noValidate
                  onSubmit={saveExtraPrice}
                  className="grid gap-3 rounded-xl border border-dashed border-rosver-line p-3 sm:grid-cols-4"
                >
                  <p className="sm:col-span-4 text-xs font-semibold text-rosver-muted">
                    {editingPriceId
                      ? 'Editando precio'
                      : 'Precio extra para la presentación seleccionada'}
                  </p>
                  <AdminField label="Tipo de precio" htmlFor="w-pk">
                    <AdminSelect
                      id="w-pk"
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
                  <AdminField label="Desde (unidades)" htmlFor="w-min">
                    <AdminInput
                      id="w-min"
                      value={minQty}
                      onChange={(e) => setMinQty(e.target.value)}
                    />
                  </AdminField>
                  <AdminField label="Precio (S/)" htmlFor="w-amt">
                    <AdminInput
                      id="w-amt"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </AdminField>
                  <div className="flex flex-wrap items-end gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-11 flex-1 rounded-xl bg-rosver-ink text-sm font-semibold text-white hover:bg-rosver-red disabled:opacity-60"
                    >
                      {editingPriceId ? 'Guardar' : 'Agregar precio'}
                    </button>
                    {editingPriceId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPriceId(null)
                          setAmount('')
                          setCompareAt('')
                          setMinQty('1')
                        }}
                        className="h-11 rounded-xl border border-rosver-line px-3 text-xs font-semibold text-rosver-muted"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-rosver-ink">
                Fase 4 — Especificaciones
              </p>
              <p className="text-sm text-rosver-muted">
                Tú defines el tipo (ej. Material, Voltaje) y su descripción o valor.
                No hay campos fijos obligatorios.
              </p>
              <div className="space-y-3">
                {specRows.map((row, idx) => (
                  <div
                    key={row.key}
                    className="grid gap-2 rounded-xl border border-rosver-line p-3 sm:grid-cols-[1fr_1fr_6rem_auto]"
                  >
                    <AdminField label="Tipo" htmlFor={`spec-t-${idx}`}>
                      <AdminInput
                        id={`spec-t-${idx}`}
                        list="spec-type-suggestions"
                        value={row.typeName}
                        onChange={(e) => {
                          const typeName = e.target.value
                          const match = specAttrs.find(
                            (a) =>
                              a.name.toLowerCase() === typeName.trim().toLowerCase(),
                          )
                          setSpecRows((rows) =>
                            rows.map((r, i) =>
                              i === idx
                                ? {
                                    ...r,
                                    typeName,
                                    attributeId: match?.id ?? null,
                                    unit: match?.unitHint ?? r.unit,
                                  }
                                : r,
                            ),
                          )
                        }}
                        placeholder="Ej. Material"
                      />
                    </AdminField>
                    <AdminField label="Descripción / valor" htmlFor={`spec-v-${idx}`}>
                      <AdminInput
                        id={`spec-v-${idx}`}
                        value={row.value}
                        onChange={(e) =>
                          setSpecRows((rows) =>
                            rows.map((r, i) =>
                              i === idx ? { ...r, value: e.target.value } : r,
                            ),
                          )
                        }
                        placeholder="Ej. Acero inoxidable"
                      />
                    </AdminField>
                    <AdminField label="Unidad" htmlFor={`spec-u-${idx}`}>
                      <AdminInput
                        id={`spec-u-${idx}`}
                        value={row.unit}
                        onChange={(e) =>
                          setSpecRows((rows) =>
                            rows.map((r, i) =>
                              i === idx ? { ...r, unit: e.target.value } : r,
                            ),
                          )
                        }
                        placeholder="mm"
                      />
                    </AdminField>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() =>
                          setSpecRows((rows) => rows.filter((_, i) => i !== idx))
                        }
                        className="h-11 text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <datalist id="spec-type-suggestions">
                {specAttrs.map((a) => (
                  <option key={a.id} value={a.name} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() =>
                  setSpecRows((rows) => [
                    ...rows,
                    {
                      key: `new-${Date.now()}`,
                      attributeId: null,
                      typeName: '',
                      value: '',
                      unit: '',
                    },
                  ])
                }
                className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
              >
                + Agregar especificación
              </button>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-rosver-line pt-4">
            <button
              type="button"
              disabled={step === 1 || busy}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="h-11 rounded-xl border border-rosver-line px-5 text-sm font-semibold text-rosver-muted disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void goNext()}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy
                ? 'Guardando…'
                : step === 4
                  ? 'Guardar y cerrar'
                  : 'Guardar y continuar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Productos"
        actions={
          <button
            type="button"
            onClick={startCreate}
            className="rounded-full bg-rosver-red px-4 py-2 text-xs font-semibold text-white hover:bg-rosver-red-dark"
          >
            Nuevo producto
          </button>
        }
      />

      <AdminInput
        value={listQuery}
        onChange={(e) => setListQuery(e.target.value)}
        placeholder="Buscar producto…"
        className="max-w-md"
      />

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : filteredProducts.length === 0 ? (
          <AdminEmptyState
            title="Todavía no hay productos"
            detail="Usa «Nuevo producto» y completa las fases."
          />
        ) : (
          <ul className="divide-y divide-rosver-line">
            {filteredProducts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-rosver-ink">{p.name}</p>
                  <p className="text-xs text-rosver-muted">
                    {p.sku}
                    {p.brandName ? ` · ${p.brandName}` : ''}
                    {p.categoryName ? ` · ${p.categoryName}` : ''}
                    {' · '}
                    {Number(p.rating).toFixed(1)}★ ({p.reviewCount})
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void startEdit(p.id)}
                    className="text-xs font-semibold text-rosver-red"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void softDelete(p.id, p.name)}
                    className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Ocultar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
