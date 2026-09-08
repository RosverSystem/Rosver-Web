import type { Category } from '@/features/catalog/model/mocks'
import { cn } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { IconChevronRight } from '@/shared/ui/icons'
import { SectionHeading } from '@/shared/ui/section-heading'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(prefersReducedMotion())

  const items = categories
    .filter((c) => c.visible !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  useEffect(() => {
    if (visible || !gridRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [visible])

  return (
    <section>
      <SectionHeading
        title="Compra por categoría"
        subtitle="Encuentra productos para mantenimiento, construcción o industria."
        action={{ label: 'Ver categorías', to: '/catalogo' }}
      />
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {items.map((category, i) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={i}
            visible={visible}
          />
        ))}
      </div>
    </section>
  )
}

function CategoryCard({
  category,
  index,
  visible,
}: {
  category: Category
  index: number
  visible: boolean
}) {
  const { slug, name, icon: Icon, imageUrl } = category
  const hasImage = Boolean(imageUrl)
  const solidFallback = index % 2 === 0 ? 'bg-rosver-ink' : 'bg-rosver-red'

  return (
    <Link
      to={`/catalogo/${slug}`}
      style={{ transitionDelay: visible ? `${index * 55}ms` : '0ms' }}
      className={cn(
        'group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_12px_28px_-12px_rgba(17,17,17,0.45)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosver-red',
        !hasImage && solidFallback,
        visible
          ? 'translate-y-0 scale-100 opacity-100'
          : 'translate-y-4 scale-95 opacity-0',
      )}
    >
      {hasImage ? (
        <>
          <img
            src={imageUrl}
            alt=""
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <Icon
          className="pointer-events-none absolute -right-3 -bottom-5 size-24 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
          aria-hidden
        />
      )}

      <span
        className={cn(
          'relative z-[1] m-3 flex size-9 items-center justify-center rounded-lg text-white shadow-sm backdrop-blur-sm',
          hasImage ? 'bg-rosver-red/90' : 'bg-white/15',
        )}
      >
        <Icon width={18} height={18} />
      </span>

      <div className="relative z-[1] p-3.5 pt-0 sm:p-4">
        <p className="font-display text-sm font-bold tracking-wide text-white uppercase sm:text-[0.95rem]">
          {name}
        </p>
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-white/80 transition-all duration-300 group-hover:gap-1.5 group-hover:text-white">
          Ver productos
          <IconChevronRight width={12} height={12} />
        </span>
      </div>
    </Link>
  )
}
