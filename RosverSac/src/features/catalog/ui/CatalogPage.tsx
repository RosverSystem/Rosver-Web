import { CatalogBanner } from '@/features/catalog/ui/CatalogBanner'
import { CatalogPagination } from '@/features/catalog/ui/CatalogPagination'
import {
  EMPTY_FILTERS,
  FiltersPanel,
  type CatalogFilterState,
} from '@/features/catalog/ui/FiltersPanel'
import { ProductGrid } from '@/features/catalog/ui/ProductGrid'
import { useCatalog } from '@/features/catalog/model/catalog-store'
import type { Product } from '@/features/catalog/model/mocks'
import { cn } from '@/shared/lib'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

const PAGE_SIZE = 18 // grilla 3 columnas × 6 filas

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name' | 'rating'

function applyFilters(
  products: Product[],
  filters: CatalogFilterState,
): Product[] {
  return products.filter((p) => {
    if (filters.onSale && !p.originalPrice) return false
    if (filters.withPrice && p.price === null) return false
    if (filters.quoteOnly && p.price !== null) return false
    if (filters.minRating != null && p.rating < filters.minRating) return false
    if (filters.vendors.length && !filters.vendors.includes(p.vendor)) return false
    return true
  })
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = products.slice()
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9))
    case 'price-desc':
      return list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    case 'rating':
      return list.sort((a, b) => b.rating - a.rating)
    default:
      return list
  }
}

export function CatalogPage() {
  const { categorySlug } = useParams()
  const { products, categories } = useCatalog()
  const category = categories.find((c) => c.slug === categorySlug)

  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('featured')
  const [page, setPage] = useState(1)

  const visibleProducts = useMemo(
    () => products.filter((p) => p.visible !== false),
    [products],
  )

  const productCountBySlug = useMemo(
    () =>
      categories.reduce<Record<string, number>>((acc, c) => {
        acc[c.slug] = visibleProducts.filter((p) => p.category === c.slug).length
        return acc
      }, {}),
    [categories, visibleProducts],
  )

  const vendors = useMemo(
    () =>
      Array.from(new Set(visibleProducts.map((p) => p.vendor))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [visibleProducts],
  )

  const filtered = useMemo(() => {
    const byCategory = categorySlug
      ? visibleProducts.filter((p) => p.category === categorySlug)
      : visibleProducts
    return sortProducts(applyFilters(byCategory, filters), sort)
  }, [visibleProducts, categorySlug, filters, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageProducts = filtered.slice(start, start + PAGE_SIZE)
  const showingFrom = filtered.length ? start + 1 : 0
  const showingTo = Math.min(start + PAGE_SIZE, filtered.length)

  useEffect(() => {
    setPage(1)
  }, [categorySlug, filters, sort])

  const goToPage = (next: number) => {
    setPage(next)
    const el = document.getElementById('catalogo-resultados')
    if (!el) return
    // Tras el re-render de la grilla, subir al inicio del listado
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const chips: { key: string; label: string; clear: () => void }[] = []
  if (filters.onSale) {
    chips.push({
      key: 'sale',
      label: 'En oferta',
      clear: () => setFilters((f) => ({ ...f, onSale: false })),
    })
  }
  if (filters.withPrice) {
    chips.push({
      key: 'price',
      label: 'Con precio',
      clear: () => setFilters((f) => ({ ...f, withPrice: false })),
    })
  }
  if (filters.quoteOnly) {
    chips.push({
      key: 'quote',
      label: 'Solo cotización',
      clear: () => setFilters((f) => ({ ...f, quoteOnly: false })),
    })
  }
  if (filters.minRating) {
    chips.push({
      key: 'rating',
      label: `${filters.minRating}+ estrellas`,
      clear: () => setFilters((f) => ({ ...f, minRating: null })),
    })
  }
  filters.vendors.forEach((vendor) => {
    chips.push({
      key: `v-${vendor}`,
      label: vendor,
      clear: () =>
        setFilters((f) => ({
          ...f,
          vendors: f.vendors.filter((v) => v !== vendor),
        })),
    })
  })

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-hidden px-4 pb-28 lg:px-6">
      <div className="pt-4 sm:pt-6">
        <CatalogBanner
          title={category ? category.name : 'Nuestros productos'}
          categoryName={category?.name}
          subtitle={
            category
              ? `${filtered.length} producto${filtered.length === 1 ? '' : 's'} en ${category.name}`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <FiltersPanel
          categories={categories}
          activeSlug={categorySlug}
          productCountBySlug={productCountBySlug}
          vendors={vendors}
          filters={filters}
          onChange={setFilters}
        />

        <div id="catalogo-resultados" className="flex min-w-0 flex-col gap-4 scroll-mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rosver-line bg-white px-3 py-3 shadow-[0_8px_24px_-20px_rgba(17,17,17,0.35)] sm:px-4">
            <p className="text-sm text-rosver-muted">
              Mostrando{' '}
              <span className="font-bold text-rosver-ink">
                {showingFrom}-{showingTo}
              </span>{' '}
              de{' '}
              <span className="font-bold text-rosver-ink">{filtered.length}</span>{' '}
              resultados
            </p>
            <label className="flex items-center gap-2 text-sm text-rosver-muted">
              <span className="hidden sm:inline">Ordenar</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-10 rounded-full border border-rosver-line bg-rosver-soft/70 px-3 py-1.5 text-sm font-semibold text-rosver-ink outline-none focus:border-rosver-red/40"
                aria-label="Ordenar productos"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="name">Nombre A–Z</option>
              </select>
            </label>
          </div>

          {chips.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rosver-red px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rosver-red-dark"
                >
                  {chip.label}
                  <span aria-hidden>×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className={cn(
                  'text-xs font-bold text-rosver-muted underline-offset-2 transition hover:text-rosver-red hover:underline',
                )}
              >
                Limpiar todo
              </button>
            </div>
          ) : null}

          <ProductGrid products={pageProducts} />

          <CatalogPagination
            page={safePage}
            totalPages={totalPages}
            onChange={goToPage}
          />
        </div>
      </div>
    </main>
  )
}
