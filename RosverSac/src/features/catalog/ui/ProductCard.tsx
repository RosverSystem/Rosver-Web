import type { Product } from '@/features/catalog/model/mocks'
import { getWholesalePrice } from '@/features/catalog/model/mocks'
import { ProductImage } from '@/features/catalog/ui/ProductImage'
import { useCart } from '@/features/cart'
import { IconBag } from '@/shared/ui/icons'
import { Link } from 'react-router-dom'

/**
 * Card de catálogo estilo marketplace: marca, SKU, precio, mayorista, CTA carrito.
 */
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()

  const discountPercent =
    product.originalPrice && product.price !== null
      ? Math.round(100 - (product.price / product.originalPrice) * 100)
      : null

  const wholesale = getWholesalePrice(product)
  const isOffer = Boolean(discountPercent && discountPercent > 0)
  const showFeatured = Boolean(product.featured) && !isOffer

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_10px_28px_-22px_rgba(17,17,17,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-rosver-ink/20 hover:shadow-[0_16px_36px_-18px_rgba(17,17,17,0.4)]">
      <div className="relative">
        <Link to={`/producto/${product.slug}`} className="block bg-rosver-soft/40">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square"
            imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {showFeatured ? (
              <span className="rounded-md bg-rosver-blue px-2 py-1 text-[10px] font-black tracking-wide text-white uppercase">
                Destacado
              </span>
            ) : null}
            {isOffer ? (
              <span className="rounded-md bg-rosver-yellow px-2 py-1 text-[10px] font-black tracking-wide text-rosver-ink uppercase">
                ¡Oferta!
              </span>
            ) : null}
            {product.price === null ? (
              <span className="rounded-md bg-rosver-ink px-2 py-1 text-[10px] font-black tracking-wide text-white uppercase">
                Cotizar
              </span>
            ) : null}
          </div>
          {discountPercent ? (
            <span className="rounded-md bg-rosver-red px-2 py-1 text-[10px] font-black text-white shadow-sm">
              −{discountPercent}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="truncate text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
          {product.vendor}
        </p>

        <Link
          to={`/producto/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm font-bold text-rosver-ink transition group-hover:text-rosver-red sm:text-[15px]"
        >
          {product.name}
        </Link>

        <p className="text-xs text-rosver-muted">SKU: {product.sku}</p>

        <div className="mt-auto space-y-1 pt-2">
          {product.price !== null ? (
            <>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-xl font-bold text-rosver-ink">
                  S/ {product.price.toFixed(2)}
                </span>
                {product.originalPrice ? (
                  <span className="text-xs text-rosver-muted line-through">
                    S/ {product.originalPrice.toFixed(2)}
                  </span>
                ) : null}
              </p>
              {wholesale != null ? (
                <p className="text-xs text-rosver-muted">
                  Mayorista:{' '}
                  <span className="font-bold text-rosver-red">
                    S/ {wholesale.toFixed(2)}
                  </span>
                  {product.moq > 1 ? (
                    <span className="text-rosver-muted"> · MOQ {product.moq}</span>
                  ) : null}
                </p>
              ) : null}
            </>
          ) : (
            <p className="font-display text-lg font-bold text-rosver-ink">
              Consultar
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => addItem(product.slug, 1)}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rosver-red px-3 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
        >
          <IconBag className="size-4" />
          Agregar al carrito
        </button>
      </div>
    </article>
  )
}
