import { IconStar, IconStarOutline } from '@/shared/ui/icons'

export function RatingStars({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount?: number
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-rosver-yellow" aria-hidden>
        {Array.from({ length: 5 }, (_, i) =>
          i < Math.round(rating) ? <IconStar key={i} /> : <IconStarOutline key={i} />,
        )}
      </div>
      <span className="sr-only">{rating} de 5 estrellas</span>
      {reviewCount !== undefined ? (
        <span className="text-[11px] text-rosver-muted">({reviewCount})</span>
      ) : null}
    </div>
  )
}
