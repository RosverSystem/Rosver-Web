import { cn } from '@/shared/lib'
import { IconBag } from '@/shared/ui/icons'

export function ProductImagePlaceholder({
  className,
  iconSize = 40,
}: {
  className?: string
  iconSize?: number
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-rosver-soft to-white text-rosver-line',
        className,
      )}
      aria-hidden
    >
      <IconBag width={iconSize} height={iconSize} />
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: 'shimmer 2.6s ease-in-out infinite' }}
      />
    </div>
  )
}
