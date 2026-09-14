import { useCatalog } from '@/features/catalog/model/catalog-store'
import { compareTrendProducts } from '@/features/catalog/lib/product-analytics-client'
import {
  getWholesalePrice,
  type Product,
} from '@/features/catalog/model/mocks'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { cn } from '@/shared/lib'
import { ArrowRight, Heart, StarGrow } from 'cssvg-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const TOP_COLORS = [
  'bg-rosver-red',
  'bg-rosver-blue',
  'bg-rosver-ink',
  'bg-rosver-muted',
] as const

/**
 * «Los más cotizados por mayoristas» — cards con precio x mayor (estilo Katrina → Rosver).
 */
export function TrendingProducts() {
  const { products, categories, live } = useCatalog()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const reduceMotion = prefersReducedMotion()

  const list = useMemo(() => {
    const visible = products.filter((p) => p.visible !== false)
    const marked = visible.filter((p) => p.trending)
    const pool = marked.length
      ? marked.slice().sort(
          (a, b) =>
            (a.trendingSort ?? 0) - (b.trendingSort ?? 0) ||
            compareTrendProducts(a, b),
        )
      : visible.slice().sort(compareTrendProducts)
    return pool.slice(0, 12)
  }, [products])

  const catName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.name]))
    return (slug: string) => map.get(slug) ?? slug
  }, [categories])

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-wholesale-card]')
    if (!card) return
    const step = card.offsetWidth + 16
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    if (next > max - 4) next = 0
    if (next < 0) next = max
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  useEffect(() => {
    if (reduceMotion || paused || list.length < 3) return
    const timer = setInterval(() => scrollByCard(1), 5500)
    return () => clearInterval(timer)
  }, [reduceMotion, paused, list.length])

  if (!list.length) {
    if (live) return null
    return null
  }

  return (
    <section aria-label="Más cotizados por mayoristas">
      <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rosver-red/10 px-3 py-1 text-[11px] font-bold tracking-wide text-rosver-red uppercase">
            <StarGrow size={14} color="currentColor" strokeWidth={2} />
            Tendencia mayorista
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
            Los más cotizados por mayoristas
          </h2>
          <p className="mt-1 max-w-xl text-sm text-rosver-muted">
            Productos de mayor rotación con márgenes recomendados para tu
            negocio.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <NavBtn label="Anterior" onClick={() => scrollByCard(-1)} flip />
          <NavBtn label="Siguiente" onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="hide-scrollbar flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory sm:gap-5"
      >
        {list.map((product, i) => (
          <WholesaleHotCard
            key={product.id}
            product={product}
            rank={i + 1}
            categoryLabel={catName(product.category)}
          />
        ))}
      </div>
    </section>
  )
}

function NavBtn({
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

function WholesaleHotCard({
  product,
  rank,
  categoryLabel,
}: {
  product: Product
  rank: number
  categoryLabel: string
}) {
  const wholesale = getWholesalePrice(product)
  const units = product.moq > 1 ? product.moq : 1
  const packs =
    product.packagings
      ?.slice(0, 2)
      .map((p) => p.unitName || p.label)
      .filter(Boolean)
      .join(' · ') || 'Unidad'
  const initials = product.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <article
      data-wholesale-card
      className="flex w-[min(85vw,17.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-rosver-line/80 bg-white shadow-[0_8px_28px_rgba(13,13,13,0.06)] sm:w-[18rem]"
    >
      <div className="relative aspect-[4/3] bg-rosver-soft">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-4xl font-black text-white/90"
            style={{
              background:
                'linear-gradient(145deg, #0D0D0D 0%, #1E3A5F 55%, #E30613 140%)',
            }}
          >
            {initials || 'RV'}
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide text-white uppercase',
            TOP_COLORS[(rank - 1) % TOP_COLORS.length],
          )}
        >
          #{rank} TOP
        </span>
        <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-rosver-ink shadow-sm">
          <Heart size={16} color="currentColor" strokeWidth={2} />
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-rosver-red shadow-sm">
          <StarGrow size={12} color="currentColor" strokeWidth={2} />
          Alta demanda
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-rosver-red/10 px-2.5 py-0.5 text-[10px] font-bold text-rosver-red">
            {categoryLabel}
          </span>
          <span className="truncate text-[10px] font-semibold tracking-wide text-rosver-muted uppercase">
            {product.sku}
          </span>
        </div>
        <h3 className="line-clamp-2 font-display text-base font-bold text-rosver-ink">
          {product.name}
        </h3>

        <div className="rounded-2xl bg-rosver-red/[0.07] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-wide uppercase">
            <span className="text-rosver-red">Precio x mayor</span>
            <span className="text-rosver-muted">Desde {units} unid.</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-rosver-red">
            {wholesale != null ? (
              <>
                S/ {wholesale.toFixed(2)}{' '}
                <span className="text-sm font-semibold text-rosver-muted">
                  / unid
                </span>
              </>
            ) : (
              <span className="text-base">Consultar</span>
            )}
          </p>
        </div>

        <p className="text-[11px] font-medium text-rosver-muted">{packs}</p>

        <Link
          to={`/producto/${product.slug}`}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full border border-rosver-ink bg-white px-4 text-sm font-bold text-rosver-ink transition hover:border-rosver-red hover:bg-rosver-red hover:text-white"
        >
          Ver escala & Cotizar →
        </Link>
      </div>
    </article>
  )
}
