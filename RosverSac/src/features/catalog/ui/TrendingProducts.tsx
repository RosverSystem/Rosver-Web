import { useCatalog } from '@/features/catalog/model/catalog-store'
import { ProductCarousel } from '@/features/catalog/ui/ProductCarousel'
import { cn } from '@/shared/lib'
import { useMemo, useState } from 'react'

export function TrendingProducts() {
  const { products, categories } = useCatalog()
  const tabs = useMemo(() => {
    const slugs = new Set(products.map((p) => p.category))
    return categories.filter((c) => slugs.has(c.slug))
  }, [products, categories])
  const [activeSlug, setActiveSlug] = useState(tabs[0]?.slug)
  const safeSlug = tabs.some((t) => t.slug === activeSlug)
    ? activeSlug
    : tabs[0]?.slug
  const list = products.filter((p) => p.category === safeSlug)

  return (
    <section>
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
      <ProductCarousel
        products={list}
        title="Productos en tendencia"
        subtitle="Lo que más rotan ferreterías y distribuidores."
        actionTo={safeSlug ? `/catalogo/${safeSlug}` : '/catalogo'}
      />
    </section>
  )
}
