import { getGuestRatingKey } from '@/features/catalog/lib/guest-rating-key'
import { trackProductView } from '@/features/catalog/lib/product-analytics-client'
import {
  fetchMyProductRating,
  submitProductRatingApi,
  updateProductRatingCommentApi,
} from '@/features/catalog/model/api-ratings'
import { useCatalog } from '@/features/catalog/model/catalog-store'
import { getWholesalePrice } from '@/features/catalog/model/mocks'
import { ProductCard } from '@/features/catalog/ui/ProductCard'
import { ProductImage } from '@/features/catalog/ui/ProductImage'
import { ProductRatingStars } from '@/features/catalog/ui/ProductRatingStars'
import { useCart, addInputFromProduct } from '@/features/cart'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ApiError } from '@/shared/lib/api'
import { buildWhatsAppLink, cn, formatInternalCode } from '@/shared/lib'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconBag, IconWhatsApp } from '@/shared/ui/icons'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

/**
 * Ficha de producto — imagen + info, presentaciones, specs, relacionados.
 */
export function ProductPage() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { toasts, showSuccess, showErrors, dismiss } = useFormToasts()
  const { products, categories, refresh } = useCatalog()
  const product = useMemo(
    () => products.find((p) => p.slug === slug) ?? products[0],
    [products, slug],
  )

  const packagings = product?.packagings ?? []
  const defaultPack =
    packagings.find((p) => p.isDefault) ?? packagings[0] ?? null
  const [packagingId, setPackagingId] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [myTitle, setMyTitle] = useState('')
  const [myBody, setMyBody] = useState('')
  const [canRate, setCanRate] = useState(true)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)

  useEffect(() => {
    setPackagingId(defaultPack?.id ?? null)
  }, [product?.slug, defaultPack?.id])

  useEffect(() => {
    if (!product?.slug) return
    setAvgRating(product.rating ?? 0)
    setReviewCount(product.reviewCount ?? 0)
    setMyRating(null)
    setCanRate(true)
    const guestKey = getGuestRatingKey()
    let cancelled = false
    void fetchMyProductRating(product.slug, guestKey)
      .then((res) => {
        if (cancelled) return
        setAvgRating(res.rating)
        setReviewCount(res.reviewCount)
        setMyRating(res.myRating)
        setMyTitle(res.myTitle ?? '')
        setMyBody(res.myBody ?? '')
        setCanRate(res.canRate)
      })
      .catch(() => {
        /* sin API: se puede intentar votar igual */
      })
    return () => {
      cancelled = true
    }
  }, [product?.slug, product?.rating, product?.reviewCount])

  useEffect(() => {
    if (!product?.slug) return
    trackProductView(product.slug)
  }, [product?.slug])

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-rosver-muted">
        Producto no encontrado.
      </main>
    )
  }

  const selectedPack =
    packagings.find((p) => p.id === packagingId) ?? defaultPack
  const displayPrice =
    selectedPack?.offerPrice ?? selectedPack?.listPrice ?? product.price
  const displayOriginal =
    selectedPack?.offerPrice != null
      ? (selectedPack.listPrice ?? selectedPack.compareAt ?? undefined)
      : (selectedPack?.compareAt ?? product.originalPrice)
  // Con presentaciones: solo mayorista real de la elegida (no inventar %).
  const wholesale =
    selectedPack?.wholesalePrice ??
    (packagings.length === 0 ? getWholesalePrice(product) : null)
  const category = categories.find((c) => c.slug === product.category)

  const discountPercent =
    displayOriginal && displayPrice !== null
      ? Math.round(100 - (displayPrice / displayOriginal) * 100)
      : null

  const related = products
    .filter(
      (p) =>
        p.slug !== product.slug &&
        p.visible !== false &&
        p.category === product.category,
    )
    .slice(0, 4)

  const relatedFallback =
    related.length >= 2
      ? related
      : products
          .filter((p) => p.slug !== product.slug && p.visible !== false)
          .slice(0, 4)

  const waMessage = `Hola Rosver, quiero cotizar:\n• ${product.name}\n• SKU: ${product.sku}\n• Marca: ${product.vendor}${
    selectedPack ? `\n• Presentación: ${selectedPack.label}` : ''
  }`

  const storeSpecs: { label: string; value: string }[] = [
    {
      label: 'Código interno',
      value:
        product.code != null && Number(product.code) >= 0
          ? formatInternalCode(product.code)
          : formatInternalCode(0),
    },
    { label: 'SKU', value: product.sku },
    { label: 'Marca', value: product.vendor },
    { label: 'Categoría', value: category?.name ?? product.category },
    { label: 'Origen', value: product.origin || '—' },
    { label: 'MOQ', value: String(product.moq) },
    {
      label: 'Precio',
      value:
        displayPrice != null ? `S/ ${displayPrice.toFixed(2)}` : 'Consultar',
    },
    ...(wholesale != null
      ? [{ label: 'Precio mayorista', value: `S/ ${wholesale.toFixed(2)}` }]
      : []),
  ]
  const techSpecs =
    product.specs?.map((s) => ({
      label: s.name,
      value: s.unit ? `${s.value} ${s.unit}` : s.value,
    })) ?? []

  function onAddToCart() {
    addItem(
      addInputFromProduct(product, 1, selectedPack?.id),
    )
    showSuccess(['Agregado al carrito'])
  }

  async function onSaveReview() {
    if (!product?.slug || reviewBusy) return
    setReviewBusy(true)
    try {
      await updateProductRatingCommentApi(product.slug, getGuestRatingKey(), {
        title: myTitle.trim() || undefined,
        body: myBody.trim() || undefined,
      })
      showSuccess(['Reseña guardada.'])
      setReviewOpen(false)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo guardar la reseña.'
      showErrors([msg])
    } finally {
      setReviewBusy(false)
    }
  }

  async function onRate(stars: number) {
    if (!product?.slug || ratingBusy || !canRate) return
    setRatingBusy(true)
    try {
      const res = await submitProductRatingApi(
        product.slug,
        stars,
        getGuestRatingKey(),
      )
      setMyRating(res.myRating)
      setAvgRating(res.rating)
      setReviewCount(res.reviewCount)
      setCanRate(false)
      setReviewOpen(true)
      showSuccess(['¡Gracias por calificar! Puedes añadir un comentario.'])
      void refresh()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No se pudo guardar la calificación.'
      showErrors([msg])
      if (err instanceof ApiError && err.status === 409) {
        setCanRate(false)
        void fetchMyProductRating(product.slug, getGuestRatingKey())
          .then((res) => {
            setMyRating(res.myRating)
            setAvgRating(res.rating)
            setReviewCount(res.reviewCount)
            setCanRate(res.canRate)
          })
          .catch(() => {})
      }
    } finally {
      setRatingBusy(false)
    }
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 overflow-x-hidden px-4 pb-28 lg:px-6">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <nav
        className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-rosver-muted"
        aria-label="Ruta de navegación"
      >
        <Link to="/" className="hover:text-rosver-red">
          Inicio
        </Link>
        <span aria-hidden>/</span>
        <Link to="/catalogo" className="hover:text-rosver-red">
          Catálogo
        </Link>
        {category ? (
          <>
            <span aria-hidden>/</span>
            <Link
              to={`/catalogo/${category.slug}`}
              className="hover:text-rosver-red"
            >
              {category.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="line-clamp-1 font-semibold text-rosver-ink">
          {product.name}
        </span>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_14px_40px_-28px_rgba(17,17,17,0.4)]">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="relative border-b border-rosver-line bg-rosver-soft/40 p-4 sm:p-6 lg:border-r lg:border-b-0">
            <div className="relative overflow-hidden rounded-xl border border-rosver-line bg-white">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="aspect-square sm:aspect-[4/3]"
                iconSize={64}
                eager
              />
              <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
                {product.featured ? (
                  <span className="rounded-md bg-rosver-blue px-2.5 py-1 text-[10px] font-black tracking-wide text-white uppercase">
                    Destacado
                  </span>
                ) : null}
                {discountPercent ? (
                  <>
                    <span className="rounded-md bg-rosver-yellow px-2.5 py-1 text-[10px] font-black tracking-wide text-rosver-ink uppercase">
                      Oferta
                    </span>
                    <span className="rounded-md bg-rosver-red px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                      -{discountPercent}%
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:p-7 lg:p-8">
            <div>
              <p className="text-xs font-bold tracking-wide text-rosver-muted uppercase">
                {product.vendor}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-rosver-ink uppercase sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>
              <ProductRatingStars
                rating={avgRating}
                reviewCount={reviewCount}
                size="md"
                className="mt-2"
                interactive
                myRating={myRating}
                canRate={canRate}
                busy={ratingBusy}
                onRate={onRate}
              />
              <p className="mt-1 text-[11px] text-rosver-muted">
                {canRate
                  ? 'Toca las estrellas para calificar (una vez por producto). No hace falta registrarse.'
                  : myRating != null
                    ? (
                      <>
                        {'Ya calificaste este producto. '}
                        {!reviewOpen && (
                          <button
                            type="button"
                            onClick={() => setReviewOpen(true)}
                            className="font-semibold text-rosver-blue hover:text-rosver-red underline"
                          >
                            {myTitle || myBody ? 'Editar reseña' : 'Agregar reseña'}
                          </button>
                        )}
                      </>
                    )
                    : null}
              </p>
              {myRating != null && reviewOpen ? (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-rosver-line bg-rosver-soft p-3">
                  <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                    Tu reseña (opcional)
                  </p>
                  <input
                    type="text"
                    value={myTitle}
                    onChange={(e) => setMyTitle(e.target.value)}
                    maxLength={120}
                    placeholder="Título (ej. Excelente producto)"
                    className="w-full rounded-lg border border-rosver-line bg-white px-3 py-2 text-xs text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:border-rosver-red focus:ring-1 focus:ring-rosver-red/20"
                  />
                  <textarea
                    value={myBody}
                    onChange={(e) => setMyBody(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Cuéntanos tu experiencia…"
                    className="w-full resize-none rounded-lg border border-rosver-line bg-white px-3 py-2 text-xs text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:border-rosver-red focus:ring-1 focus:ring-rosver-red/20"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={reviewBusy}
                      onClick={() => void onSaveReview()}
                      className="rounded-full bg-rosver-red px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-50"
                    >
                      {reviewBusy ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      disabled={reviewBusy}
                      onClick={() => setReviewOpen(false)}
                      className="rounded-full border border-rosver-line px-4 py-1.5 text-[11px] font-bold text-rosver-muted transition hover:text-rosver-ink disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-rosver-muted sm:text-[15px]">
                {product.description || 'Sin descripción aún.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-rosver-muted">SKU: {product.sku}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rosver-success px-2.5 py-1 text-xs font-bold text-white">
                  En stock
                </span>
              </div>
            </div>

            {packagings.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-bold tracking-wide text-rosver-muted uppercase">
                  Precio por presentación
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {packagings.map((pk) => {
                    const active = pk.id === selectedPack?.id
                    const packPrice =
                      pk.offerPrice ?? pk.listPrice ?? null
                    const packCompare =
                      pk.offerPrice != null
                        ? (pk.listPrice ?? pk.compareAt)
                        : pk.compareAt
                    return (
                      <button
                        key={pk.id}
                        type="button"
                        onClick={() => setPackagingId(pk.id)}
                        aria-pressed={active}
                        className={`flex min-h-[4.5rem] flex-col items-start rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? 'border-rosver-red bg-rosver-red/10 ring-1 ring-rosver-red'
                            : 'border-rosver-line bg-white hover:border-rosver-red/40'
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            active ? 'text-rosver-red' : 'text-rosver-ink'
                          }`}
                        >
                          {pk.label || pk.unitName}
                        </span>
                        {pk.contentQty > 1 ? (
                          <span className="text-[11px] text-rosver-muted">
                            Contiene {pk.contentQty}
                          </span>
                        ) : null}
                        <span className="mt-auto pt-1 font-display text-lg font-bold text-rosver-ink">
                          {packPrice != null
                            ? `S/ ${packPrice.toFixed(2)}`
                            : 'Consultar'}
                        </span>
                        {packCompare != null &&
                        packPrice != null &&
                        packCompare > packPrice ? (
                          <span className="text-[11px] text-rosver-muted line-through">
                            S/ {packCompare.toFixed(2)}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div>
              {packagings.length === 0 ? (
                <>
                  {displayOriginal && displayPrice != null ? (
                    <p className="text-sm text-rosver-muted line-through">
                      S/ {displayOriginal.toFixed(2)}
                    </p>
                  ) : null}
                  <p className="font-display text-3xl font-bold text-rosver-ink sm:text-4xl">
                    {displayPrice != null
                      ? `S/ ${displayPrice.toFixed(2)}`
                      : 'Consultar'}
                  </p>
                </>
              ) : selectedPack ? (
                <p className="text-sm text-rosver-muted">
                  Elegiste{' '}
                  <span className="font-semibold text-rosver-ink">
                    {selectedPack.label || selectedPack.unitName}
                  </span>
                  {displayPrice != null
                    ? ` · S/ ${displayPrice.toFixed(2)}`
                    : ' · precio a consultar'}
                </p>
              ) : null}
              {wholesale != null ? (
                <div className="mt-3 rounded-xl bg-rosver-blue px-4 py-3 text-white">
                  <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
                    Precio por mayor
                    {selectedPack
                      ? ` · ${selectedPack.label || selectedPack.unitName}`
                      : ''}
                    {product.moq > 1 ? ` · MOQ ${product.moq}` : ''}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-bold">
                    S/ {wholesale.toFixed(2)}
                  </p>
                </div>
              ) : displayPrice == null && packagings.length === 0 ? (
                <p className="mt-2 text-sm text-rosver-muted">
                  Precio bajo cotización — escríbenos por WhatsApp.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={onAddToCart}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-rosver-red px-5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-rosver-red-dark sm:flex-none sm:min-w-[12rem]"
              >
                <IconBag className="size-4" />
                Agregar al carrito
              </button>
              <a
                href={`https://wa.me/51980202591`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.currentTarget.href = buildWhatsAppLink(waMessage)
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-[#20bd5a] sm:flex-none sm:min-w-[12rem]"
              >
                <IconWhatsApp className="size-5" />
                Cotizar por WhatsApp
              </a>
            </div>

            <p className="text-xs text-rosver-muted">
              Origen {product.origin || '—'}
              {category ? ` · ${category.name}` : ''} · Envíos a nivel nacional
            </p>
          </div>
        </div>
      </section>

      <section
        className={cn(
          'grid gap-4 lg:gap-6',
          techSpecs.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
        )}
      >
        <SpecBlock title="Especificaciones de tienda" rows={storeSpecs} />
        {techSpecs.length > 0 ? (
          <SpecBlock title="Especificaciones técnicas" rows={techSpecs} />
        ) : null}
      </section>

      {relatedFallback.length > 0 ? (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-rosver-ink uppercase sm:text-2xl">
              Productos relacionados
            </h2>
            <Link
              to={category ? `/catalogo/${category.slug}` : '/catalogo'}
              className="text-sm font-bold text-rosver-red hover:text-rosver-red-dark"
            >
              Ver más →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {relatedFallback.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-rosver-blue px-5 py-7 text-white sm:flex-row sm:items-center sm:px-8 sm:py-8">
        <div>
          <p className="font-display text-xl font-bold uppercase sm:text-2xl">
            ¿Listo para abastecer tu negocio?
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/70">
            Cotiza por volumen o arma tu lista en el carrito.
          </p>
        </div>
        <Link
          to="/cotizar"
          className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-rosver-red px-6 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
        >
          Solicitar cotización
          <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
        </Link>
      </section>
    </main>
  )
}

function SpecBlock({
  title,
  rows,
  empty,
}: {
  title: string
  rows: { label: string; value: string }[]
  empty?: string
}) {
  return (
    <div className="rounded-2xl border border-rosver-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-base font-bold text-rosver-ink uppercase sm:text-lg">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-rosver-muted">
          {empty ?? 'Sin datos.'}
        </p>
      ) : (
        <dl className="mt-4 overflow-hidden rounded-xl border border-rosver-line">
          {rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className={`grid grid-cols-2 gap-2 px-3.5 py-2.5 text-sm sm:px-4 ${
                i % 2 === 0 ? 'bg-rosver-soft/70' : 'bg-white'
              }`}
            >
              <dt className="font-semibold text-rosver-muted">{row.label}</dt>
              <dd className="text-right font-bold text-rosver-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
