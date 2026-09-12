import { CatalogPagination } from '@/features/catalog/ui/CatalogPagination'
import { OfferCard } from '@/features/catalog/ui/OfferCard'
import { useCatalog } from '@/features/catalog/model/catalog-store'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 8

/**
 * Vista Ofertas: combos ERP (2x1 / packs) desde `offerCombos`.
 */
export function OffersPage() {
  const { offerCombos, refresh, refreshing, live, liveProducts } = useCatalog()
  const [page, setPage] = useState(1)
  const reduce = prefersReducedMotion()

  const combos = [...offerCombos].sort((a, b) => {
    const ra = a.rating ?? 0
    const rb = b.rating ?? 0
    if (rb !== ra) return rb - ra
    return a.name.localeCompare(b.name, 'es')
  })
  const totalPages = Math.max(1, Math.ceil(combos.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageCombos = combos.slice(start, start + PAGE_SIZE)
  const showingFrom = combos.length ? start + 1 : 0
  const showingTo = Math.min(start + PAGE_SIZE, combos.length)

  const goToPage = (next: number) => {
    setPage(next)
    requestAnimationFrame(() => {
      document
        .getElementById('ofertas-resultados')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-hidden px-4 pb-28 lg:px-6">
      <div className="pt-4 sm:pt-6">
        <OffersBanner count={combos.length} reduce={reduce} />
      </div>

      <div
        id="ofertas-resultados"
        className="flex min-w-0 flex-col gap-4 scroll-mt-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rosver-line bg-white px-3 py-3 shadow-[0_8px_24px_-20px_rgba(17,17,17,0.35)] sm:px-4">
          <p className="text-sm text-rosver-muted">
            Mostrando{' '}
            <span className="font-bold text-rosver-ink">
              {showingFrom}-{showingTo}
            </span>{' '}
            de <span className="font-bold text-rosver-ink">{combos.length}</span>{' '}
            combos
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="text-sm font-semibold text-rosver-muted transition hover:text-rosver-ink disabled:opacity-60"
            >
              {refreshing
                ? 'Actualizando…'
                : live || liveProducts
                  ? 'Actualizar'
                  : 'Buscar novedades'}
            </button>
            <Link
              to="/catalogo"
              className="text-sm font-bold text-rosver-red transition hover:text-rosver-red-dark"
            >
              Ver catálogo completo →
            </Link>
          </div>
        </div>

        {combos.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {pageCombos.map((combo, index) => (
                <motion.div
                  key={combo.id}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: reduce ? 0 : Math.min(index * 0.04, 0.24),
                  }}
                >
                  <OfferCard combo={combo} />
                </motion.div>
              ))}
            </div>
            <CatalogPagination
              page={safePage}
              totalPages={totalPages}
              onChange={goToPage}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-rosver-line bg-rosver-soft/50 px-6 py-16 text-center">
            <p className="font-display text-xl font-bold text-rosver-ink uppercase">
              Sin combos activos
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-rosver-muted">
              {liveProducts
                ? 'Crea un combo 2x1 o pack en el ERP → Ofertas.'
                : 'Cuando el catálogo esté en línea, los combos del ERP aparecerán aquí.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                to="/catalogo"
                className="rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white"
              >
                Ir al catálogo
              </Link>
              <Link
                to="/cotizar"
                className="rounded-full border border-rosver-line bg-white px-5 py-2.5 text-sm font-bold text-rosver-ink"
              >
                Cotizar
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function OffersBanner({
  count,
  reduce,
}: {
  count: number
  reduce: boolean
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border-[3px] border-rosver-ink bg-rosver-red text-white">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[14%] max-sm:w-8"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, #111 0 8px, #e30613 8px 16px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[14%] max-sm:w-8"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0 8px, #e30613 8px 16px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.35) 1.2px, transparent 1.3px)',
          backgroundSize: '14px 14px',
        }}
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center px-12 py-10 text-center sm:px-16 sm:py-12">
        <nav
          className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-white/75"
          aria-label="Ruta de navegación"
        >
          <Link to="/" className="hover:text-white">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="text-white">Ofertas</span>
        </nav>

        <motion.span
          className="mb-3 inline-flex rotate-[-2deg] border-[3px] border-rosver-ink bg-white px-3 py-1 text-[11px] font-black tracking-widest text-rosver-red uppercase shadow-[3px_3px_0_0_#111]"
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        >
          Combos y packs
        </motion.span>

        <motion.div
          className="relative rotate-[-1deg] border-[3px] border-rosver-ink bg-white px-5 py-4 shadow-[6px_6px_0_0_#111] sm:px-8 sm:py-5"
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 16,
            delay: 0.05,
          }}
        >
          <h1 className="font-display text-3xl leading-[0.95] font-bold tracking-tight text-rosver-ink uppercase sm:text-5xl lg:text-6xl">
            Ofertas <span className="text-rosver-red">activas</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-5 max-w-md text-sm font-medium text-white/90 sm:text-base"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          {count > 0
            ? `${count} combo${count === 1 ? '' : 's'} listo${count === 1 ? '' : 's'} para agregar al carrito.`
            : 'Pronto publicaremos nuevos packs y promociones 2x1.'}
        </motion.p>

        <motion.div
          className="mt-6"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <a
            href="#ofertas-resultados"
            className="inline-flex items-center gap-2 border-[3px] border-rosver-ink bg-white px-5 py-2.5 text-sm font-black tracking-wide text-rosver-ink uppercase shadow-[4px_4px_0_0_#111] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#111]"
          >
            Ver ofertas
            <ArrowRight size={16} color="currentColor" strokeWidth={2.5} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
