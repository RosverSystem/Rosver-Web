import { ProductCard } from '@/features/catalog/ui/ProductCard'
import type { Product } from '@/features/catalog/model/mocks'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

export function ProductGrid({ products }: { products: Product[] }) {
  const reduce = prefersReducedMotion()

  if (!products.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rosver-line bg-rosver-soft/40 px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-rosver-ink uppercase">
          Sin productos aquí
        </p>
        <p className="max-w-sm text-sm text-rosver-muted">
          Prueba limpiar filtros o explorar otra categoría.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <Link
            to="/catalogo"
            className="rounded-full bg-rosver-red px-4 py-2 text-sm font-bold text-white"
          >
            Ver todo el catálogo
          </Link>
          <Link
            to="/contacto"
            className="rounded-full border border-rosver-line bg-white px-4 py-2 text-sm font-bold text-rosver-ink"
          >
            Contactar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      key={products.map((p) => p.id).join('-')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3"
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: reduce ? 0 : 0.06 },
        },
      }}
    >
      {products.map((product) => (
        <motion.div
          key={product.id}
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.35, ease: 'easeOut' },
            },
          }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  )
}
