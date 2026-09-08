import { cn } from '@/shared/lib'
import { ProductImagePlaceholder } from '@/shared/ui/product-image-placeholder'

/** Imagen de producto con fallback a placeholder (ERP: `imageUrl` opcional). */
export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  iconSize = 40,
  eager = false,
}: {
  src?: string
  alt: string
  className?: string
  imgClassName?: string
  iconSize?: number
  eager?: boolean
}) {
  if (!src) {
    return (
      <ProductImagePlaceholder className={className} iconSize={iconSize} />
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-rosver-soft', className)}>
      <img
        src={src}
        alt={alt}
        width={640}
        height={640}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('size-full object-cover', imgClassName)}
      />
    </div>
  )
}
