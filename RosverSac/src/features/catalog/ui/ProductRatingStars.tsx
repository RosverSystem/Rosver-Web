import { IconStar, IconStarOutline } from '@/shared/ui/icons'
import { cn } from '@/shared/lib'
import { useState } from 'react'

/**
 * Estrellas 0–5 + conteo. En ficha: modo interactivo (1 voto).
 */
export function ProductRatingStars({
  rating,
  reviewCount = 0,
  className,
  size = 'sm',
  interactive = false,
  myRating = null,
  canRate = false,
  busy = false,
  onRate,
}: {
  rating: number
  reviewCount?: number
  className?: string
  size?: 'sm' | 'md'
  interactive?: boolean
  myRating?: number | null
  canRate?: boolean
  busy?: boolean
  onRate?: (stars: number) => void
}) {
  const value = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0
  const displayFilled = myRating != null ? myRating : Math.floor(value)
  const [hover, setHover] = useState<number | null>(null)
  const iconSize = size === 'md' ? 'size-5' : 'size-3.5'
  const filledCount =
    interactive && hover != null ? hover : displayFilled
  const clickable = interactive && canRate && !busy && Boolean(onRate)

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5 text-rosver-muted', className)}
      title={
        myRating != null
          ? `Tu calificación: ${myRating} de 5`
          : `${value.toFixed(1)} de 5`
      }
    >
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-rosver-yellow',
          clickable && 'cursor-pointer',
          busy && 'opacity-60',
        )}
        role={interactive ? 'group' : undefined}
        aria-label={
          interactive
            ? canRate
              ? 'Calificar producto de 1 a 5 estrellas'
              : myRating != null
                ? `Ya calificaste con ${myRating} estrellas`
                : 'Calificación del producto'
            : undefined
        }
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const star = i + 1
          const filled = i < filledCount
          const StarIcon = filled ? IconStar : IconStarOutline
          if (!clickable) {
            return (
              <StarIcon
                key={i}
                className={cn(iconSize, !filled && 'opacity-40')}
                aria-hidden
              />
            )
          }
          return (
            <button
              key={i}
              type="button"
              disabled={busy}
              className={cn(
                'rounded-sm p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rosver-yellow',
                !filled && 'opacity-50 hover:opacity-100',
              )}
              aria-label={`${star} estrella${star === 1 ? '' : 's'}`}
              onMouseEnter={() => setHover(star)}
              onFocus={() => setHover(star)}
              onClick={() => onRate?.(star)}
            >
              <StarIcon className={iconSize} />
            </button>
          )
        })}
      </span>
      <span className="text-[11px] font-semibold tabular-nums text-rosver-ink/80 sm:text-xs">
        {myRating != null
          ? `Tu voto: ${myRating}`
          : value > 0
            ? value.toFixed(1)
            : '—'}
      </span>
      {reviewCount > 0 ? (
        <span className="text-[11px] text-rosver-muted sm:text-xs">
          ({reviewCount})
        </span>
      ) : interactive && canRate ? (
        <span className="text-[11px] text-rosver-muted sm:text-xs">
          Sé el primero en calificar
        </span>
      ) : null}
    </div>
  )
}
