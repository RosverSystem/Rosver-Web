import { CATEGORIES, PRODUCTS } from '@/features/catalog/model/mocks'
import { ProductCarousel } from '@/features/catalog/ui/ProductCarousel'
import { cn } from '@/shared/lib'
import { useState } from 'react'

const categorySlugsWithProducts = Array.from(new Set(PRODUCTS.map((p) => p.category)))
const TABS = CATEGORIES.filter((c) => categorySlugsWithProducts.includes(c.slug))

export function TrendingProducts() {
  const [activeSlug, setActiveSlug] = useState(TABS[0]?.slug)
  const products = PRODUCTS.filter((p) => p.category === activeSlug)

  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2 sm:mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveSlug(tab.slug)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase transition',
              activeSlug === tab.slug
                ? 'bg-rosver-red text-white'
                : 'bg-rosver-soft text-rosver-muted hover:text-rosver-ink',
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <ProductCarousel
        products={products}
        title="Productos en tendencia"
        subtitle="Lo que más rotan ferreterías y distribuidores."
        actionTo={activeSlug ? `/catalogo/${activeSlug}` : '/catalogo'}
      />
    </section>
  )
}
