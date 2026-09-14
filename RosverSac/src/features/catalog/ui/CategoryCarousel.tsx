import type { Category } from '@/features/catalog/model/mocks'
import { CategoryHomeCard } from '@/features/catalog/ui/CategoryHomeCard'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'

const AUTOPLAY_MS = 5200

/**
 * «Busca por categoría» — carrusel lifestyle (referencia Katrina → Rosver).
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
  const [active, setActive] = useState(0)
  const reduceMotion = prefersReducedMotion()

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-cat-card]')
    if (!card) return
    const styles = getComputedStyle(el)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '16') || 16
    const step = card.offsetWidth + gap
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    if (next > max - 4) next = 0
    if (next < 0) next = max
    el.scrollTo({ left: next, behavior: 'smooth' })
    setActive((i) => {
      const n = items.length
      if (!n) return 0
      return (i + dir + n) % n
    })
  }

  useEffect(() => {
    if (reduceMotion || paused || items.length < 2) return
    const timer = setInterval(() => scrollByCard(1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [reduceMotion, paused, items.length])

  if (!items.length) return null

  return (
    <section
      aria-label="Busca por categoría"
      className="relative min-w-0 overflow-x-hidden"
    >
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl">
          Busca por categoría
          <span className="text-rosver-red">.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-rosver-muted sm:text-base">
          Encuentra rápido lo que buscas, organizado para tu negocio.
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => scrollByCard(-1)}
          className="absolute top-1/2 left-0 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-rosver-line bg-white/95 text-rosver-ink shadow-md transition hover:border-rosver-red hover:text-rosver-red sm:-left-2 sm:size-11 lg:-left-3"
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
          className="absolute top-1/2 right-0 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-rosver-line bg-white/95 text-rosver-ink shadow-md transition hover:border-rosver-red hover:text-rosver-red sm:-right-2 sm:size-11 lg:-right-3"
        >
          <ArrowRight size={18} color="currentColor" strokeWidth={2} />
        </button>

        <div
          ref={scrollerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="hide-scrollbar flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:gap-5"
        >
          {items.map((category, i) => (
            <CategoryHomeCard
              key={category.id}
              category={category}
              toneIndex={i}
              highlighted={i === active}
              className="w-[min(72vw,15rem)] shrink-0 snap-start sm:w-[16.5rem] lg:w-[17.5rem]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
