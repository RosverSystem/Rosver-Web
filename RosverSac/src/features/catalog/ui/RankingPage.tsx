import {
  fetchRankingProducts,
} from '@/features/catalog/model/api-ratings'
import type { Product } from '@/features/catalog/model/mocks'
import { useCatalog } from '@/features/catalog/model/catalog-store'
import { CatalogPagination } from '@/features/catalog/ui/CatalogPagination'
import { ProductCard } from '@/features/catalog/ui/ProductCard'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 12

/**
 * Ranking público: productos mejor calificados.
 */
export function RankingPage() {
  const { products: catalogProducts, liveProducts } = useCatalog()
  const [remote, setRemote] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const reduce = prefersReducedMotion()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchRankingProducts(48)
      .then((res) => {
        if (!cancelled) setRemote(res.products ?? [])
      })
      .catch(() => {
        if (!cancelled) setRemote(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const ranked = useMemo(() => {
    if (remote && remote.length > 0) return remote
    return [...catalogProducts]
      .filter((p) => p.visible !== false && (p.reviewCount ?? 0) > 0)
      .sort((a, b) => {
        const sa = (a.rating ?? 0) * Math.log((a.reviewCount ?? 0) + 1)
        const sb = (b.rating ?? 0) * Math.log((b.reviewCount ?? 0) + 1)
        if (sb !== sa) return sb - sa
        if ((b.rating ?? 0) !== (a.rating ?? 0))
          return (b.rating ?? 0) - (a.rating ?? 0)
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      })
  }, [remote, catalogProducts])

  const totalPages = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageItems = ranked.slice(start, start + PAGE_SIZE)
  const showingFrom = ranked.length ? start + 1 : 0
  const showingTo = Math.min(start + PAGE_SIZE, ranked.length)

  const goToPage = (next: number) => {
    setPage(next)
    requestAnimationFrame(() => {
      document
        .getElementById('ranking-resultados')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-hidden px-4 pb-28 lg:px-6">
      <div className="pt-4 sm:pt-6">
        <section className="relative overflow-hidden rounded-2xl border border-rosver-line bg-gradient-to-br from-rosver-ink via-rosver-blue to-rosver-ink px-5 py-8 text-white sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(242,183,5,0.35), transparent 45%), radial-gradient(circle at 80% 60%, rgba(227,6,19,0.25), transparent 40%)',
            }}
            aria-hidden
          />
          <p className="relative text-xs font-bold tracking-[0.2em] text-rosver-yellow uppercase">
            Ranking
          </p>
          <h1 className="relative mt-2 font-display text-2xl font-bold tracking-tight uppercase sm:text-3xl lg:text-4xl">
            Mejores calificados
          </h1>
          <p className="relative mt-2 max-w-xl text-sm text-white/80 sm:text-[15px]">
            Productos con mejor promedio y más votos de clientes e invitados.
            Cada persona califica una sola vez por producto.
          </p>
          <Link
            to="/catalogo"
            className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-rosver-yellow transition hover:text-white"
          >
            Ir al catálogo
            <ArrowRight size={16} color="currentColor" strokeWidth={2} />
          </Link>
        </section>
      </div>

      <div
        id="ranking-resultados"
        className="flex min-w-0 flex-col gap-4 scroll-mt-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rosver-line bg-white px-3 py-3 shadow-[0_8px_24px_-20px_rgba(17,17,17,0.35)] sm:px-4">
          <p className="text-sm text-rosver-muted">
            {loading ? (
              'Cargando ranking…'
            ) : (
              <>
                Mostrando{' '}
                <span className="font-bold text-rosver-ink">
                  {showingFrom}-{showingTo}
                </span>{' '}
                de{' '}
                <span className="font-bold text-rosver-ink">{ranked.length}</span>{' '}
                productos
                {!liveProducts && remote == null ? (
                  <span className="ml-1 text-rosver-muted">
                    (vista local)
                  </span>
                ) : null}
              </>
            )}
          </p>
          <Link
            to="/ofertas"
            className="text-sm font-bold text-rosver-red transition hover:text-rosver-red-dark"
          >
            Ver ofertas →
          </Link>
        </div>

        {!loading && ranked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rosver-line bg-rosver-soft/40 px-6 py-14 text-center">
            <p className="font-display text-lg font-bold text-rosver-ink">
              Aún no hay calificaciones
            </p>
            <p className="mt-2 text-sm text-rosver-muted">
              Entra a un producto y toca las estrellas para votar (con o sin
              cuenta).
            </p>
            <Link
              to="/catalogo"
              className="mt-5 inline-flex rounded-xl bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {pageItems.map((product, index) => (
                <motion.div
                  key={product.id || product.slug}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: reduce ? 0 : Math.min(index * 0.04, 0.24),
                  }}
                  className="relative"
                >
                  {start + index < 3 ? (
                    <span className="absolute top-2 left-2 z-10 rounded-md bg-rosver-yellow px-2 py-0.5 text-[10px] font-black text-rosver-ink shadow-sm">
                      #{start + index + 1}
                    </span>
                  ) : null}
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <CatalogPagination
              page={safePage}
              totalPages={totalPages}
              onChange={goToPage}
            />
          </>
        )}
      </div>
    </main>
  )
}
