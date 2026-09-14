import type { Category } from '@/features/catalog/model/mocks'
import { cn } from '@/shared/lib'
import { Link } from 'react-router-dom'

/** Placeholders industriales si la categoría no tiene imagen. */
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=1000&q=75',
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&h=1000&q=75',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&h=1000&q=75',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&h=1000&q=75',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=1000&q=75',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&h=1000&q=75',
] as const

/** @deprecated Conservado por imports admin; ya no hay tonos pastel. */
export function categoryHomeTone(_index = 0) {
  return {
    bg: 'bg-rosver-ink',
    accent: 'text-rosver-red',
    dot: 'bg-rosver-red',
  } as const
}

type Props = {
  category: Pick<
    Category,
    'name' | 'slug' | 'tagline' | 'points' | 'imageUrl' | 'icon'
  >
  toneIndex?: number
  preview?: boolean
  className?: string
  /** Resalta con glow rojo (hover/activo). */
  highlighted?: boolean
}

/**
 * Card categoría lifestyle (full-bleed + «lo último EN …»).
 * Misma UI en home y preview admin.
 */
export function CategoryHomeCard({
  category,
  toneIndex = 0,
  preview = false,
  className,
  highlighted = false,
}: Props) {
  const slug = category.slug || 'preview'
  const image =
    category.imageUrl?.trim() ||
    FALLBACK_IMAGES[toneIndex % FALLBACK_IMAGES.length]!
  const Icon = category.icon

  const inner = (
    <>
      {category.imageUrl ? (
        <img
          src={image}
          alt=""
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <>
          <img
            src={image}
            alt=""
            width={800}
            height={1000}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
          />
          <Icon className="absolute top-4 right-4 size-8 text-white/25" />
        </>
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] px-4 pb-5 text-center sm:pb-6">
        <p className="text-[11px] font-medium tracking-wide text-white/85 lowercase">
          lo último{' '}
          <span className="font-extrabold text-rosver-red uppercase">en</span>
        </p>
        <p className="mt-0.5 font-display text-lg font-bold tracking-wide text-white uppercase sm:text-xl">
          {category.name.trim() || 'Categoría'}
        </p>
      </div>
    </>
  )

  const shell = cn(
    'group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-2xl sm:rounded-3xl',
    highlighted && 'ring-2 ring-rosver-red shadow-[0_12px_40px_rgba(227,6,19,0.35)]',
    !highlighted && 'shadow-sm',
    className,
  )

  if (preview) {
    return (
      <article data-cat-card className={shell}>
        {inner}
      </article>
    )
  }

  return (
    <Link
      to={`/catalogo/${slug}`}
      data-cat-card
      className={shell}
      aria-label={`Ver categoría ${category.name}`}
    >
      {inner}
    </Link>
  )
}
