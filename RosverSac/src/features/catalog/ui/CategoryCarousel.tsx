import type { Category } from '@/features/catalog/model/mocks'
import { CategoryHomeCard } from '@/features/catalog/ui/CategoryHomeCard'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { cn } from '@/shared/lib'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'

const AUTOPLAY_MS = 5200

function homeCategories(categories: Category[]) {
  const roots = categories
    .filter((c) => c.visible !== false)
    .filter((c) => !c.parentId)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const pinned = roots.filter((c) => c.showOnHome === true)
  // Si el admin solo marcó 1–2, el carrusel se ve vacío/roto → completar con el resto.
  if (pinned.length >= 3) return pinned
  if (pinned.length === 0) return roots
  const rest = roots.filter((c) => !pinned.some((p) => p.id === c.id))
  return [...pinned, ...rest]
}

/**
 * «Busca por categoría» — carrusel lifestyle (referencia Katrina → Rosver).
 */
export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const items = homeCategories(categories)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [active, setActive] = useState(0)
  const reduceMotion = prefersReducedMotion()
  const showNav = items.length > 1

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
    setActive((i) => {
      const n = items.length
      if (!n) return 0
      return (i + dir + n) % n
    })
  }

  useEffect(() => {
    if (reduceMotion || paused || items.length < 3) return
    const timer = setInterval(() => scrollByCard(1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [reduceMotion, paused, items.length])

  if (!items.length) return null

  return (
    <section aria-label="Busca por categoría" className="relative min-w-0">
      <div className="mb-8 flex items-end justify-between gap-3 sm:mb-10">
        <div
          className={cn(
            'min-w-0 flex-1',
            items.length <= 2 ? 'text-center' : 'text-center sm:text-left',
          )}
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl">
            Busca por categoría
            <span className="text-rosver-red">.</span>
          </h2>
          <p
            className={cn(
              'mt-3 max-w-lg text-sm text-rosver-muted sm:text-base',
              items.length <= 2 ? 'mx-auto' : 'mx-auto sm:mx-0',
            )}
          >
            Encuentra rápido lo que buscas, organizado para tu negocio.
          </p>
        </div>
        {showNav ? (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <NavBtn label="Anterior" onClick={() => scrollByCard(-1)} flip />
            <NavBtn label="Siguiente" onClick={() => scrollByCard(1)} />
          </div>
        ) : null}
      </div>

      <div className="relative">
        {showNav ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between sm:hidden">
            <NavBtn
              label="Anterior"
              onClick={() => scrollByCard(-1)}
              flip
              className="pointer-events-auto ml-0.5 shadow-md"
            />
            <NavBtn
              label="Siguiente"
              onClick={() => scrollByCard(1)}
              className="pointer-events-auto mr-0.5 shadow-md"
            />
          </div>
        ) : null}

        <div
          ref={scrollerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className={cn(
            'hide-scrollbar flex gap-4 overflow-x-auto overflow-y-visible py-3 snap-x snap-mandatory sm:gap-5 sm:py-4',
            // Espacio para que ring/sombra no se corten con el overflow del layout
            'px-3 sm:px-2',
            items.length <= 3 && 'justify-center',
          )}
        >
          {items.map((category, i) => (
            <CategoryHomeCard
              key={category.id}
              category={category}
              toneIndex={i}
              highlighted={i === active || items.length === 1}
              className={cn(
                'shrink-0 snap-start',
                items.length === 1
                  ? 'w-[min(82vw,20rem)] sm:w-[19rem] lg:w-[20rem]'
                  : 'w-[min(70vw,16rem)] sm:w-[15.5rem] md:w-[16.25rem] lg:w-[17rem]',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function NavBtn({
  label,
  onClick,
  flip,
  className,
}: {
  label: string
  onClick: () => void
  flip?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex size-10 items-center justify-center rounded-full border border-rosver-line bg-white text-rosver-ink transition hover:border-rosver-red hover:text-rosver-red sm:size-11',
        className,
      )}
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
