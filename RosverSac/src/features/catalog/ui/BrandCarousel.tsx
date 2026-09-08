import type { Brand } from '@/features/catalog/model/brands'
import { useCatalog } from '@/features/catalog/model/catalog-store'
import { cn } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { Link } from 'react-router-dom'

/**
 * Franja de marcas bajo el hero: sin tarjeta ni cajas por logo.
 * Label fijo a la izquierda + marquee (como referencia “tecnologías”).
 * Datos: marcas visibles desde DB (o mocks si aún no hay).
 */
export function BrandCarousel() {
  const { brands: catalogBrands } = useCatalog()
  const brands = catalogBrands
    .filter((b) => b.visible !== false && b.showOnHome !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (!brands.length) return null

  const reduceMotion = prefersReducedMotion()
  const loop = [...brands, ...brands]

  return (
    <section
      className="relative overflow-hidden border-y border-rosver-ink/15 bg-white"
      aria-label="Marcas que importamos"
    >
      <div className="mx-auto flex w-full max-w-7xl items-stretch gap-4 px-4 sm:gap-6 lg:px-6">
        <div className="flex shrink-0 flex-col justify-center py-4 text-rosver-red sm:py-5">
          <p className="font-display text-[11px] leading-tight font-bold tracking-[0.12em] uppercase sm:text-xs">
            Marcas
            <br />
            que importamos
          </p>
          <ArrowRight
            size={16}
            color="currentColor"
            strokeWidth={2}
            className="mt-1.5"
          />
        </div>

        <div className="group relative min-w-0 flex-1 overflow-hidden py-4 sm:py-5">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-white to-transparent sm:w-12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
            aria-hidden
          />

          <div
            className={cn(
              'flex w-max max-w-none items-center gap-8 sm:gap-12',
              !reduceMotion &&
                'animate-[brand-marquee_32s_linear_infinite] group-hover:[animation-play-state:paused]',
            )}
          >
            {loop.map((brand, i) => (
              <BrandItem
                key={`${brand.id}-${i}`}
                brand={brand}
                ariaHidden={i >= brands.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function BrandItem({
  brand,
  ariaHidden,
}: {
  brand: Brand
  ariaHidden?: boolean
}) {
  const content = brand.logoUrl ? (
    <img
      src={brand.logoUrl}
      alt={ariaHidden ? '' : brand.name}
      width={120}
      height={40}
      loading="lazy"
      decoding="async"
      className="h-7 w-auto max-w-[110px] object-contain opacity-55 grayscale transition duration-300 group-hover/item:opacity-100 group-hover/item:grayscale-0 sm:h-8"
    />
  ) : (
    <span className="font-display text-sm font-bold tracking-wide text-rosver-ink/45 uppercase transition duration-300 group-hover/item:text-rosver-ink sm:text-base">
      {brand.name}
    </span>
  )

  const className =
    'group/item flex shrink-0 items-center justify-center whitespace-nowrap'

  if (brand.href) {
    return (
      <Link
        to={brand.href}
        className={className}
        tabIndex={ariaHidden ? -1 : undefined}
        aria-hidden={ariaHidden || undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={className} aria-hidden={ariaHidden || undefined}>
      {content}
    </div>
  )
}
