import { cn } from '@/shared/lib'
import { ArrowRight } from 'cssvg-icons'
import { motion } from 'motion/react'

export function CatalogPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
      aria-label="Paginación de productos"
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line bg-white text-rosver-ink transition hover:border-rosver-red hover:text-rosver-red disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowRight
          size={16}
          color="currentColor"
          strokeWidth={2}
          className="rotate-180"
        />
      </button>

      {pages.map((p) => {
        const active = p === page
        return (
          <motion.button
            key={p}
            type="button"
            aria-label={`Página ${p}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(p)}
            whileTap={{ scale: 0.94 }}
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-full text-sm font-bold transition',
              active
                ? 'bg-rosver-red text-white shadow-[0_8px_18px_-10px_rgba(227,6,19,0.8)]'
                : 'border border-rosver-line bg-white text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-ink',
            )}
          >
            {p}
          </motion.button>
        )
      })}

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line bg-white text-rosver-ink transition hover:border-rosver-red hover:text-rosver-red disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowRight size={16} color="currentColor" strokeWidth={2} />
      </button>
    </nav>
  )
}
