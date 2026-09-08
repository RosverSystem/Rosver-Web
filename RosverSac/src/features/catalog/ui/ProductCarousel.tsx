import type { Product } from '@/features/catalog/model/mocks'
import { ProductCard } from '@/features/catalog/ui/ProductCard'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTOPLAY_MS = 5000

/**
 * Carrusel horizontal de productos (Top picks) con flechas + autoplay.
 */
export function ProductCarousel({
  products,
  title = 'Destacados para ti',
  subtitle,
  actionTo = '/catalogo',
  actionLabel = 'Ver catálogo',
}: {
  products: Product[]
  title?: string
  subtitle?: string
  actionTo?: string
  actionLabel?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const reduceMotion = prefersReducedMotion()

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-product-slide]')
    if (!card) return
    const step = card.offsetWidth + 16
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    if (next > max - 4) next = 0
    if (next < 0) next = max
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  useEffect(() => {
    if (reduceMotion || paused || products.length < 3) return
    const timer = setInterval(() => scrollByCard(1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [reduceMotion, paused, products.length])

  if (!products.length) return null

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-rosver-red uppercase">
            Top picks
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-rosver-ink uppercase sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-rosver-muted">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={actionTo}
            className="mr-1 hidden text-sm font-bold text-rosver-red sm:inline hover:text-rosver-red-dark"
          >
            {actionLabel} →
          </Link>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollByCard(-1)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line bg-white transition hover:border-rosver-red hover:text-rosver-red"
          >
            <ArrowRight
              size={18}
              color="currentColor"
              strokeWidth={2}
              className="rotate-180"
            />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollByCard(1)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line bg-white transition hover:border-rosver-red hover:text-rosver-red"
          >
            <ArrowRight size={18} color="currentColor" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="hide-scrollbar flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-product-slide
            className="w-[11.5rem] shrink-0 snap-start sm:w-[14rem] lg:w-[15.5rem]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
