import { useCatalog } from '@/features/catalog/model/catalog-store'
import { ProductCarousel } from '@/features/catalog/ui/ProductCarousel'
import { cn } from '@/shared/lib'
import { useEffect, useMemo, useState } from 'react'

/**
 * Productos en tendencia: pills por categoría + carrusel.
 * Prioriza `trending`; si no hay, ordena por rating / reseñas (mocks o DB).
 */
export function TrendingProducts() {
  const { products, categories, live } = useCatalog()

  const scored = useMemo(() => {
    const visible = products.filter((p) => p.visible !== false)
    const marked = visible.filter((p) => p.trending)
    const pool = marked.length
      ? marked.slice().sort(
          (a, b) =>
            (a.trendingSort ?? 0) - (b.trendingSort ?? 0) ||
            b.rating - a.rating ||
            (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
        )
      : visible
          .slice()
          .sort(
            (a, b) =>
              b.rating * Math.log((b.reviewCount ?? 0) + 1) -
                a.rating * Math.log((a.reviewCount ?? 0) + 1) ||
              b.rating - a.rating,
          )
    return pool
  }, [products])

  const tabs = useMemo(() => {
    const slugs = new Set(scored.map((p) => p.category))
    return categories
      .filter((c) => !c.parentId && c.visible !== false && slugs.has(c.slug))
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [categories, scored])

  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!tabs.length) {
      setActiveSlug(undefined)
      return
    }
    if (!activeSlug || !tabs.some((t) => t.slug === activeSlug)) {
      setActiveSlug(tabs[0].slug)
    }
  }, [tabs, activeSlug])

  const safeSlug = tabs.some((t) => t.slug === activeSlug)
    ? activeSlug
    : tabs[0]?.slug

  const list = useMemo(() => {
    if (!safeSlug) return scored.slice(0, 12)
    return scored.filter((p) => p.category === safeSlug).slice(0, 12)
  }, [scored, safeSlug])

  if (!list.length && live) return null
  if (!list.length) return null

  return (
    <section>
      {tabs.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2 sm:mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              type="button"
              onClick={() => setActiveSlug(tab.slug)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase transition',
                safeSlug === tab.slug
                  ? 'bg-rosver-red text-white'
                  : 'bg-rosver-soft text-rosver-muted hover:text-rosver-ink',
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      ) : null}
      <ProductCarousel
        products={list}
        title="Productos en tendencia"
        subtitle="Lo que más rotan ferreterías y distribuidores."
        actionTo={safeSlug ? `/catalogo/${safeSlug}` : '/catalogo'}
      />
    </section>
  )
}
