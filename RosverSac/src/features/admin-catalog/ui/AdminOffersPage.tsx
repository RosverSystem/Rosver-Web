import { api, ApiError } from '@/shared/lib/api'
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
import { AdminModal } from '@/shared/ui/admin-modal'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type OfferProduct = {
  id: string
  slug: string
  name: string
  sku: string
  vendor: string
  price: number | null
  originalPrice?: number
  offerPrice?: number
  imageUrl?: string
}

type CatalogOption = { id: string; name: string; sku?: string }

/**
 * Ofertas ERP → tienda /ofertas (Postgres, sin mocks).
 * Alta en AdminModal (regla 17).
 */
export function AdminOffersPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<OfferProduct[]>([])
  const [allProducts, setAllProducts] = useState<CatalogOption[]>([])
  const [brands, setBrands] = useState<CatalogOption[]>([])
  const [categories, setCategories] = useState<CatalogOption[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [productId, setProductId] = useState('')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [offers, list, b, c] = await Promise.all([
        api<{ products: OfferProduct[] }>('/api/admin/offers'),
        api<{ products: { id: string; name: string; sku: string }[] }>(
          '/api/admin/products',
        ),
        api<{ brands: { id: string; name: string }[] }>('/api/admin/brands'),
        api<{ categories: { id: string; name: string }[] }>(
          '/api/admin/categories',
        ),
      ])
      setProducts(offers.products)
      setAllProducts(list.products)
      setBrands(b.brands)
      setCategories(c.categories)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar las ofertas',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function resetForm() {
    setProductId('')
    setName('')
    setSku('')
    setBrandId('')
    setCategoryId('')
    setDescription('')
    setImageUrl('')
    setListPrice('')
    setOfferPrice('')
    setMode('new')
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const list = Number(listPrice)
    const offer = Number(offerPrice)
    const errors: string[] = []
    if (!Number.isFinite(list) || list <= 0) errors.push('Precio normal inválido')
    if (!Number.isFinite(offer) || offer <= 0) errors.push('Precio oferta inválido')
    if (Number.isFinite(list) && Number.isFinite(offer) && offer >= list) {
      errors.push('La oferta debe ser menor que el precio normal')
    }
    if (mode === 'existing' && !productId) {
      errors.push('Elige un producto')
    }
    if (mode === 'new') {
      if (!name.trim()) errors.push('Escribe el nombre del producto')
      if (!sku.trim()) errors.push('Escribe el código del producto')
    }
    if (errors.length) {
      showMessages(errors)
      return
    }

    setBusy(true)
    try {
      await api('/api/admin/offers', {
        method: 'POST',
        body: JSON.stringify(
          mode === 'existing'
            ? {
                productId,
                listPrice: list,
                offerPrice: offer,
                imageUrl: imageUrl.trim() || undefined,
              }
            : {
                name: name.trim(),
                sku: sku.trim(),
                brandId: brandId || null,
                categoryId: categoryId || null,
                description: description.trim(),
                imageUrl: imageUrl.trim() || null,
                listPrice: list,
                offerPrice: offer,
              },
        ),
      })
      closeModal()
      await load()
      showMessages(['Oferta publicada en la tienda'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar la oferta',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function removeOffer(id: string, productName: string) {
    if (!window.confirm(`¿Quitar la oferta de «${productName}»?`)) return
    clear()
    try {
      await api(`/api/admin/offers/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo quitar la oferta',
      ])
    }
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Ofertas"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/ofertas"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
            >
              Ver en la tienda
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="h-9 rounded-xl bg-rosver-red px-4 text-xs font-semibold text-white hover:bg-rosver-red-dark"
            >
              Nueva oferta
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState title="Cargando…" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState
              title="Todavía no hay ofertas"
              detail="Usa «Nueva oferta» para publicar en la tienda."
            />
          </div>
        ) : (
          products.map((p) => {
            const disc =
              p.price != null && p.originalPrice && p.originalPrice > p.price
                ? Math.round(100 - (p.price / p.originalPrice) * 100)
                : null
            return (
              <article
                key={p.id}
                className="flex gap-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-xl bg-rosver-soft text-xs font-bold text-rosver-muted">
                    {p.sku.slice(0, 3)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-rosver-ink">{p.name}</p>
                  <p className="text-xs text-rosver-muted">
                    {p.vendor} · {p.sku}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    {p.originalPrice ? (
                      <span className="text-xs text-rosver-muted line-through">
                        S/ {p.originalPrice.toFixed(2)}
                      </span>
                    ) : null}
                    <span className="font-bold text-rosver-red">
                      {p.price != null ? `S/ ${p.price.toFixed(2)}` : 'Consultar'}
                    </span>
                    {disc ? (
                      <span className="rounded bg-rosver-yellow px-1.5 py-0.5 text-[10px] font-black text-rosver-ink">
                        −{disc}%
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeOffer(p.id, p.name)}
                    className="mt-2 text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Quitar oferta
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title="Nueva oferta"
        size="xl"
        layer={80}
        closeOnEscape={false}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="offer-form"
              disabled={busy}
              className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Publicando…' : 'Publicar oferta'}
            </button>
          </>
        }
      >
        <form id="offer-form" noValidate onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                mode === 'new'
                  ? 'bg-rosver-red text-white'
                  : 'bg-rosver-soft text-rosver-muted'
              }`}
            >
              Producto nuevo
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                mode === 'existing'
                  ? 'bg-rosver-red text-white'
                  : 'bg-rosver-soft text-rosver-muted'
              }`}
            >
              Producto ya creado
            </button>
          </div>

          {mode === 'existing' ? (
            <AdminField label="Producto" htmlFor="offer-prod">
              <AdminSelect
                id="offer-prod"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Elegir producto</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Nombre" htmlFor="offer-name">
                <AdminInput
                  id="offer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Multímetro digital CAT III"
                />
              </AdminField>
              <AdminField label="Código" htmlFor="offer-sku">
                <AdminInput
                  id="offer-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="RS-4201"
                  className="uppercase"
                />
              </AdminField>
              <AdminField label="Marca" htmlFor="offer-brand">
                <AdminSelect
                  id="offer-brand"
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
              <AdminField label="Categoría" htmlFor="offer-cat">
                <AdminSelect
                  id="offer-cat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Elegir categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField
                label="Descripción"
                htmlFor="offer-desc"
                className="sm:col-span-2"
              >
                <AdminInput
                  id="offer-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción para la card"
                />
              </AdminField>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Precio normal (S/)" htmlFor="offer-list">
              <AdminInput
                id="offer-list"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="99.00"
                inputMode="decimal"
              />
            </AdminField>
            <AdminField label="Precio oferta (S/)" htmlFor="offer-price">
              <AdminInput
                id="offer-price"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="79.00"
                inputMode="decimal"
              />
            </AdminField>
          </div>

          <AdminImageUpload
            folder="products"
            value={imageUrl}
            onChange={setImageUrl}
            onError={(msg) => showMessages([msg])}
            label="Foto (opcional)"
          />
        </form>
      </AdminModal>
    </div>
  )
}
