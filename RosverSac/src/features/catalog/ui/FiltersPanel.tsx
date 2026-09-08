import type { Category } from '@/features/catalog/model/mocks'
import { countProductsInCategoryTree } from '@/features/catalog/model/category-tree'
import { cn } from '@/shared/lib'
import { SlidersHorizontal, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type CatalogFilterState = {
  onSale: boolean
  withPrice: boolean
  quoteOnly: boolean
  minRating: number | null
  vendors: string[]
  priceMin: number | null
  priceMax: number | null
}

export const EMPTY_FILTERS: CatalogFilterState = {
  onSale: false,
  withPrice: false,
  quoteOnly: false,
  minRating: null,
  vendors: [],
  priceMin: null,
  priceMax: null,
}

type Props = {
  categories: Category[]
  activeSlug?: string
  /** @deprecated se calcula con árbol; se mantiene por compat */
  productCountBySlug?: Record<string, number>
  productsForCounts?: { category: string; visible?: boolean }[]
  vendors: string[]
  filters: CatalogFilterState
  onChange: (next: CatalogFilterState) => void
}

export function FiltersPanel({
  categories,
  activeSlug,
  productCountBySlug,
  productsForCounts,
  vendors,
  filters,
  onChange,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = categories
    .filter((c) => c.visible !== false && !c.parentId)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const childrenOf = (rootId: string) =>
    categories
      .filter((c) => c.visible !== false && c.parentId === rootId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const countFor = (slug: string) => {
    if (productsForCounts) {
      return countProductsInCategoryTree(categories, slug, productsForCounts)
    }
    return productCountBySlug?.[slug]
  }

  const toggleVendor = (vendor: string) => {
    const has = filters.vendors.includes(vendor)
    onChange({
      ...filters,
      vendors: has
        ? filters.vendors.filter((v) => v !== vendor)
        : [...filters.vendors, vendor],
    })
  }

  const panel = (
    <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_10px_30px_-22px_rgba(17,17,17,0.45)]">
      <div className="flex items-center justify-between border-b border-rosver-line bg-rosver-soft/40 px-4 py-3.5">
        <p className="font-display text-sm font-bold tracking-wide text-rosver-ink uppercase">
          Opciones de filtro
        </p>
        <button
          type="button"
          className="text-rosver-muted lg:hidden"
          aria-label="Cerrar filtros"
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-4 lg:max-h-none">
        <FilterBlock title="Por categorías">
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                to="/catalogo"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-2.5 py-2 transition',
                  !activeSlug
                    ? 'bg-rosver-red/10 font-semibold text-rosver-red'
                    : 'text-rosver-ink hover:bg-rosver-soft',
                )}
              >
                Todas
              </Link>
            </li>
            {items.map((category) => {
              const count = countFor(category.slug)
              const active = activeSlug === category.slug
              const kids = childrenOf(category.id)
              return (
                <li key={category.id}>
                  <Link
                    to={`/catalogo/${category.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition',
                      active
                        ? 'bg-rosver-red/10 font-semibold text-rosver-red'
                        : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                    )}
                  >
                    <span className="truncate">{category.name}</span>
                    {typeof count === 'number' ? (
                      <span className="rounded-full bg-rosver-soft px-1.5 py-0.5 text-[10px] font-bold text-rosver-muted">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                  {kids.length ? (
                    <ul className="mt-0.5 space-y-0.5 border-l border-rosver-line pl-2 ml-2">
                      {kids.map((ch) => {
                        const chActive = activeSlug === ch.slug
                        const chCount = countFor(ch.slug)
                        return (
                          <li key={ch.id}>
                            <Link
                              to={`/catalogo/${ch.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition',
                                chActive
                                  ? 'bg-rosver-red/10 font-semibold text-rosver-red'
                                  : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                              )}
                            >
                              <span className="truncate">{ch.name}</span>
                              {typeof chCount === 'number' ? (
                                <span className="text-[10px] font-bold text-rosver-muted">
                                  {chCount}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </FilterBlock>

        <FilterBlock title="Promociones">
          <CheckRow
            label="En oferta"
            checked={filters.onSale}
            onChange={(onSale) => onChange({ ...filters, onSale })}
          />
        </FilterBlock>

        <FilterBlock title="Rango de precio (S/)">
          <div className="flex items-center gap-2 px-1">
            <input
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              placeholder="Mín"
              value={filters.priceMin ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onChange({
                  ...filters,
                  priceMin: v === '' ? null : Number(v),
                })
              }}
              className="h-9 w-full rounded-lg border border-rosver-line bg-white px-2 text-sm outline-none focus:border-rosver-red/40"
            />
            <span className="text-rosver-muted">–</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              placeholder="Máx"
              value={filters.priceMax ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onChange({
                  ...filters,
                  priceMax: v === '' ? null : Number(v),
                })
              }}
              className="h-9 w-full rounded-lg border border-rosver-line bg-white px-2 text-sm outline-none focus:border-rosver-red/40"
            />
          </div>
        </FilterBlock>

        <FilterBlock title="Disponibilidad">
          <CheckRow
            label="Con precio publicado"
            checked={filters.withPrice}
            onChange={(withPrice) =>
              onChange({
                ...filters,
                withPrice,
                quoteOnly: withPrice ? false : filters.quoteOnly,
              })
            }
          />
          <CheckRow
            label="Solo cotización"
            checked={filters.quoteOnly}
            onChange={(quoteOnly) =>
              onChange({
                ...filters,
                quoteOnly,
                withPrice: quoteOnly ? false : filters.withPrice,
              })
            }
          />
        </FilterBlock>

        <FilterBlock title="Valoración">
          {[5, 4, 3].map((stars) => (
            <CheckRow
              key={stars}
              label={`${stars}+ estrellas`}
              checked={filters.minRating === stars}
              onChange={(checked) =>
                onChange({
                  ...filters,
                  minRating: checked ? stars : null,
                })
              }
            />
          ))}
        </FilterBlock>

        <FilterBlock title="Marca / proveedor">
          {vendors.map((vendor) => (
            <CheckRow
              key={vendor}
              label={vendor}
              checked={filters.vendors.includes(vendor)}
              onChange={() => toggleVendor(vendor)}
            />
          ))}
        </FilterBlock>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex min-h-11 items-center gap-2 self-start rounded-full border border-rosver-line bg-white px-4 py-2 text-sm font-bold text-rosver-ink shadow-sm transition hover:border-rosver-red/40 hover:text-rosver-red lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filtrar
      </button>

      <aside className="hidden lg:block">{panel}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-rosver-ink/40"
            aria-label="Cerrar filtros"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-3xl bg-white p-3 shadow-2xl">
            {panel}
          </div>
        </div>
      ) : null}
    </>
  )
}

function FilterBlock({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="mb-2 font-display text-[11px] font-bold tracking-[0.14em] text-rosver-ink uppercase">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm text-rosver-ink transition hover:bg-rosver-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-rosver-line text-rosver-red accent-rosver-red"
      />
      <span className={cn(checked && 'font-semibold')}>{label}</span>
    </label>
  )
}
