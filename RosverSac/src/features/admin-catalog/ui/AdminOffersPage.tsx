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
import { Plus } from 'cssvg-icons'
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

type PromoItem = {
  id: string
  productId: string
  productName: string
  productSku: string
  buyQty: number
  payQty: number
  active: boolean
  notes: string | null
}

/**
 * Ofertas ERP → tienda /ofertas (Postgres, sin mocks).
 * Alta en AdminModal (regla 17). Incluye promos 2×1 automáticas.
 */
export function AdminOffersPage() {
  const { toasts, showMessages, showSuccess, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<OfferProduct[]>([])
  const [allProducts, setAllProducts] = useState<CatalogOption[]>([])
  const [brands, setBrands] = useState<CatalogOption[]>([])
  const [categories, setCategories] = useState<CatalogOption[]>([])
  const [promos, setPromos] = useState<PromoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [promoModal, setPromoModal] = useState(false)
  const [promoProductId, setPromoProductId] = useState('')
  const [promoBuy, setPromoBuy] = useState('2')
  const [promoPay, setPromoPay] = useState('1')
  const [promoNotes, setPromoNotes] = useState('')

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
      const [offers, list, b, c, p] = await Promise.all([
        api<{ products: OfferProduct[] }>('/api/admin/offers'),
        api<{ products: { id: string; name: string; sku: string }[] }>(
          '/api/admin/products',
        ),
        api<{ brands: { id: string; name: string }[] }>('/api/admin/brands'),
        api<{ categories: { id: string; name: string }[] }>(
          '/api/admin/categories',
        ),
        api<{ items: PromoItem[] }>('/api/admin/promos').catch(() => ({
          items: [] as PromoItem[],
        })),
      ])
      setProducts(offers.products)
      setAllProducts(list.products)
      setBrands(b.brands)
      setCategories(c.categories)
      setPromos(p.items ?? [])
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

  async function createPromo(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const buyQty = Number(promoBuy)
    const payQty = Number(promoPay)
    if (!promoProductId) {
      showMessages(['Elige un producto'])
      return
    }
    if (!Number.isFinite(buyQty) || buyQty < 2 || !Number.isFinite(payQty) || payQty < 1 || payQty >= buyQty) {
      showMessages(['Usa por ejemplo 2×1 (compra 2, paga 1)'])
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify({
          productId: promoProductId,
          buyQty,
          payQty,
          notes: promoNotes.trim() || null,
        }),
      })
      setPromoModal(false)
      setPromoProductId('')
      setPromoBuy('2')
      setPromoPay('1')
      setPromoNotes('')
      showSuccess(['Promoción 2×1 activa. Se aplica sola en el carrito.'])
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo crear la promo',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function togglePromo(id: string, active: boolean) {
    try {
      await api(`/api/admin/promos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      })
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo actualizar',
      ])
    }
  }

  async function removePromo(id: string, label: string) {
    if (!window.confirm(`¿Eliminar la promo de «${label}»?`)) return
    try {
      await api(`/api/admin/promos/${id}`, { method: 'DELETE' })
      showSuccess(['Promo eliminada'])
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
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

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-rosver-ink">Promociones 2×1</h2>
            <p className="text-xs text-rosver-muted">
              Se aplican solas al agregar al carrito (ej. lleva 2, paga 1).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPromoModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rosver-line bg-white px-3 py-2 text-xs font-bold text-rosver-ink hover:border-rosver-red hover:text-rosver-red"
          >
            <Plus size={14} color="currentColor" strokeWidth={2} />
            Nueva 2×1
          </button>
        </div>
        {promos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-rosver-line bg-white px-4 py-6 text-center text-sm text-rosver-muted">
            Aún no hay promociones automáticas.
          </p>
        ) : (
          <ul className="divide-y divide-rosver-line overflow-hidden rounded-xl border border-rosver-line bg-white">
            {promos.map((pr) => (
              <li
                key={pr.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-rosver-ink">
                    {pr.productName}
                  </p>
                  <p className="text-xs text-rosver-muted">
                    {pr.productSku} · {pr.buyQty}×{pr.payQty}
                    {pr.notes ? ` · ${pr.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void togglePromo(pr.id, pr.active)}
                    className={
                      pr.active
                        ? 'rounded-lg bg-rosver-success/15 px-2.5 py-1 text-xs font-bold text-rosver-success'
                        : 'rounded-lg bg-rosver-soft px-2.5 py-1 text-xs font-bold text-rosver-muted'
                    }
                  >
                    {pr.active ? 'Activa' : 'Pausada'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removePromo(pr.id, pr.productName)}
                    className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      <AdminModal
        open={promoModal}
        onClose={() => setPromoModal(false)}
        title="Nueva promoción 2×1"
        size="md"
        layer={85}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPromoModal(false)}
              className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="promo-form"
              disabled={busy}
              className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : 'Activar promo'}
            </button>
          </>
        }
      >
        <form id="promo-form" noValidate onSubmit={createPromo} className="space-y-4">
          <AdminField label="Producto" htmlFor="promo-prod">
            <AdminSelect
              id="promo-prod"
              value={promoProductId}
              onChange={(e) => setPromoProductId(e.target.value)}
            >
              <option value="">Elegir producto</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Compra (unidades)" htmlFor="promo-buy">
              <AdminInput
                id="promo-buy"
                value={promoBuy}
                onChange={(e) => setPromoBuy(e.target.value)}
                inputMode="numeric"
                placeholder="2"
              />
            </AdminField>
            <AdminField label="Paga (unidades)" htmlFor="promo-pay">
              <AdminInput
                id="promo-pay"
                value={promoPay}
                onChange={(e) => setPromoPay(e.target.value)}
                inputMode="numeric"
                placeholder="1"
              />
            </AdminField>
          </div>
          <AdminField label="Nota interna (opcional)" htmlFor="promo-notes">
            <AdminInput
              id="promo-notes"
              value={promoNotes}
              onChange={(e) => setPromoNotes(e.target.value)}
              placeholder="Ej. Campaña marzo"
            />
          </AdminField>
        </form>
      </AdminModal>
    </div>
  )
}
