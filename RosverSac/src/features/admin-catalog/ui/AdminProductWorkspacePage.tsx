import { api, ApiError } from '@/shared/lib/api'
import { cn, formatInternalCode } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminSelect,
} from '@/shared/ui/admin-field'
import { AdminImageUpload } from '@/shared/ui/admin-image-upload'
import { ProductCard, type Product } from '@/features/catalog'
import { AdminWebPreview } from './AdminWebPreview'
import { Menu, Pen, Plus, Trash } from 'cssvg-icons'
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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
type CatalogPresentation = {
  id: string
  unitTypeId: string
  unitName: string
  contentQty: number
  label: string | null
  displayName: string
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
  validFrom?: string | null
  validTo?: string | null
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

/** datetime-local ← ISO */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local → ISO (null si vacío) */
function fromLocalInput(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function formatOfferWindow(from: string | null | undefined, to: string | null | undefined) {
  if (!from && !to) return 'Siempre'
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  if (from && to) return `${fmt(from)} → ${fmt(to)}`
  if (from) return `Desde ${fmt(from)}`
  return `Hasta ${fmt(to!)}`
}

function IconAction({
  label,
  onClick,
  className,
  children,
  disabled,
}: {
  label: string
  onClick: () => void
  className: string
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xl transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Siguiente orden automático (menor = primero en carrusel). */
function nextAutoSort(
  rows: { id: string; featured?: boolean; featuredSort?: number; trending?: boolean; trendingSort?: number }[],
  kind: 'featured' | 'trending',
  excludeId?: string | null,
) {
  const vals = rows
    .filter((p) => {
      if (p.id === excludeId) return false
      return kind === 'featured' ? Boolean(p.featured) : Boolean(p.trending)
    })
    .map((p) =>
      kind === 'featured' ? Number(p.featuredSort ?? 0) : Number(p.trendingSort ?? 0),
    )
  if (vals.length === 0) return 0
  return Math.max(...vals) + 1
}

/**
 * Alta/edición de productos por fases (estilo Odoo).
 * Specs: el usuario define tipo + valor. Calificaciones: solo lectura (clientes).
 */
export function AdminProductWorkspacePage() {
  const { id: routeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isCreate = !routeId || routeId === 'nuevo'
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [specAttrs, setSpecAttrs] = useState<SpecAttr[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(
    isCreate ? null : routeId,
  )
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [detailReady, setDetailReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [internalCode, setInternalCode] = useState<number | null>(null)
  const [brandId, setBrandId] = useState('')
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [origin, setOrigin] = useState('')
  const [moq, setMoq] = useState('1')
  const [availability, setAvailability] = useState('in_stock')
  const [featured, setFeatured] = useState(false)
  const [trending, setTrending] = useState(false)

  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [catalogPresentations, setCatalogPresentations] = useState<
    CatalogPresentation[]
  >([])
  const [priceUnitTypeId, setPriceUnitTypeId] = useState('')
  const [presentationId, setPresentationId] = useState('')
  const [packagingId, setPackagingId] = useState('')
  const [listAmount, setListAmount] = useState('')
  const [wholesaleAmount, setWholesaleAmount] = useState('')
  const [wholesaleMinQty, setWholesaleMinQty] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('offer')
  const [amount, setAmount] = useState('')
  const [priceMinQty, setPriceMinQty] = useState('1')
  const [compareAt, setCompareAt] = useState('')
  const [offerFrom, setOfferFrom] = useState('')
  const [offerTo, setOfferTo] = useState('')
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)

  const [specRows, setSpecRows] = useState<SpecRow[]>([])
  const [specDragIdx, setSpecDragIdx] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  )
  const subCategories = useMemo(
    () =>
      parentCategoryId
        ? categories.filter((c) => c.parentId === parentCategoryId)
        : [],
    [categories, parentCategoryId],
  )
  const assignedCategoryId = subcategoryId || parentCategoryId

  const availablePresentations = useMemo(() => {
    const used = new Set(
      packagings.map((p) => `${p.unitTypeId}:${p.contentQty}`),
    )
    return catalogPresentations.filter(
      (p) => !used.has(`${p.unitTypeId}:${p.contentQty}`),
    )
  }, [catalogPresentations, packagings])

  /** Tipos de unidad con al menos una cantidad aún disponible. */
  const unitTypeOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of availablePresentations) {
      if (!map.has(p.unitTypeId)) map.set(p.unitTypeId, p.unitName)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [availablePresentations])

  /** Cantidades del tipo elegido (aún no usadas en este producto). */
  const quantityOptions = useMemo(
    () =>
      priceUnitTypeId
        ? availablePresentations.filter((p) => p.unitTypeId === priceUnitTypeId)
        : [],
    [availablePresentations, priceUnitTypeId],
  )

  function selectPriceUnitType(nextTypeId: string) {
    setPriceUnitTypeId(nextTypeId)
    if (!nextTypeId) {
      setPresentationId('')
      return
    }
    const first = availablePresentations.find((p) => p.unitTypeId === nextTypeId)
    setPresentationId(first?.id ?? '')
  }

  function syncPriceCascade(
    rows: CatalogPresentation[],
    usedPacks: Packaging[] = packagings,
  ) {
    const used = new Set(
      usedPacks.map((p) => `${p.unitTypeId}:${p.contentQty}`),
    )
    const avail = rows.filter(
      (p) => !used.has(`${p.unitTypeId}:${p.contentQty}`),
    )
    if (avail.length === 0) {
      setPriceUnitTypeId('')
      setPresentationId('')
      return
    }
    const typeId = avail[0]!.unitTypeId
    const qty = avail.find((p) => p.unitTypeId === typeId) ?? avail[0]!
    setPriceUnitTypeId(typeId)
    setPresentationId(qty.id)
  }

  function applyCategoryFromProduct(
    categoryId: string | null | undefined,
    cats: Category[] = categories,
  ) {
    const id = categoryId ?? ''
    if (!id) {
      setParentCategoryId('')
      setSubcategoryId('')
      return
    }
    const cat = cats.find((c) => c.id === id)
    if (!cat) {
      setParentCategoryId(id)
      setSubcategoryId('')
      return
    }
    if (cat.parentId) {
      setParentCategoryId(cat.parentId)
      setSubcategoryId(cat.id)
    } else {
      setParentCategoryId(cat.id)
      setSubcategoryId('')
    }
  }

  async function loadList() {
    setLoading(true)
    try {
      const [p, b, c, a] = await Promise.all([
        api<{ products: ProductRow[] }>('/api/admin/products'),
        api<{ brands: Brand[] }>('/api/admin/brands'),
        api<{ categories: Category[] }>('/api/admin/categories'),
        api<{ attributes: SpecAttr[] }>('/api/admin/spec-attributes'),
      ])
      setProducts(p.products)
      setBrands(b.brands)
      setCategories(c.categories)
      setSpecAttrs(a.attributes)
      void loadCatalogPresentations()
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo cargar el listado',
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalogPresentations() {
    try {
      const pres = await api<{ presentations: CatalogPresentation[] }>(
        '/api/admin/presentations',
      )
      setCatalogPresentations(pres.presentations)
      syncPriceCascade(pres.presentations)
      return
    } catch {
      /* fallback: tipos + cantidades (API vieja sin /presentations) */
    }
    try {
      const u = await api<{
        unitTypes: { id: string; name: string; code: string }[]
      }>('/api/admin/unit-types')
      const rows: CatalogPresentation[] = []
      for (const ut of u.unitTypes) {
        try {
          const q = await api<{
            quantities: {
              id: string
              contentQty: number
              label: string | null
            }[]
          }>(`/api/admin/unit-types/${ut.id}/quantities`)
          if (q.quantities.length === 0) {
            rows.push({
              id: `unit:${ut.id}`,
              unitTypeId: ut.id,
              unitName: ut.name,
              contentQty: 1,
              label: null,
              displayName: `${ut.name} × 1`,
            })
          } else {
            for (const qty of q.quantities) {
              rows.push({
                id: qty.id,
                unitTypeId: ut.id,
                unitName: ut.name,
                contentQty: qty.contentQty,
                label: qty.label,
                displayName:
                  qty.label?.trim() || `${ut.name} × ${qty.contentQty}`,
              })
            }
          }
        } catch {
          rows.push({
            id: `unit:${ut.id}`,
            unitTypeId: ut.id,
            unitName: ut.name,
            contentQty: 1,
            label: null,
            displayName: `${ut.name} × 1`,
          })
        }
      }
      setCatalogPresentations(rows)
      syncPriceCascade(rows)
    } catch {
      setCatalogPresentations([])
      setPriceUnitTypeId('')
      setPresentationId('')
    }
  }

  async function loadDetail(id: string, cats?: Category[]): Promise<boolean> {
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
      if (!p) {
        setLoadError('Producto no encontrado')
        return false
      }
      setName(p.name)
      setSku(p.sku)
      setInternalCode(typeof p.code === 'number' ? p.code : Number(p.code))
      setBrandId(p.brandId ?? '')
      applyCategoryFromProduct(p.categoryId, cats ?? categories)
      setDescription(p.description ?? '')
      setImageUrl(p.imageUrl ?? '')
      setOrigin(p.origin ?? '')
      setMoq(String(p.moq ?? 1))
      setAvailability(p.availability || 'in_stock')
      setFeatured(Boolean(p.featured))
      setTrending(Boolean(p.trending))
      setRating(Number(p.rating ?? 0))
      setReviewCount(Number(p.reviewCount ?? 0))
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
        })
      }
      setSpecRows(loaded)
      setLoadError(null)
      return true
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'No se pudo abrir el producto'
      setLoadError(msg)
      showMessages([msg])
      return false
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setDetailReady(false)
      setLoadError(null)
      try {
        const [p, b, c, a] = await Promise.all([
          api<{ products: ProductRow[] }>('/api/admin/products'),
          api<{ brands: Brand[] }>('/api/admin/brands'),
          api<{ categories: Category[] }>('/api/admin/categories'),
          api<{ attributes: SpecAttr[] }>('/api/admin/spec-attributes'),
        ])
        setProducts(p.products)
        setBrands(b.brands)
        setCategories(c.categories)
        setSpecAttrs(a.attributes)
        void loadCatalogPresentations()

        if (isCreate) {
          resetWizard()
          let max = -1
          for (const row of p.products) {
            const n = Number(row.code)
            if (Number.isFinite(n) && n > max) max = n
          }
          setInternalCode(Math.max(0, max + 1))
          void api<{ code: number }>('/api/admin/products/next-code')
            .then((r) => {
              if (typeof r.code === 'number' && Number.isFinite(r.code)) {
                setInternalCode(r.code)
              }
            })
            .catch(() => {})
          setDetailReady(true)
        } else if (routeId) {
          setSelectedId(routeId)
          const ok = await loadDetail(routeId, c.categories)
          setDetailReady(ok)
        }
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : 'No se pudo cargar el producto'
        setLoadError(msg)
        showMessages([msg])
        setDetailReady(false)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  function resetWizard() {
    setSelectedId(null)
    setStep(1)
    setName('')
    setSku('')
    setInternalCode(null)
    setBrandId('')
    setParentCategoryId('')
    setSubcategoryId('')
    setDescription('')
    setImageUrl('')
    setOrigin('')
    setMoq('1')
    setAvailability('in_stock')
    setFeatured(false)
    setTrending(false)
    setPackagings([])
    setPrices([])
    setSpecRows([])
    setRating(0)
    setReviewCount(0)
    setAmount('')
    setCompareAt('')
    setOfferFrom('')
    setOfferTo('')
    setPriceUnitTypeId('')
    setPresentationId('')
    setListAmount('')
    setWholesaleAmount('')
    setWholesaleMinQty('')
    setPriceMinQty('1')
    setPriceKind('offer')
    setEditingPriceId(null)
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
            categoryId: assignedCategoryId || null,
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
            categoryId: assignedCategoryId || null,
            description,
            imageUrl: imageUrl.trim() || undefined,
            featured,
            featuredSort: featured
              ? nextAutoSort(products, 'featured', null)
              : 0,
          }),
        })
        showMessages(['Producto creado'])
        navigate(`/admin/productos/${res.product.id}`, { replace: true })
        return true
      }
      await loadList()
      showMessages(['Producto actualizado'])
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
      const current = products.find((p) => p.id === selectedId)
      const featuredSort = !featured
        ? 0
        : current?.featured
          ? Number(current.featuredSort ?? 0)
          : nextAutoSort(products, 'featured', selectedId)
      const trendingSort = !trending
        ? 0
        : current?.trending
          ? Number(current.trendingSort ?? 0)
          : nextAutoSort(products, 'trending', selectedId)
      await api(`/api/admin/products/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          origin,
          moq: Number(moq) || 1,
          availability,
          featured,
          featuredSort,
          trending,
          trendingSort,
        }),
      })
      await loadList()
      showMessages(['Detalle del producto guardado'])
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
      const incomplete = specRows.some(
        (row) => row.value.trim() && !row.attributeId,
      )
      if (incomplete) {
        showMessages(['Elige el tipo de cada especificación'])
        return false
      }

      const payload: {
        attributeId: string
        valueText?: string
        valueNumber?: number
        sortOrder: number
      }[] = []

      let order = 0
      for (const row of specRows) {
        const value = row.value.trim()
        if (!value || !row.attributeId) continue

        const asNum = Number(value.replace(',', '.'))
        if (Number.isFinite(asNum) && /^[\d.,]+$/.test(value)) {
          payload.push({
            attributeId: row.attributeId,
            valueNumber: asNum,
            sortOrder: order,
          })
        } else {
          payload.push({
            attributeId: row.attributeId,
            valueText: value,
            sortOrder: order,
          })
        }
        order += 1
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
        await loadList()
        navigate('/admin/productos')
      }
    }
  }

  async function addPackagingWithPrice(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId) {
      showMessages(['Primero guarda el producto'])
      return
    }
    const template = catalogPresentations.find((p) => p.id === presentationId)
    if (!template) {
      showMessages(['Elige presentación y cantidad de unidades'])
      return
    }
    const already = packagings.some(
      (p) =>
        p.unitTypeId === template.unitTypeId &&
        p.contentQty === template.contentQty,
    )
    if (already) {
      showMessages(['Esa presentación ya está en este producto'])
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
    let whMin = 1
    if (whAmt != null) {
      whMin = Number(wholesaleMinQty)
      if (!Number.isFinite(whMin) || whMin < 1) {
        showMessages(['Indica a partir de cuántas unidades es mayorista'])
        return
      }
    }
    setBusy(true)
    try {
      const created = await api<{ packaging: { id: string } }>(
        `/api/admin/products/${selectedId}/packagings`,
        {
          method: 'POST',
          body: JSON.stringify({
            unitTypeId: template.unitTypeId,
            contentQty: template.contentQty,
            label: template.label,
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
            minQty: whMin,
            amount: whAmt,
          }),
        })
      }
      setListAmount('')
      setWholesaleAmount('')
      setWholesaleMinQty('')
      setPackagingId(packId)
      const usedAfter: Packaging[] = [
        ...packagings,
        {
          id: packId,
          unitTypeId: template.unitTypeId,
          unitName: template.unitName,
          contentQty: template.contentQty,
          label: template.label,
          isDefault: packagings.length === 0,
        },
      ]
      syncPriceCascade(catalogPresentations, usedAfter)
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
    const validFrom = fromLocalInput(offerFrom)
    const validTo = fromLocalInput(offerTo)
    if (offerFrom.trim() && !validFrom) {
      showMessages(['La fecha de inicio no es válida'])
      return
    }
    if (offerTo.trim() && !validTo) {
      showMessages(['La fecha de fin no es válida'])
      return
    }
    if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
      showMessages(['La fecha de inicio debe ser anterior al fin'])
      return
    }
    const minQ = Number(priceMinQty)
    if (!Number.isFinite(minQ) || minQ < 1) {
      showMessages(['Indica a partir de cuántas unidades aplica'])
      return
    }
    const kind = editingPriceId ? priceKind : 'offer'
    const listRef = prices.find(
      (p) =>
        p.isActive &&
        p.packagingId === packagingId &&
        p.priceKind === 'list',
    )
    const compareAtAmount =
      compareAt.trim() !== ''
        ? Number(compareAt)
        : kind === 'offer'
          ? (listRef?.amount ?? null)
          : null
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/prices`, {
        method: 'POST',
        body: JSON.stringify({
          id: editingPriceId ?? undefined,
          packagingId,
          priceKind: kind,
          minQty: kind === 'offer' ? 1 : minQ,
          amount: amt,
          compareAtAmount,
          validFrom: kind === 'offer' ? validFrom : null,
          validTo: kind === 'offer' ? validTo : null,
          saveAsNew: false,
        }),
      })
      setAmount('')
      setCompareAt('')
      setOfferFrom('')
      setOfferTo('')
      setPriceMinQty('1')
      setPriceKind('offer')
      setEditingPriceId(null)
      await loadDetail(selectedId)
      showMessages([editingPriceId ? 'Precio actualizado' : 'Oferta agregada'])
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
    setPriceMinQty(String(p.minQty ?? 1))
    setCompareAt(
      p.compareAtAmount != null ? String(p.compareAtAmount) : '',
    )
    setOfferFrom(toLocalInput(p.validFrom))
    setOfferTo(toLocalInput(p.validTo))
  }

  function startAddOffer(packagingIdValue: string) {
    setPackagingId(packagingIdValue)
    setEditingPriceId(null)
    setPriceKind('offer')
    setAmount('')
    setCompareAt('')
    setOfferFrom('')
    setOfferTo('')
    setPriceMinQty('1')
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
      showMessages(['Precio eliminado'])
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
      showMessages(['Presentación eliminada'])
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
      showMessages(['Producto ocultado'])
      navigate('/admin/productos')
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  function closeWizard() {
    navigate('/admin/productos')
  }

  async function saveCurrentTab() {
    if (step === 1) {
      await saveStep1()
      return
    }
    if (step === 2) {
      await saveStep2()
      return
    }
    if (step === 3) {
      showMessages(['Los precios se guardan al agregar empaque u oferta'])
      return
    }
    if (step === 4) {
      await saveStep4()
    }
  }

  function selectTab(id: number) {
    if (!selectedId && id > 1) {
      showMessages(['Primero guarda los datos del producto'])
      return
    }
    setStep(id)
  }

  const previewProduct: Product = useMemo(() => {
    const brandName =
      brands.find((b) => b.id === brandId)?.name?.trim() || 'Sin marca'
    const defPack =
      packagings.find((p) => p.isDefault) ?? packagings[0] ?? null
    const packPrices = prices.filter(
      (p) =>
        p.isActive &&
        (defPack ? p.packagingId === defPack.id : true),
    )
    const listP = packPrices.find((p) => p.priceKind === 'list')
    const offerP = packPrices.find((p) => p.priceKind === 'offer')
    const whP = packPrices.find((p) => p.priceKind === 'wholesale')
    let price: number | null = listP?.amount ?? null
    let originalPrice: number | undefined
    if (offerP && listP && offerP.amount < listP.amount) {
      price = offerP.amount
      originalPrice = listP.amount
    } else if (
      listP?.compareAtAmount != null &&
      listP.compareAtAmount > listP.amount
    ) {
      originalPrice = listP.compareAtAmount
    }
    if (availability === 'quote_only') price = null

    return {
      id: selectedId ?? 'preview',
      slug: 'preview',
      name: name.trim() || 'Nombre del producto',
      sku: sku.trim() || 'SKU',
      vendor: brandName,
      category: categories.find((c) => c.id === assignedCategoryId)?.name ?? '',
      price,
      originalPrice,
      wholesalePrice: whP?.amount,
      featured,
      rating,
      reviewCount,
      origin: origin.trim() || '—',
      moq: Number(moq) || 1,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
    }
  }, [
    availability,
    brandId,
    brands,
    categories,
    assignedCategoryId,
    description,
    featured,
    imageUrl,
    moq,
    name,
    origin,
    packagings,
    prices,
    rating,
    reviewCount,
    selectedId,
    sku,
  ])

  if (loading) {
    return (
      <div className="space-y-4">
        <FloatingToasts toasts={toasts} onDismiss={dismiss} />
        <div className="rounded-2xl border border-rosver-line bg-white">
          <AdminEmptyState title="Cargando producto…" />
        </div>
      </div>
    )
  }

  if (loadError || !detailReady) {
    return (
      <div className="space-y-4">
        <FloatingToasts toasts={toasts} onDismiss={dismiss} />
        <div className="rounded-2xl border border-rosver-line bg-white p-6 text-center">
          <p className="text-sm font-semibold text-rosver-ink">
            {loadError || 'No se pudo abrir el producto'}
          </p>
          <Link
            to="/admin/productos"
            className="mt-4 inline-flex h-11 items-center rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark"
          >
            Volver a productos
          </Link>
        </div>
      </div>
    )
  }

  const brandName =
    brands.find((b) => b.id === brandId)?.name?.trim() || 'Sin marca'
  const visibleRow = products.find((p) => p.id === selectedId)

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/productos"
          className="text-sm font-semibold text-rosver-muted hover:text-rosver-red"
        >
          ← Volver a productos
        </Link>
        <div className="flex flex-wrap gap-2">
          {selectedId ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void softDelete(selectedId, name.trim() || 'producto')
              }
              className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-red disabled:opacity-60"
            >
              Ocultar
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveCurrentTab()}
            className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-rosver-line bg-gradient-to-br from-rosver-soft/80 to-white p-4 sm:flex-row sm:items-center sm:p-5">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={72}
              height={72}
              className="size-[72px] shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex size-[72px] shrink-0 items-center justify-center rounded-2xl bg-rosver-ink text-lg font-bold text-white">
              {(name.trim() || 'P').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-rosver-ink sm:text-2xl">
                {name.trim() || (isCreate ? 'Nuevo producto' : 'Producto')}
              </h1>
              {visibleRow ? (
                <span
                  className={
                    visibleRow.visible
                      ? 'rounded-full bg-rosver-success/15 px-2 py-0.5 text-[10px] font-bold text-rosver-success'
                      : 'rounded-full bg-rosver-muted/15 px-2 py-0.5 text-[10px] font-bold text-rosver-muted'
                  }
                >
                  {visibleRow.visible ? 'Visible' : 'Oculto'}
                </span>
              ) : (
                <span className="rounded-full bg-rosver-yellow/80 px-2 py-0.5 text-[10px] font-bold text-rosver-ink">
                  Borrador
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-rosver-muted">
              {sku.trim() ? `SKU ${sku.trim()}` : 'Sin SKU'}
              {internalCode != null
                ? ` · Cód. ${formatInternalCode(internalCode)}`
                : ''}
              {` · ${brandName}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 border-b border-rosver-line bg-rosver-soft/40 p-2 sm:grid-cols-4">
          {STEPS.map((s) => {
            const active = step === s.id
            const locked = !selectedId && s.id > 1
            const done = Boolean(selectedId) && step > s.id
            return (
              <button
                key={s.id}
                type="button"
                disabled={locked}
                onClick={() => selectTab(s.id)}
                className={cn(
                  'rounded-xl px-2 py-2.5 text-center text-xs font-bold transition sm:text-sm',
                  active && 'bg-rosver-red text-white shadow-sm',
                  done && !active && 'bg-rosver-ink text-white',
                  !active &&
                    !done &&
                    'bg-white text-rosver-muted ring-1 ring-rosver-line',
                  locked && 'cursor-not-allowed opacity-40',
                )}
              >
                <span className="block text-[10px] font-semibold opacity-80">
                  Fase {s.id}
                </span>
                {s.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-start">
        <div className="min-w-0 space-y-4 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap gap-2 border-b border-rosver-line pb-3">
            {STEPS.map((s) => {
              const active = step === s.id
              const locked = !selectedId && s.id > 1
              return (
                <button
                  key={`tab-${s.id}`}
                  type="button"
                  disabled={locked}
                  onClick={() => selectTab(s.id)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm',
                    active
                      ? 'bg-rosver-soft text-rosver-red ring-1 ring-rosver-red/30'
                      : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                    locked && 'opacity-40',
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
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
                <AdminField label="Código producto (SKU)" htmlFor="w-sku">
                  <AdminInput
                    id="w-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU"
                    className="uppercase"
                  />
                </AdminField>
                <AdminField label="Código interno" htmlFor="w-internal-code">
                  <AdminInput
                    id="w-internal-code"
                    readOnly
                    tabIndex={-1}
                    autoComplete="off"
                    value={
                      internalCode != null
                        ? formatInternalCode(internalCode)
                        : formatInternalCode(0)
                    }
                    className="cursor-default bg-rosver-soft font-mono text-base font-bold tabular-nums tracking-wide text-rosver-ink"
                    aria-readonly="true"
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
                    value={parentCategoryId}
                    onChange={(e) => {
                      setParentCategoryId(e.target.value)
                      setSubcategoryId('')
                    }}
                  >
                    <option value="">Elegir categoría</option>
                    {rootCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Subcategoría" htmlFor="w-subcat">
                  <AdminSelect
                    id="w-subcat"
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    disabled={!parentCategoryId || subCategories.length === 0}
                  >
                    <option value="">
                      {!parentCategoryId
                        ? 'Elige categoría primero'
                        : subCategories.length === 0
                          ? 'Sin subcategorías'
                          : 'Opcional'}
                    </option>
                    {subCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField
                  label="Descripción"
                  htmlFor="w-desc"
                  className="sm:col-span-2"
                >
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
              <div className="rounded-xl border border-dashed border-rosver-line bg-rosver-soft/30 px-4 py-3 text-sm text-rosver-muted">
                Calificación:{' '}
                <span className="font-semibold text-rosver-ink">
                  {rating.toFixed(1)} · {reviewCount} reseñas
                </span>
                <span className="mt-1 block text-xs">
                  La pone el cliente desde su cuenta. Aquí solo se muestra el
                  promedio.
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
                  Primero el tipo de presentación, luego la cantidad de unidades
                  y el precio. La oferta puede tener fechas de inicio y fin.
                </p>
              </div>
              <form
                noValidate
                onSubmit={addPackagingWithPrice}
                className="grid gap-3 rounded-xl border border-rosver-line p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              >
                <AdminField label="Presentación" htmlFor="w-pres-type">
                  <AdminSelect
                    id="w-pres-type"
                    value={priceUnitTypeId}
                    onChange={(e) => selectPriceUnitType(e.target.value)}
                  >
                    <option value="">
                      {unitTypeOptions.length === 0
                        ? 'Sin presentaciones disponibles'
                        : 'Elegir…'}
                    </option>
                    {unitTypeOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Cantidad de unidades" htmlFor="w-pres-qty">
                  <AdminSelect
                    id="w-pres-qty"
                    value={presentationId}
                    onChange={(e) => setPresentationId(e.target.value)}
                    disabled={!priceUnitTypeId}
                  >
                    <option value="">
                      {!priceUnitTypeId
                        ? 'Elige presentación…'
                        : quantityOptions.length === 0
                          ? 'Sin cantidades disponibles'
                          : 'Elegir…'}
                    </option>
                    {quantityOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label?.trim() || `× ${p.contentQty}`}
                      </option>
                    ))}
                  </AdminSelect>
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
                <AdminField label="Mayorista (S/)" htmlFor="w-wh">
                  <AdminInput
                    id="w-wh"
                    inputMode="decimal"
                    value={wholesaleAmount}
                    onChange={(e) => setWholesaleAmount(e.target.value)}
                    placeholder="Opcional"
                  />
                </AdminField>
                <AdminField
                  label="Mayorista a partir de"
                  htmlFor="w-wh-min"
                >
                  <AdminInput
                    id="w-wh-min"
                    inputMode="numeric"
                    value={wholesaleMinQty}
                    onChange={(e) => setWholesaleMinQty(e.target.value)}
                    placeholder="Ej. 12"
                    disabled={!wholesaleAmount.trim()}
                  />
                </AdminField>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={busy || !presentationId}
                    className="h-11 w-full rounded-xl bg-rosver-red text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
                {catalogPresentations.length === 0 ? (
                  <p className="sm:col-span-2 lg:col-span-3 xl:col-span-6 text-xs text-rosver-muted">
                    Primero crea presentaciones en{' '}
                    <Link
                      to="/admin/listado-precios"
                      className="font-semibold text-rosver-red hover:underline"
                    >
                      Presentaciones
                    </Link>
                    .
                  </p>
                ) : null}
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
                    const selected = packagingId === pk.id
                    const packLabel =
                      pk.label || `${pk.unitName} × ${pk.contentQty}`
                    return (
                      <li
                        key={pk.id}
                        className={cn(
                          'px-4 py-3 text-sm',
                          selected && 'bg-rosver-soft/50',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPackagingId(pk.id)}
                            className={cn(
                              'text-left font-semibold',
                              selected ? 'text-rosver-red' : 'text-rosver-ink',
                            )}
                          >
                            {packLabel}
                            {pk.isDefault ? (
                              <span className="ml-2 text-[10px] font-bold text-rosver-red">
                                Principal
                              </span>
                            ) : null}
                          </button>
                          <div className="flex items-center gap-1">
                            <IconAction
                              label="Agregar oferta"
                              onClick={() => startAddOffer(pk.id)}
                              className="bg-rosver-yellow/25 text-rosver-ink hover:bg-rosver-yellow/45"
                            >
                              <Plus
                                size={16}
                                color="currentColor"
                                strokeWidth={2}
                              />
                            </IconAction>
                            <IconAction
                              label="Eliminar presentación"
                              disabled={busy}
                              onClick={() => void removePackaging(pk.id)}
                              className="bg-rosver-soft text-rosver-muted hover:bg-rosver-red/10 hover:text-rosver-red"
                            >
                              <Trash
                                size={16}
                                color="currentColor"
                                strokeWidth={2}
                              />
                            </IconAction>
                          </div>
                        </div>
                        {pkPrices.length > 0 ? (
                          <ul className="mt-2 space-y-1.5">
                            {pkPrices.map((p) => (
                              <li
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs text-rosver-muted"
                              >
                                <span>
                                  <span className="font-semibold text-rosver-ink">
                                    {PRICE_KIND_LABEL[p.priceKind] ??
                                      p.priceKind}
                                  </span>
                                  <span className="ml-2 font-bold text-rosver-red">
                                    S/ {p.amount.toFixed(2)}
                                  </span>
                                  {p.priceKind === 'wholesale' ? (
                                    <span className="ml-2 text-[11px]">
                                      · a partir de {p.minQty}{' '}
                                      {p.minQty === 1 ? 'unidad' : 'unidades'}
                                    </span>
                                  ) : null}
                                  {p.priceKind === 'offer' ? (
                                    <span className="ml-2 text-[10px]">
                                      ({formatOfferWindow(p.validFrom, p.validTo)})
                                    </span>
                                  ) : null}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconAction
                                    label="Editar precio"
                                    onClick={() => startEditPrice(p)}
                                    className="size-8 bg-rosver-red/10 text-rosver-red hover:bg-rosver-red/20"
                                  >
                                    <Pen
                                      size={14}
                                      color="currentColor"
                                      strokeWidth={2}
                                    />
                                  </IconAction>
                                  <IconAction
                                    label="Quitar precio"
                                    disabled={busy}
                                    onClick={() => void removePrice(p.id)}
                                    className="size-8 bg-rosver-soft text-rosver-muted hover:bg-rosver-red/10 hover:text-rosver-red"
                                  >
                                    <Trash
                                      size={14}
                                      color="currentColor"
                                      strokeWidth={2}
                                    />
                                  </IconAction>
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-xs text-rosver-muted">
                            Sin precios
                          </p>
                        )}

                        {selected ? (
                          <form
                            noValidate
                            onSubmit={saveExtraPrice}
                            className="mt-3 grid gap-3 rounded-xl border border-dashed border-rosver-line bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"
                          >
                            <p className="sm:col-span-2 lg:col-span-4 text-xs font-semibold text-rosver-muted">
                              {editingPriceId
                                ? `Editando ${PRICE_KIND_LABEL[priceKind] ?? priceKind} — ${packLabel}`
                                : `Oferta para «${packLabel}» (vacío = siempre activa)`}
                            </p>
                            <AdminField
                              label={
                                editingPriceId
                                  ? 'Precio (S/)'
                                  : 'Precio de oferta (S/)'
                              }
                              htmlFor={`w-amt-${pk.id}`}
                            >
                              <AdminInput
                                id={`w-amt-${pk.id}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                              />
                            </AdminField>
                            {editingPriceId && priceKind === 'wholesale' ? (
                              <AdminField
                                label="A partir de (unidades)"
                                htmlFor={`w-min-${pk.id}`}
                              >
                                <AdminInput
                                  id={`w-min-${pk.id}`}
                                  inputMode="numeric"
                                  value={priceMinQty}
                                  onChange={(e) =>
                                    setPriceMinQty(e.target.value)
                                  }
                                  placeholder="12"
                                />
                              </AdminField>
                            ) : null}
                            {(!editingPriceId || priceKind === 'offer') && (
                              <>
                                <AdminField
                                  label="Inicio"
                                  htmlFor={`w-from-${pk.id}`}
                                >
                                  <AdminInput
                                    id={`w-from-${pk.id}`}
                                    type="datetime-local"
                                    value={offerFrom}
                                    onChange={(e) =>
                                      setOfferFrom(e.target.value)
                                    }
                                  />
                                </AdminField>
                                <AdminField
                                  label="Fin"
                                  htmlFor={`w-to-${pk.id}`}
                                >
                                  <AdminInput
                                    id={`w-to-${pk.id}`}
                                    type="datetime-local"
                                    value={offerTo}
                                    onChange={(e) => setOfferTo(e.target.value)}
                                  />
                                </AdminField>
                              </>
                            )}
                            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                              <button
                                type="submit"
                                disabled={busy}
                                className="h-11 rounded-xl bg-rosver-ink px-5 text-sm font-semibold text-white hover:bg-rosver-red disabled:opacity-60"
                              >
                                {editingPriceId
                                  ? 'Guardar'
                                  : 'Agregar oferta'}
                              </button>
                              {editingPriceId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPriceId(null)
                                    setAmount('')
                                    setCompareAt('')
                                    setOfferFrom('')
                                    setOfferTo('')
                                    setPriceMinQty('1')
                                    setPriceKind('offer')
                                  }}
                                  className="h-11 rounded-xl border border-rosver-line px-3 text-xs font-semibold text-rosver-muted"
                                >
                                  Cancelar
                                </button>
                              ) : null}
                            </div>
                          </form>
                        ) : null}
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-rosver-ink">
                Fase 4 — Especificaciones
              </p>
              <p className="text-sm text-rosver-muted">
                Elige el tipo, escribe la descripción y arrastra para ordenar cómo
                se verá en la ficha.
              </p>

              {specAttrs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-rosver-line bg-rosver-soft/40 p-4 text-sm text-rosver-muted">
                  Primero crea tipos en{' '}
                  <Link
                    to="/admin/especificaciones"
                    className="font-semibold text-rosver-red hover:underline"
                  >
                    Especificaciones
                  </Link>
                  .
                </div>
              ) : null}

              <div className="space-y-3">
                {specRows.map((row, idx) => {
                  const usedIds = new Set(
                    specRows
                      .map((r, i) => (i === idx ? null : r.attributeId))
                      .filter(Boolean),
                  )
                  const options = specAttrs.filter(
                    (a) =>
                      a.id === row.attributeId || !usedIds.has(a.id),
                  )
                  return (
                    <div
                      key={row.key}
                      onDragOver={(e: DragEvent) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(e: DragEvent) => {
                        e.preventDefault()
                        const fromRaw =
                          e.dataTransfer.getData('text/plain') ||
                          (specDragIdx != null ? String(specDragIdx) : '')
                        const from = Number(fromRaw)
                        if (!Number.isFinite(from) || from === idx) {
                          setSpecDragIdx(null)
                          return
                        }
                        setSpecRows((rows) => {
                          const next = [...rows]
                          const [moved] = next.splice(from, 1)
                          next.splice(idx, 0, moved)
                          return next
                        })
                        setSpecDragIdx(null)
                      }}
                      className={cn(
                        'grid gap-2 rounded-xl border border-rosver-line bg-white p-3 sm:grid-cols-[auto_minmax(10rem,14rem)_1fr_auto]',
                        specDragIdx === idx && 'opacity-60 ring-2 ring-rosver-red/30',
                      )}
                    >
                      <div className="flex items-end pb-1 sm:items-center sm:pb-0">
                        <button
                          type="button"
                          title="Arrastrar para ordenar"
                          aria-label="Arrastrar para ordenar"
                          draggable
                          onDragStart={(e: DragEvent) => {
                            setSpecDragIdx(idx)
                            e.dataTransfer.setData('text/plain', String(idx))
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setSpecDragIdx(null)}
                          className="inline-flex size-11 cursor-grab items-center justify-center rounded-xl text-rosver-muted hover:bg-rosver-soft active:cursor-grabbing"
                        >
                          <Menu size={18} color="currentColor" strokeWidth={2} />
                        </button>
                      </div>
                      <AdminField label="Tipo" htmlFor={`spec-t-${idx}`}>
                        <AdminSelect
                          id={`spec-t-${idx}`}
                          value={row.attributeId ?? ''}
                          onChange={(e) => {
                            const id = e.target.value
                            const match = specAttrs.find((a) => a.id === id)
                            setSpecRows((rows) =>
                              rows.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      attributeId: id || null,
                                      typeName: match?.name ?? '',
                                    }
                                  : r,
                              ),
                            )
                          }}
                        >
                          <option value="">Elige tipo…</option>
                          {options.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </AdminSelect>
                      </AdminField>
                      <AdminField
                        label="Descripción"
                        htmlFor={`spec-v-${idx}`}
                      >
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
                          placeholder="Escribe el valor tal cual (ej. ABS + aluminio)"
                        />
                      </AdminField>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() =>
                            setSpecRows((rows) =>
                              rows.filter((_, i) => i !== idx),
                            )
                          }
                          className="h-11 text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                disabled={
                  specAttrs.length === 0 ||
                  specRows.length >= specAttrs.length
                }
                onClick={() =>
                  setSpecRows((rows) => [
                    ...rows,
                    {
                      key: `new-${Date.now()}`,
                      attributeId: null,
                      typeName: '',
                      value: '',
                    },
                  ])
                }
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={18} color="currentColor" strokeWidth={2} />
                Agregar especificación
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={closeWizard}
                className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
              >
                Cancelar
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
                    ? 'Guardar y volver'
                    : 'Guardar y continuar'}
              </button>
            </div>
          </div>
        </div>
        </div>

        <AdminWebPreview
          label="Vista previa en la tienda"
          className="lg:sticky lg:top-0"
        >
          <ProductCard product={previewProduct} preview />
        </AdminWebPreview>
      </div>
    </div>
  )
}
