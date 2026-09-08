import { CATEGORIES } from '@/features/catalog'

export function AdminCategoriesPage() {
  const items = CATEGORIES.slice().sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
            Categorías
          </h1>
          <p className="mt-1 text-sm text-rosver-muted">
            Fase visual — cuando exista ERP, la imagen vendrá de{' '}
            <code className="text-xs">imageUrl</code> por categoría.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-rosver-red px-4 py-2 text-sm font-bold text-white"
        >
          + Nueva categoría
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white">
        <ul className="divide-y divide-rosver-line">
          {items.map((category) => {
            const Icon = category.icon
            return (
              <li
                key={category.id}
                className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-rosver-soft sm:size-14">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-rosver-muted">
                      <Icon width={22} height={22} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-rosver-ink">
                    {category.name}
                  </p>
                  <p className="truncate text-xs text-rosver-muted">
                    {category.id} · /catalogo/{category.slug}
                    {category.imageUrl ? ' · con imagen' : ' · solo ícono'}
                  </p>
                </div>
                <span
                  className={
                    category.visible === false
                      ? 'rounded-full bg-rosver-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-rosver-muted uppercase'
                      : 'rounded-full bg-rosver-red/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rosver-red uppercase'
                  }
                >
                  {category.visible === false ? 'Oculta' : 'Visible'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
