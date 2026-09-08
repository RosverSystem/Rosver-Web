import type { Category } from '@/features/catalog/model/mocks'
import { cn } from '@/shared/lib'
import { ArrowRight } from 'cssvg-icons'
import { Link } from 'react-router-dom'

const CARD_TONES = [
  { bg: 'bg-[#fff1f0]', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
  { bg: 'bg-rosver-soft', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
  { bg: 'bg-[#f3efe8]', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
  { bg: 'bg-[#f0f2f5]', accent: 'text-rosver-red', dot: 'bg-rosver-red' },
] as const

const FALLBACK_COPY = {
  tagline: 'Importaciones Rosver',
  points: ['Stock disponible', 'Cotiza sin compromiso', 'Despacho nacional'],
}

export function categoryHomeTone(index = 0) {
  return CARD_TONES[index % CARD_TONES.length]!
}

type Props = {
  category: Pick<
    Category,
    'name' | 'slug' | 'tagline' | 'points' | 'imageUrl' | 'icon'
  >
  /** Índice para variar el tono de fondo (como en el carrusel). */
  toneIndex?: number
  /**
   * Vista previa ERP: sin navegación.
   */
  preview?: boolean
  className?: string
}

/**
 * Card de inicio «Explora por categoría» (misma UI en home y preview admin).
 */
export function CategoryHomeCard({
  category,
  toneIndex = 0,
  preview = false,
  className,
}: Props) {
  const tone = categoryHomeTone(toneIndex)
  const tagline = category.tagline?.trim() || FALLBACK_COPY.tagline
  const points =
    category.points?.filter((p) => p.trim()).slice(0, 3) ?? FALLBACK_COPY.points
  const Icon = category.icon
  const slug = category.slug || 'preview'

  const cta = preview ? (
    <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-rosver-red px-4 py-2.5 text-sm font-bold text-white">
      Explorar
      <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
    </span>
  ) : (
    <Link
      to={`/catalogo/${slug}`}
      className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-rosver-red px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
    >
      Explorar
      <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
    </Link>
  )

  return (
    <article
      data-cat-card
      className={cn(
        'relative flex w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.75rem]',
        tone.bg,
        className,
      )}
    >
      <div className="relative z-[1] flex flex-1 flex-col p-5 pb-3 sm:p-6">
        <p className={cn('text-[11px] font-bold tracking-wide uppercase', tone.accent)}>
          {tagline}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-rosver-ink uppercase sm:text-2xl">
          {category.name.trim() || 'Nombre de categoría'}
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-rosver-ink/75">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span
                className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', tone.dot)}
                aria-hidden
              />
              {point}
            </li>
          ))}
        </ul>
        {cta}
      </div>

      <div className="relative mx-4 mb-4 h-36 overflow-hidden rounded-2xl bg-white/40 sm:h-40">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt=""
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className={cn(
              'size-full object-cover',
              !preview && 'transition duration-500 hover:scale-105',
            )}
          />
        ) : (
          <Icon className="absolute inset-0 m-auto size-16 text-rosver-ink/15" />
        )}
      </div>
    </article>
  )
}
