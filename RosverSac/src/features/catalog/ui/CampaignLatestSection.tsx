import type { Category } from '@/features/catalog/model/mocks'
import { cn } from '@/shared/lib'
import { Link } from 'react-router-dom'

const FALLBACK = [
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&h=700&q=75',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&h=700&q=75',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&h=700&q=75',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=900&h=700&q=75',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=700&q=75',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&h=700&q=75',
] as const

const ROW1_COUNT = 4
const ROW2_COUNT = 2
const TOTAL = ROW1_COUNT + ROW2_COUNT

/**
 * «Lo último de campaña» — grid bento:
 * fila 1 = 4 cards; fila 2 = 2 cards a ancho doble (col-span-2).
 */
export function CampaignLatestSection({
  categories,
}: {
  categories: Category[]
}) {
  const roots = categories
    .filter((c) => c.visible !== false && !c.parentId)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (!roots.length) return null

  const tiles = Array.from({ length: TOTAL }, (_, i) => {
    const cat = roots[i % roots.length]!
    const wide = i >= ROW1_COUNT
    return {
      id: `${cat.id}-${i}`,
      name: cat.name,
      slug: cat.slug,
      image: cat.imageUrl?.trim() || FALLBACK[i % FALLBACK.length]!,
      wide,
      badge: wide && i === ROW1_COUNT ? 'Campaña Rosver' : undefined,
    }
  })

  const row1 = tiles.slice(0, ROW1_COUNT)
  const row2 = tiles.slice(ROW1_COUNT)

  return (
    <section aria-label="Lo último de campaña" className="min-w-0">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl">
          Lo último de campaña
          <span className="text-rosver-red">.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-rosver-muted sm:text-base">
          Selección actual de importaciones y líneas con stock para tu negocio.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {row1.map((tile) => (
          <CampaignTile key={tile.id} tile={tile} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-4">
        {row2.map((tile) => (
          <CampaignTile
            key={tile.id}
            tile={tile}
            className="col-span-1 lg:col-span-2"
          />
        ))}
      </div>

      <Link
        to="/catalogo"
        className="mt-4 flex flex-col items-stretch justify-between gap-3 rounded-2xl bg-rosver-red px-5 py-4 text-white transition hover:bg-rosver-red-dark sm:mt-5 sm:flex-row sm:items-center sm:rounded-full sm:px-6 sm:py-3.5"
      >
        <span className="text-sm font-bold tracking-wide uppercase sm:text-base">
          lo último en{' '}
          <span className="font-black">herramientas & soluciones</span>
        </span>
        <span className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-extrabold tracking-wide text-rosver-red uppercase">
          ¡Ver todo! ›
        </span>
      </Link>
    </section>
  )
}

function CampaignTile({
  tile,
  className,
}: {
  tile: {
    id: string
    name: string
    slug: string
    image: string
    wide?: boolean
    badge?: string
  }
  className?: string
}) {
  return (
    <Link
      to={`/catalogo/${tile.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl sm:rounded-3xl',
        tile.wide
          ? 'aspect-[16/10] sm:aspect-[2/1]'
          : 'aspect-[4/5] lg:aspect-[5/6]',
        className,
      )}
      aria-label={
        tile.badge
          ? `${tile.badge} lo último en ${tile.name}`
          : `lo último en ${tile.name}`
      }
    >
      <img
        src={tile.image}
        alt=""
        width={tile.wide ? 1200 : 900}
        height={tile.wide ? 600 : 900}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        aria-hidden
      />
      {tile.badge ? (
        <span className="absolute top-3 left-3 rounded-md bg-rosver-red px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white uppercase">
          {tile.badge}
        </span>
      ) : null}
      <div className="relative z-[1] flex h-full flex-col justify-end px-3 pb-4 sm:px-4 sm:pb-5">
        <p className="text-[11px] font-medium text-white/85 lowercase">
          lo último{' '}
          <span className="font-extrabold text-rosver-red uppercase">en</span>
        </p>
        <p className="font-display text-base font-bold tracking-wide text-white uppercase sm:text-lg">
          {tile.name}
        </p>
      </div>
    </Link>
  )
}
