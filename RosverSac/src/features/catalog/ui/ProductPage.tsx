import { useCatalog } from '@/features/catalog/model/catalog-store'
import { getWholesalePrice } from '@/features/catalog/model/mocks'
import { ProductCard } from '@/features/catalog/ui/ProductCard'
import { ProductImage } from '@/features/catalog/ui/ProductImage'
import { useCart } from '@/features/cart'
import { WHATSAPP_NUMBER } from '@/shared/lib'
import { IconBag, IconWhatsApp } from '@/shared/ui/icons'
import { ArrowRight } from 'cssvg-icons'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

/**
 * Ficha de producto — layout marketplace (imagen + info, specs, relacionados).
 */
export function ProductPage() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { products, categories } = useCatalog()
  const product = useMemo(
    () => products.find((p) => p.slug === slug) ?? products[0],
    [products, slug],
  )

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-rosver-muted">
        Producto no encontrado.
      </main>
    )
  }

  const category = categories.find((c) => c.slug === product.category)
  const wholesale = getWholesalePrice(product)

  const discountPercent =
    product.originalPrice && product.price !== null
      ? Math.round(100 - (product.price / product.originalPrice) * 100)
      : null

  const related = products.filter(
    (p) =>
      p.slug !== product.slug &&
      p.visible !== false &&
      p.category === product.category,
  ).slice(0, 4)

  const relatedFallback =
    related.length >= 2
      ? related
      : products.filter((p) => p.slug !== product.slug && p.visible !== false).slice(
          0,
          4,
        )

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola Rosver, quiero cotizar:\n• ${product.name}\n• SKU: ${product.sku}\n• Marca: ${product.vendor}`,
  )}`

  const specs: { label: string; value: string }[] = [
    { label: 'SKU', value: product.sku },
    { label: 'Marca', value: product.vendor },
    { label: 'Categoría', value: category?.name ?? product.category },
    { label: 'Origen', value: product.origin },
    { label: 'MOQ', value: String(product.moq) },
    {
      label: 'Precio lista',
      value:
        product.price != null ? `S/ ${product.price.toFixed(2)}` : 'Consultar',
    },
    ...(wholesale != null
      ? [{ label: 'Precio mayorista', value: `S/ ${wholesale.toFixed(2)}` }]
      : []),
    ...(product.originalPrice
      ? [
          {
            label: 'Precio anterior',
            value: `S/ ${product.originalPrice.toFixed(2)}`,
          },
        ]
      : []),
  ]

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 overflow-x-hidden px-4 pb-28 lg:px-6">
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

      {/* Hero producto */}
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
                      ¡Oferta!
                    </span>
                    <span className="rounded-md bg-rosver-red px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                      −{discountPercent}%
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

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-rosver-muted">SKU: {product.sku}</span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-rosver-success px-2.5 py-1 text-xs font-bold text-white"
                  title="Estado mock — fase visual"
                >
                  <span aria-hidden>●</span>
                  En stock
                </span>
              </div>
            </div>

            <div>
              {product.originalPrice && product.price != null ? (
                <p className="text-sm text-rosver-muted line-through">
                  S/ {product.originalPrice.toFixed(2)}
                </p>
              ) : null}
              <p className="font-display text-3xl font-bold text-rosver-ink sm:text-4xl">
                {product.price != null
                  ? `S/ ${product.price.toFixed(2)}`
                  : 'Consultar'}
              </p>
              {wholesale != null ? (
                <div className="mt-3 rounded-xl bg-rosver-blue px-4 py-3 text-white">
                  <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
                    Precio por mayor
                    {product.moq > 1 ? ` · MOQ ${product.moq}` : ''}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-bold">
                    S/ {wholesale.toFixed(2)}
                  </p>
                </div>
              ) : product.price == null ? (
                <p className="mt-2 text-sm text-rosver-muted">
                  Precio bajo cotización — escríbenos por WhatsApp.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => addItem(product.slug, 1)}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-rosver-red px-5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-rosver-red-dark sm:flex-none sm:min-w-[12rem]"
              >
                <IconBag className="size-4" />
                Agregar al carrito
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-[#20bd5a] sm:flex-none sm:min-w-[12rem]"
              >
                <IconWhatsApp className="size-5" />
                Cotizar por WhatsApp
              </a>
            </div>

            <p className="text-xs text-rosver-muted">
              Origen {product.origin}
              {category ? ` · ${category.name}` : ''} · Envíos a nivel nacional
            </p>
          </div>
        </div>
      </section>

      {/* Descripción + specs */}
      <section className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-2xl border border-rosver-line bg-white p-5 shadow-[0_10px_28px_-24px_rgba(17,17,17,0.35)] sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-rosver-ink uppercase sm:text-lg">
            <span className="h-5 w-1 rounded-full bg-rosver-red" aria-hidden />
            Descripción del producto
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-rosver-muted sm:text-[15px]">
            {product.description}
          </p>
        </div>

        <div className="rounded-2xl border border-rosver-line bg-white p-5 shadow-[0_10px_28px_-24px_rgba(17,17,17,0.35)] sm:p-6">
          <h2 className="font-display text-base font-bold text-rosver-ink uppercase sm:text-lg">
            Especificaciones técnicas
          </h2>
          <dl className="mt-4 overflow-hidden rounded-xl border border-rosver-line">
            {specs.map((row, i) => (
              <div
                key={row.label}
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
        </div>
      </section>

      {/* Relacionados */}
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

      {/* CTA B2B */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-rosver-blue px-5 py-7 text-white sm:flex-row sm:items-center sm:px-8 sm:py-8">
        <div>
          <p className="font-display text-xl font-bold uppercase sm:text-2xl">
            ¿Listo para abastecer tu negocio?
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/70">
            Cotiza por volumen o arma tu lista en el carrito. Comercial te
            responde en horario hábil.
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
