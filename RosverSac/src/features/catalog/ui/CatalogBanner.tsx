import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

/**
 * Banner catálogo estilo Memphis (bold) en paleta Rosver.
 * Solo CSS/SVG — sin imagen raster (carga rápida).
 */
export function CatalogBanner({
  title,
  subtitle,
  categoryName,
}: {
  title?: string
  subtitle?: string
  categoryName?: string
}) {
  const reduce = prefersReducedMotion()
  const heading = (title ?? 'Nuestros productos').toUpperCase()

  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border-[3px] border-rosver-ink bg-white"
      aria-labelledby="catalog-banner-title"
    >
      {/* Franja rayada izquierda */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[18%] max-sm:w-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, var(--color-rosver-red) 0 10px, #ffffff 10px 20px)',
        }}
        aria-hidden
      />
      {/* Franja rayada derecha */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[18%] max-sm:w-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-rosver-ink) 0 10px, var(--color-rosver-soft) 10px 20px)',
        }}
        aria-hidden
      />

      {/* Puntos (CSS, no imagen) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(17,17,17,0.18) 1.2px, transparent 1.3px)',
          backgroundSize: '16px 16px',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />

      {/* Zigzag inferior SVG inline */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-4 w-full text-rosver-red"
        viewBox="0 0 120 8"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0 8 L4 0 L8 8 L12 0 L16 8 L20 0 L24 8 L28 0 L32 8 L36 0 L40 8 L44 0 L48 8 L52 0 L56 8 L60 0 L64 8 L68 0 L72 8 L76 0 L80 8 L84 0 L88 8 L92 0 L96 8 L100 0 L104 8 L108 0 L112 8 L116 0 L120 8 Z"
        />
      </svg>

      <FloatingBits reduce={reduce} />

      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center px-12 py-10 text-center sm:px-16 sm:py-12 lg:py-14">
        <nav
          className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-rosver-muted"
          aria-label="Ruta de navegación"
        >
          <Link to="/" className="hover:text-rosver-red">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link to="/catalogo" className="hover:text-rosver-red">
            Catálogo
          </Link>
          {categoryName ? (
            <>
              <span aria-hidden>/</span>
              <span className="text-rosver-ink">{categoryName}</span>
            </>
          ) : null}
        </nav>

        <motion.span
          className="mb-3 inline-flex rotate-[-2deg] border-[3px] border-rosver-ink bg-rosver-red px-3 py-1 text-[11px] font-black tracking-widest text-white uppercase shadow-[3px_3px_0_0_#111]"
          initial={reduce ? false : { opacity: 0, scale: 0.85, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        >
          Catálogo Rosver
        </motion.span>

        <motion.div
          className="relative rotate-[-1.5deg] border-[3px] border-rosver-ink bg-white px-5 py-4 shadow-[6px_6px_0_0_#111] sm:px-8 sm:py-5"
          initial={reduce ? false : { opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.05 }}
        >
          <h1
            id="catalog-banner-title"
            className="font-display text-3xl leading-[0.95] font-bold tracking-tight text-rosver-ink uppercase sm:text-5xl lg:text-6xl"
          >
            {heading.split(' ').map((word, i) => (
              <span key={`${word}-${i}`} className="block sm:inline sm:mr-3">
                {i === heading.split(' ').length - 1 ? (
                  <span className="text-rosver-red">{word}</span>
                ) : (
                  word
                )}
              </span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          className="mt-5 max-w-md text-sm font-medium text-rosver-ink/75 sm:text-base"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          {subtitle ??
            'Importaciones listas para ferreterías, distribuidores y proyectos industriales.'}
        </motion.p>

        <motion.div
          className="mt-6"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
        >
          <a
            href="#catalogo-resultados"
            className="inline-flex items-center gap-2 border-[3px] border-rosver-ink bg-rosver-red px-5 py-2.5 text-sm font-black tracking-wide text-white uppercase shadow-[4px_4px_0_0_#111] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#111]"
          >
            Explorar ahora
            <ArrowRight size={16} color="#ffffff" strokeWidth={2.5} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function FloatingBits({ reduce }: { reduce: boolean }) {
  if (reduce) {
    return (
      <>
        <span
          className="pointer-events-none absolute top-6 left-[22%] size-3 rotate-45 bg-rosver-red"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute top-10 right-[24%] size-4 rounded-full border-[3px] border-rosver-ink"
          aria-hidden
        />
      </>
    )
  }

  return (
    <>
      <motion.span
        className="pointer-events-none absolute top-5 left-[22%] size-3 rotate-45 bg-rosver-red"
        aria-hidden
        animate={{ y: [0, -6, 0], rotate: [45, 55, 45] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="pointer-events-none absolute top-8 right-[22%] size-4 rounded-full border-[3px] border-rosver-ink bg-white"
        aria-hidden
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="pointer-events-none absolute bottom-10 left-[28%] font-display text-lg font-black text-rosver-ink"
        aria-hidden
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {'>>>'}
      </motion.span>
      <motion.span
        className="pointer-events-none absolute right-[26%] bottom-12 size-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-rosver-red"
        aria-hidden
        animate={{ y: [0, -5, 0], rotate: [0, 12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}
