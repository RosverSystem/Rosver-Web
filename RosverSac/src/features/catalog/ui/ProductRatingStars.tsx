import { IconStar, IconStarOutline } from '@/shared/ui/icons'
import { cn } from '@/shared/lib'

/**
 * Estrellas 0–5 + conteo de reseñas (cards / ficha).
 */
export function ProductRatingStars({
  rating,
  reviewCount = 0,
  className,
  size = 'sm',
}: {
  rating: number
  reviewCount?: number
  className?: string
  size?: 'sm' | 'md'
}) {
  const value = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0
  const full = Math.floor(value)
  const iconSize = size === 'md' ? 'size-4' : 'size-3.5'

  return (
    <div
      className={cn('flex items-center gap-1.5 text-rosver-muted', className)}
      title={`${value.toFixed(1)} de 5`}
    >
      <span className="inline-flex items-center gap-0.5 text-rosver-yellow" aria-hidden>
        {Array.from({ length: 5 }, (_, i) =>
          i < full ? (
            <IconStar key={i} className={iconSize} />
          ) : (
            <IconStarOutline key={i} className={cn(iconSize, 'opacity-40')} />
          ),
        )}
      </span>
      <span className="text-[11px] font-semibold tabular-nums text-rosver-ink/80">
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
      {reviewCount > 0 ? (
        <span className="text-[11px] text-rosver-muted">({reviewCount})</span>
      ) : null}
    </div>
  )
}
