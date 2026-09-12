import type { OfferCombo } from '@/features/catalog/model/offer-combo'
import { ProductImage } from '@/features/catalog/ui/ProductImage'
import { ProductRatingStars } from '@/features/catalog/ui/ProductRatingStars'
import { useCart, addInputFromCombo, makeLineKey } from '@/features/cart'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { buildWhatsAppLink } from '@/shared/lib'
import { IconWhatsApp } from '@/shared/ui/icons'
import { Link } from 'react-router-dom'

/**
 * Card combo oferta: badge tipo, ítems con estrellas, precio, límite, CTA.
 */
export function OfferCard({ combo }: { combo: OfferCombo }) {
  const { addItem, lines } = useCart()
  const { showSuccess, showErrors } = useFormToasts()
  const price = combo.displayPrice
  const original = combo.compareAt
  const savings =
    price != null && original != null && original > price
      ? original - price
      : 0
  const pct =
    price != null && original != null && original > 0 && original > price
      ? Math.round(((original - price) / original) * 100)
      : 0

  const badge = combo.badge || 'Combo'

  const imageSrc =
    combo.imageUrl || combo.items.find((i) => i.imageUrl)?.imageUrl

  const itemsLabel = combo.items
    .map((it) => `${it.quantity}× ${it.productName}`)
    .join(' · ')

  const waMessage = [
    'Hola Rosver, me interesa el combo:',
    `• ${combo.name}`,
    `• SKU: ${combo.sku}`,
    price != null ? `• Precio: S/ ${price.toFixed(2)}` : null,
    itemsLabel ? `• Incluye: ${itemsLabel}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const cartQty =
    lines.find(
      (l) =>
        makeLineKey(l) ===
        makeLineKey({
          lineKind: 'combo',
          productSlug: combo.slug,
          comboId: combo.id,
        }),
    )?.quantity ?? 0
  const max = combo.maxPerUser
  const atLimit = max != null && cartQty >= max

  function onAdd() {
    if (price == null) return
    if (atLimit) {
      showErrors({
        limit: `Máximo ${max} de este combo por usuario. Ya tienes ${cartQty} en el carrito.`,
      })
      return
    }
    addItem(addInputFromCombo(combo, 1))
    showSuccess(['Combo agregado al carrito'])
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-rosver-line bg-white p-3 shadow-[0_12px_28px_-22px_rgba(17,17,17,0.35)] transition hover:border-rosver-ink/25 hover:shadow-[0_16px_36px_-20px_rgba(17,17,17,0.4)] sm:flex-row sm:items-stretch sm:p-4">
      <div className="relative mx-auto w-full max-w-[11rem] shrink-0 sm:mx-0 sm:w-[9.5rem] lg:w-[10.5rem]">
        <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-rosver-line bg-rosver-soft shadow-[3px_3px_0_0_var(--color-rosver-ink)]">
          <ProductImage
            src={imageSrc}
            alt={combo.name}
            className="size-full"
            iconSize={36}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-rosver-ink/85 via-rosver-ink/30 to-transparent px-2 pb-2 pt-8"
            aria-hidden
          >
            <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-black tracking-wide text-rosver-ink uppercase">
              {badge}
            </span>
            {pct > 0 ? (
              <span className="rounded bg-rosver-ink px-1.5 py-0.5 text-[9px] font-black text-white">
                −{pct}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex max-w-[70%] rounded-md bg-rosver-yellow px-2 py-1 text-[10px] font-black tracking-wide text-rosver-ink uppercase sm:text-[11px]">
            Pack oferta
          </span>
          {savings > 0 ? (
            <span className="shrink-0 text-xs font-semibold text-rosver-muted sm:text-sm">
              Ahorra{' '}
              <span className="font-bold text-rosver-ink">
                S/ {savings.toFixed(2)}
              </span>
            </span>
          ) : null}
        </div>

        <h2 className="mt-2.5 font-display text-base font-bold tracking-tight text-rosver-ink uppercase sm:text-lg">
          {combo.name}
        </h2>

        {(combo.rating != null && combo.rating > 0) ||
        (combo.reviewCount != null && combo.reviewCount > 0) ? (
          <ProductRatingStars
            rating={combo.rating ?? 0}
            reviewCount={combo.reviewCount ?? 0}
            className="mt-1.5"
          />
        ) : null}

        <p className="mt-1 text-xs text-rosver-muted">
          SKU combo: {combo.sku}
          {combo.items.length
            ? ` · ${combo.items.length} producto${combo.items.length === 1 ? '' : 's'}`
            : ''}
          {max != null ? ` · máx. ${max} por usuario` : ''}
        </p>

        {combo.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-snug text-rosver-muted">
            {combo.description}
          </p>
        ) : null}

        <ul className="mt-2 space-y-1.5">
          {combo.items.slice(0, 4).map((it) => (
            <li
              key={`${it.productId}-${it.packagingId ?? 'd'}`}
              className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-rosver-muted"
            >
              <Link
                to={`/producto/${it.productSlug}`}
                className="font-semibold text-rosver-ink hover:text-rosver-red"
              >
                <span className="text-rosver-ink">{it.quantity}×</span>{' '}
                {it.productName}
              </Link>
              <ProductRatingStars
                rating={it.rating ?? 0}
                reviewCount={it.reviewCount ?? 0}
                className="shrink-0"
              />
            </li>
          ))}
          {combo.items.length > 4 ? (
            <li className="text-xs text-rosver-muted">
              +{combo.items.length - 4} más
            </li>
          ) : null}
        </ul>

        <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {original != null && price != null && original > price ? (
              <p className="text-xs text-rosver-muted line-through">
                Separado: S/ {original.toFixed(2)}
              </p>
            ) : null}
            <p className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
              {price != null ? (
                <>
                  <span className="font-display text-2xl font-bold text-rosver-ink">
                    S/ {price.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-rosver-muted">
                    Inc. IGV · pack
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-rosver-muted">
                  Consultar precio
                </span>
              )}
            </p>
          </div>

          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={onAdd}
              disabled={price == null || atLimit}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-rosver-red px-4 text-xs font-bold tracking-wide text-white uppercase transition hover:bg-rosver-red-dark disabled:opacity-50 sm:flex-none sm:px-5"
            >
              {atLimit ? 'Límite alcanzado' : 'Agregar combo'}
            </button>
            <a
              href="https://wa.me/51980202591"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar ${combo.name} por WhatsApp`}
              onClick={(e) => {
                e.currentTarget.href = buildWhatsAppLink(waMessage)
              }}
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
