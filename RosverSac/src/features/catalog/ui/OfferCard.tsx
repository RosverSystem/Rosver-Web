import type { Product } from '@/features/catalog/model/mocks'
import {
  discountPercent,
  offerCampaignTag,
  offerSavings,
} from '@/features/catalog/model/offers'
import { ProductImage } from '@/features/catalog/ui/ProductImage'
import { useCart } from '@/features/cart'
import { WHATSAPP_NUMBER } from '@/shared/lib'
import { IconWhatsApp } from '@/shared/ui/icons'
import { Link } from 'react-router-dom'

/**
 * Card oferta: paleta completa (soft / ink / muted / line) — rojo solo como acento.
 */
export function OfferCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const savings = offerSavings(product)
  const pct = discountPercent(product)
  const tag = offerCampaignTag(product)
  const price = product.price
  const original = product.originalPrice

  if (price == null || original == null) return null

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola Rosver, me interesa la oferta:\n• ${product.name}\n• SKU: ${product.sku}\n• Precio oferta: S/ ${price.toFixed(2)} (antes S/ ${original.toFixed(2)})`,
  )}`

  const defaultPack = product.packagings?.find((p) => p.isDefault) ?? product.packagings?.[0]

  function onAdd() {
    if (defaultPack) {
      addItem({
        productSlug: product.slug,
        quantity: 1,
        packagingId: defaultPack.id,
        packagingLabel: defaultPack.label,
        unitPrice: price,
      })
    } else {
      addItem(product.slug, 1)
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-rosver-line bg-white p-3 shadow-[0_12px_28px_-22px_rgba(17,17,17,0.35)] transition hover:border-rosver-ink/25 hover:shadow-[0_16px_36px_-20px_rgba(17,17,17,0.4)] sm:flex-row sm:items-stretch sm:p-4">
      <Link
        to={`/producto/${product.slug}`}
        className="relative mx-auto w-full max-w-[11rem] shrink-0 sm:mx-0 sm:w-[9.5rem] lg:w-[10.5rem]"
        aria-label={`Ver ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-rosver-line bg-rosver-soft shadow-[3px_3px_0_0_var(--color-rosver-ink)]">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="size-full"
            iconSize={36}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-rosver-ink/85 via-rosver-ink/30 to-transparent px-2 pb-2 pt-8"
            aria-hidden
          >
            <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-black tracking-wide text-rosver-ink uppercase">
              Combo
            </span>
            {pct > 0 ? (
              <span className="rounded bg-rosver-ink px-1.5 py-0.5 text-[9px] font-black text-white">
                −{pct}%
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex max-w-[70%] rounded-md bg-rosver-yellow px-2 py-1 text-[10px] font-black tracking-wide text-rosver-ink uppercase sm:text-[11px]">
            {tag}
          </span>
          <span className="shrink-0 text-xs font-semibold text-rosver-muted sm:text-sm">
            Ahorra{' '}
            <span className="font-bold text-rosver-ink">
              S/ {savings.toFixed(2)}
            </span>
          </span>
        </div>

        <Link
          to={`/producto/${product.slug}`}
          className="mt-2.5 font-display text-base font-bold tracking-tight text-rosver-ink uppercase transition hover:text-rosver-red sm:text-lg"
        >
          {product.name}
        </Link>

        <p className="mt-1 text-xs text-rosver-muted">
          SKU lote: {product.sku}
          {pct > 0 ? ` · −${pct}%` : ''}
        </p>

        <p className="mt-2 line-clamp-2 text-sm leading-snug text-rosver-muted">
          {product.description}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-rosver-muted line-through">
              Normal: S/ {original.toFixed(2)}
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-rosver-ink">
                S/ {price.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-rosver-muted">
                Inc. IGV
              </span>
            </p>
          </div>

          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-rosver-red px-4 text-xs font-bold tracking-wide text-white uppercase transition hover:bg-rosver-red-dark sm:flex-none sm:px-5"
            >
              Añadir al carrito
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar ${product.name} por WhatsApp`}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:bg-[#20bd5a]"
            >
              <IconWhatsApp className="size-5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
