import type { Category } from '@/features/catalog/model/mocks'
import { cn } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTOPLAY_MS = 5000

const CARD_TONES = [
  { bg: 'bg-[#fff1f0]', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
  { bg: 'bg-rosver-soft', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
  { bg: 'bg-[#f3efe8]', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
  { bg: 'bg-[#f0f2f5]', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
] as const

const CATEGORY_COPY: Record<string, { tagline: string; points: string[] }> = {
  herramientas: {
    tagline: 'Listas para obra y taller',
    points: ['Marcas de importación', 'Stock continuo', 'Asesoría técnica'],
  },
  ferreteria: {
    tagline: 'Insumos al por mayor',
    points: ['Precio por volumen', 'MOQ flexible', 'Despacho nacional'],
  },
  electronica: {
    tagline: 'Equipos y componentes',
    points: ['Garantía local', 'Modelos actuales', 'Soporte postventa'],
  },
  hogar: {
    tagline: 'Para retail y proyectos',
    points: ['Líneas rotativas', 'Calidad verificada', 'Entrega ágil'],
  },
  textil: {
    tagline: 'Textil industrial y retail',
    points: ['Volúmenes a medida', 'Variedad de SKU', 'Cotiza rápido'],
  },
  iluminacion: {
    tagline: 'LED y soluciones de luz',
    points: ['Eficiencia energética', 'Uso comercial', 'Stock en Lima'],
  },
  limpieza: {
    tagline: 'Mantenimiento industrial',
    points: ['Insumos profesionales', 'Rubros varios', 'Reposición fácil'],
  },
  construccion: {
    tagline: 'Materiales para obra',
    points: ['Proyectos y ferreterías', 'Importación directa', 'Acompañamiento'],
  },
}

/**
 * Categorías tipo landing: cards suaves, CTA rojo uniforme,
 * carrusel con flechas (sin barra de scroll visible).
 */
export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const items = categories
    .filter((c) => c.visible !== false)
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
          <FeatureCategoryCard
            key={category.id}
            category={category}
            tone={CARD_TONES[i % CARD_TONES.length]}
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

function FeatureCategoryCard({
  category,
  tone,
}: {
  category: Category
  tone: (typeof CARD_TONES)[number]
}) {
  const copy = CATEGORY_COPY[category.slug] ?? {
    tagline: 'Importaciones Rosver',
    points: ['Stock disponible', 'Cotiza sin compromiso', 'Despacho nacional'],
  }
  const Icon = category.icon

  return (
    <article
      data-cat-card
      className={cn(
        'relative flex w-[min(85vw,18.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] sm:w-[22rem]',
        tone.bg,
      )}
    >
      <div className="relative z-[1] flex flex-1 flex-col p-5 pb-3 sm:p-6">
        <p className={cn('text-[11px] font-bold tracking-wide uppercase', tone.accent)}>
          {copy.tagline}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-rosver-ink uppercase sm:text-2xl">
          {category.name}
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-rosver-ink/75">
          {copy.points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', tone.dot)} aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <Link
          to={`/catalogo/${category.slug}`}
          className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-rosver-red px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
        >
          Explorar
          <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
        </Link>
      </div>

      <div className="relative mx-4 mb-4 h-36 overflow-hidden rounded-2xl bg-white/40 sm:h-40">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt=""
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <Icon className="absolute inset-0 m-auto size-16 text-rosver-ink/15" />
        )}
      </div>
    </article>
  )
}
