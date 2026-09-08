import type { Category } from '@/features/catalog/model/mocks'
import { CategoryHomeCard } from '@/features/catalog/ui/CategoryHomeCard'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'

const AUTOPLAY_MS = 5000

/**
 * Categorías tipo landing: cards suaves, CTA rojo uniforme,
 * carrusel con flechas (sin barra de scroll visible).
 * Datos: categorías principales con showOnHome (DB o mocks).
 */
export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const items = categories
    .filter((c) => c.visible !== false)
    .filter((c) => !c.parentId)
    .filter((c) => c.showOnHome === true)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const reduceMotion = prefersReducedMotion()

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-cat-card]')
    if (!card) return
    const styles = getComputedStyle(el)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '20') || 20
    const step = card.offsetWidth + gap
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    if (next > max - 4) next = 0
    if (next < 0) next = max
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  useEffect(() => {
    if (reduceMotion || paused || items.length < 2) return
    const timer = setInterval(() => scrollByCard(1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [reduceMotion, paused, items.length])

  if (!items.length) return null

  return (
    <section aria-label="Categorías destacadas" className="relative min-w-0 overflow-x-hidden">
      <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-rosver-red uppercase">
            Catálogo
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
            Explora por categoría
          </h2>
          <p className="mt-2 max-w-lg text-sm text-rosver-muted">
            Rubros de importación con stock para ferreterías, distribuidores y proyectos.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CarouselNavButton
            label="Anterior"
            onClick={() => scrollByCard(-1)}
            flip
          />
          <CarouselNavButton label="Siguiente" onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="hide-scrollbar flex gap-5 overflow-x-auto pb-1 snap-x snap-mandatory sm:gap-6"
      >
        {items.map((category, i) => (
          <CategoryHomeCard
            key={category.id}
            category={category}
            toneIndex={i}
            className="w-[min(85vw,18.5rem)] shrink-0 snap-start sm:w-[22rem] sm:max-w-none"
          />
        ))}
      </div>
    </section>
  )
}

function CarouselNavButton({
  label,
  onClick,
  flip,
}: {
  label: string
  onClick: () => void
  flip?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line bg-white text-rosver-ink shadow-sm transition hover:border-rosver-red hover:text-rosver-red"
    >
      <ArrowRight
        size={18}
        color="currentColor"
        strokeWidth={2}
        className={flip ? 'rotate-180' : undefined}
      />
    </button>
  )
}
