import { SessionAccountMenu } from '@/features/auth'
import { useCart, visibleCartItemCount } from '@/features/cart'
import {
  filterProductsByQuery,
  findExactSkuProduct,
  useCatalog,
  type Product,
} from '@/features/catalog'
import { cn } from '@/shared/lib'
import { attachNestedScrollWheel } from '@/shared/lib/nested-scroll-wheel'
import { IconBag, IconChevronDown, IconSearch } from '@/shared/ui/icons'
import { Check, Compass, Message, Phone } from 'cssvg-icons'
import { Heart, Menu, X } from 'lucide-react'
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const NAV_LINKS = [
  { name: 'Inicio', link: '/' },
  { name: 'Catálogo', link: '/catalogo' },
  { name: 'Ofertas', link: '/ofertas', tag: 'OFERTA' },
  { name: 'Ranking', link: '/ranking' },
  { name: 'Contacto', link: '/contacto' },
  { name: 'Cotizar', link: '/cotizar', tag: 'NUEVO' },
] as const

export function PublicNavbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { lines } = useCart()
  const { categories, products, offerCombos } = useCatalog()
  const itemCount = useMemo(
    () =>
      visibleCartItemCount(
        lines,
        products,
        offerCombos.map((c) => c.id),
      ),
    [lines, products, offerCombos],
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categoriesPanelRef = useRef<HTMLDivElement>(null)
  const categoriesBtnRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const skipUrlSyncRef = useRef(false)
  /** Tras Enter/lupa: no rellenar el input desde ?q= ni borrar el filtro del catálogo. */
  const searchCommittedRef = useRef(false)

  // Si quitan la búsqueda desde el catálogo (chip), sincronizar el input.
  useEffect(() => {
    if (!pathname.startsWith('/catalogo')) return
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false
      return
    }
    // Tras Enter: el input queda vacío; el filtro sigue en ?q= (chip del catálogo).
    if (searchCommittedRef.current) return
    setQuery(searchParams.get('q') ?? '')
  }, [pathname, searchParams])

  // En /catalogo: filtrar en vivo mientras se escribe (sin esperar a la lupa).
  useEffect(() => {
    if (!pathname.startsWith('/catalogo')) return
    if (searchCommittedRef.current) return
    const q = query.trim()
    const current = (searchParams.get('q') ?? '').trim()
    if (q === current) return
    const id = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (q) next.set('q', q)
      else next.delete('q')
      const search = next.toString()
      skipUrlSyncRef.current = true
      navigate(
        { pathname, search: search ? `?${search}` : '' },
        { replace: true },
      )
    }, 200)
    return () => window.clearTimeout(id)
  }, [query, pathname, navigate, searchParams])

  function finishSearchUi() {
    searchCommittedRef.current = true
    setQuery('')
    setMobileOpen(false)
  }

  function onQueryChange(value: string) {
    searchCommittedRef.current = false
    setQuery(value)
  }

  function runSearch(raw: string) {
    const q = raw.trim()
    if (!q) {
      navigate('/catalogo')
      finishSearchUi()
      return
    }
    const exact = findExactSkuProduct(products, q)
    if (exact) {
      navigate(`/producto/${exact.slug}`)
      finishSearchUi()
      return
    }
    // Un solo resultado → ficha directa; varios → listado (sin banner grande).
    const hits = filterProductsByQuery(
      products.filter((p) => p.visible !== false),
      q,
    )
    if (hits.length === 1) {
      navigate(`/producto/${hits[0].slug}`)
      finishSearchUi()
      return
    }
    navigate({
      pathname: '/catalogo',
      search: `?q=${encodeURIComponent(q)}`,
      hash: 'catalogo-resultados',
    })
    finishSearchUi()
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault()
    runSearch(query)
  }

  function goToProduct(product: Product) {
    navigate(`/producto/${product.slug}`)
    finishSearchUi()
  }

  const navCategories = useMemo(() => {
    const visible = categories.filter((c) => c.visible !== false)
    const roots = visible
      .filter((c) => !c.parentId && c.showInNav !== false)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    return roots.map((root) => ({
      root,
      // Subcategorías siempre visibles bajo su padre del menú
      children: visible
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }))
  }, [categories])

  // Cerrar al cambiar de ruta.
  useEffect(() => {
    setCategoriesOpen(false)
  }, [pathname])

  // Clic fuera + Escape cierran el mega-menú.
  useEffect(() => {
    if (!categoriesOpen) return
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node
      if (categoriesPanelRef.current?.contains(t)) return
      if (categoriesBtnRef.current?.contains(t)) return
      setCategoriesOpen(false)
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setCategoriesOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [categoriesOpen])

  const isHome = pathname === '/'

  return (
    <header
      className={cn(
        'relative z-40 bg-white',
        // En Home la barra roja + hero deben leerse como un solo bloque (sin línea gris).
        // En el resto de rutas sí separamos el header del contenido blanco.
        !isHome && 'border-b border-rosver-line',
      )}
    >
      <div className="hidden bg-rosver-ink text-white sm:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4 text-[11px] lg:px-6">
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <span className="text-rosver-red" aria-hidden>
                <Compass size={14} color="currentColor" strokeWidth={2} />
              </span>
              <span className="truncate">Envíos a nivel nacional</span>
            </div>
            <span className="hidden h-3 w-px bg-white/20 md:block" aria-hidden />
            <div className="hidden items-center gap-1.5 font-medium text-white/90 md:flex">
              <span className="text-rosver-red" aria-hidden>
                <Check size={14} color="currentColor" strokeWidth={2} />
              </span>
              Cotiza sin compromiso
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              to="/cotizar"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Message size={14} color="currentColor" strokeWidth={2} />
              Cotizar pedido
            </Link>
            <span className="h-3 w-px bg-white/20" aria-hidden />
            <Link
              to="/contacto"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Phone size={14} color="currentColor" strokeWidth={2} />
              Ayuda
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 lg:grid-cols-[1fr_minmax(12rem,28rem)_1fr] lg:gap-6 lg:px-6">
        <div className="flex items-center gap-1 lg:justify-self-start">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full text-rosver-ink transition hover:bg-rosver-soft lg:hidden"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <RosverLogo />
        </div>

        <div className="hidden min-w-0 justify-self-center lg:block lg:w-full">
          <HeaderSearchBox
            variant="desktop"
            query={query}
            products={products}
            onQueryChange={onQueryChange}
            onSubmit={onSearchSubmit}
            onPickProduct={goToProduct}
            onSeeAll={runSearch}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 justify-self-end">
          <SessionAccountMenu variant="desktop" />
          <button
            type="button"
            aria-label="Favoritos"
            className="hidden size-10 items-center justify-center rounded-full text-rosver-ink transition hover:bg-rosver-soft sm:inline-flex"
          >
            <Heart className="size-5" />
          </button>
          <Link
            to="/carrito"
            aria-label="Carrito"
            className="relative inline-flex size-10 items-center justify-center rounded-full text-rosver-ink transition hover:bg-rosver-soft"
          >
            <IconBag />
            <span className="absolute top-0.5 right-0.5 inline-flex size-4 items-center justify-center rounded-full bg-rosver-red text-[10px] font-bold text-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </Link>
        </div>
      </div>

      <div className="border-t border-rosver-line px-4 py-2 lg:hidden">
        <HeaderSearchBox
          variant="mobile"
          query={query}
          products={products}
          onQueryChange={onQueryChange}
          onSubmit={onSearchSubmit}
          onPickProduct={goToProduct}
          onSeeAll={runSearch}
        />
      </div>

      <nav className="hidden bg-rosver-red text-white lg:block">
        <div className="relative mx-auto flex max-w-7xl items-center px-6">
          <button
            ref={categoriesBtnRef}
            type="button"
            onClick={() => setCategoriesOpen((v) => !v)}
            aria-expanded={categoriesOpen}
            aria-controls="nav-categories-panel"
            className={cn(
              'flex items-center gap-2 border-r border-white/20 py-3 pr-4 text-sm font-bold uppercase transition hover:bg-white/10',
              categoriesOpen && 'bg-white/15',
            )}
          >
            <Menu className="size-4" />
            Ver categorías
            <IconChevronDown className={cn('size-3 transition-transform', categoriesOpen && 'rotate-180')} />
          </button>

          {NAV_LINKS.map((item) => {
            const active =
              item.link === '/'
                ? pathname === '/'
                : item.link === '/catalogo'
                  ? pathname.startsWith('/catalogo')
                  : pathname === item.link || pathname.startsWith(`${item.link}/`)

            return (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setCategoriesOpen(false)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-bold uppercase transition hover:bg-white/10',
                active && 'bg-white/10',
              )}
            >
              {item.name}
              {'tag' in item ? (
                <span className="rounded bg-white px-1 py-0.5 text-[9px] font-black text-rosver-red">
                  {item.tag}
                </span>
              ) : null}
            </Link>
            )
          })}

          {categoriesOpen ? (
            <div
              ref={categoriesPanelRef}
              id="nav-categories-panel"
              role="dialog"
              aria-label="Categorías del catálogo"
              className="absolute top-full left-0 right-0 z-30 mx-auto max-w-7xl overflow-hidden rounded-b-2xl border border-rosver-line border-t-0 bg-white text-rosver-ink shadow-[0_20px_48px_rgba(17,17,17,0.18)]"
            >
              <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {navCategories.map(({ root, children }) => {
                  const Icon = root.icon
                  return (
                    <div
                      key={root.id}
                      className="border-b border-rosver-line p-4 sm:border-r sm:last:border-r-0 xl:border-b-0"
                    >
                      <Link
                        to={`/catalogo/${root.slug}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="group flex items-center gap-2.5"
                      >
                        {root.imageUrl ? (
                          <img
                            src={root.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rosver-soft text-rosver-ink">
                            <Icon className="size-5" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold group-hover:text-rosver-red">
                            {root.name}
                          </span>
                          {root.tagline ? (
                            <span className="block truncate text-[11px] text-rosver-muted">
                              {root.tagline}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                      {children.length > 0 ? (
                        <ul className="mt-3 space-y-1 border-t border-rosver-line/80 pt-2.5">
                          {children.map((ch) => (
                            <li key={ch.id}>
                              <Link
                                to={`/catalogo/${ch.slug}`}
                                onClick={() => setCategoriesOpen(false)}
                                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-rosver-ink transition hover:bg-rosver-soft hover:text-rosver-red"
                              >
                                <span className="truncate">{ch.name}</span>
                                <span className="text-[10px] font-bold text-rosver-muted" aria-hidden>
                                  →
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-rosver-line bg-rosver-soft/50 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-rosver-muted uppercase">
                  Catálogo Rosver
                </p>
                <Link
                  to="/catalogo"
                  onClick={() => setCategoriesOpen(false)}
                  className="text-xs font-bold text-rosver-red hover:underline"
                >
                  Ver todo el catálogo →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-rosver-line bg-white px-4 py-4 lg:hidden">
          <ul className="flex flex-col divide-y divide-rosver-line">
            {NAV_LINKS.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.link}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 py-2.5 text-sm font-bold uppercase',
                    pathname === item.link ? 'text-rosver-red' : 'text-rosver-ink',
                  )}
                >
                  {item.name}
                  {'tag' in item ? (
                    <span className="rounded bg-rosver-red px-1 py-0.5 text-[9px] font-black text-white">
                      {item.tag}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
            <li>
              <SessionAccountMenu
                variant="compact"
                onNavigate={() => setMobileOpen(false)}
              />
            </li>
          </ul>
          <div className="mt-3 border-t border-rosver-line pt-3">
            <p className="mb-2 text-xs font-bold text-rosver-muted uppercase">Categorías</p>
            <div className="grid grid-cols-1 gap-2">
              {navCategories.map(({ root, children }) => (
                <div key={root.id}>
                  <Link
                    to={`/catalogo/${root.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-rosver-ink hover:bg-rosver-soft"
                  >
                    <root.icon className="size-4 text-rosver-red" />
                    {root.name}
                  </Link>
                  {children.length ? (
                    <div className="ml-6 space-y-0.5">
                      {children.map((ch) => (
                        <Link
                          key={ch.id}
                          to={`/catalogo/${ch.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="block py-1 text-[11px] text-rosver-muted"
                        >
                          {ch.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function RosverLogo() {
  return (
    <Link
      to="/"
      className="order-2 flex shrink-0 items-center gap-1 font-display text-2xl font-bold tracking-tight lg:order-none"
      aria-label="Rosver Sac — inicio"
    >
      <span className="text-rosver-red italic">ROS</span>
      <span className="relative text-rosver-ink italic">
        VER
        <span className="absolute -top-1 -right-3 size-2.5 rounded-[2px] bg-rosver-red" aria-hidden />
      </span>
    </Link>
  )
}

function HeaderSearchBox({
  variant,
  query,
  products,
  onQueryChange,
  onSubmit,
  onPickProduct,
  onSeeAll,
}: {
  variant: 'desktop' | 'mobile'
  query: string
  products: Product[]
  onQueryChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onPickProduct: (product: Product) => void
  onSeeAll: (raw: string) => void
}) {
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const matches = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    const visible = products.filter((p) => p.visible !== false)
    return filterProductsByQuery(visible, q).slice(0, 8)
  }, [products, query])

  const showPanel = open && query.trim().length >= 2

  useEffect(() => {
    setActive(-1)
  }, [query])

  useEffect(() => {
    if (!showPanel) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [showPanel])

  useEffect(() => {
    if (!showPanel) return
    const el = panelRef.current
    if (!el) return
    return attachNestedScrollWheel(el)
  }, [showPanel, matches.length])

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!showPanel || matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0 && matches[active]) {
      e.preventDefault()
      onPickProduct(matches[active])
      setOpen(false)
      e.currentTarget.blur()
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setOpen(false)
    onSubmit(e)
    const input = rootRef.current?.querySelector('input')
    input?.blur()
  }

  return (
    <form ref={rootRef} onSubmit={handleSubmit} className="relative block w-full">
      <label className="block w-full">
        <span className="sr-only">Buscar productos</span>
        {variant === 'desktop' ? (
          <div className="flex w-full overflow-hidden rounded-md border border-rosver-line">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Buscar por nombre, marca o SKU..."
              className="w-full px-3 py-2.5 text-sm outline-none focus:bg-rosver-soft/40"
              role="combobox"
              aria-expanded={showPanel}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="flex shrink-0 items-center justify-center bg-rosver-red px-4 text-white transition hover:bg-rosver-red-dark"
            >
              <IconSearch />
            </button>
          </div>
        ) : (
          <>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Buscar por nombre, marca o SKU..."
              className="w-full rounded-full border border-rosver-line bg-rosver-soft py-2.5 pr-12 pl-4 text-sm outline-none focus:border-rosver-red/50 focus:bg-white"
              role="combobox"
              aria-expanded={showPanel}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute top-1/2 right-1.5 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-rosver-red text-white hover:bg-rosver-red-dark"
            >
              <IconSearch className="size-4" />
            </button>
          </>
        )}
      </label>

      {showPanel ? (
        <div
          ref={panelRef}
          id={listId}
          role="listbox"
          data-lenis-prevent
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[min(70vh,22rem)] overflow-y-auto overscroll-contain rounded-lg border border-rosver-line bg-white shadow-[0_12px_32px_rgba(17,17,17,0.12)]"
        >
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-rosver-muted">
              Ningún producto encontrado
            </p>
          ) : (
            <ul className="py-1">
              {matches.map((product, index) => (
                <li key={product.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      onPickProduct(product)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition',
                      index === active ? 'bg-rosver-soft' : 'hover:bg-rosver-soft/70',
                    )}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-rosver-soft text-rosver-muted">
                        <IconSearch className="size-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-rosver-ink">
                        {product.name}
                      </span>
                      <span className="block truncate text-[11px] text-rosver-muted">
                        {product.sku}
                        {product.vendor ? ` · ${product.vendor}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              onSeeAll(query)
              setOpen(false)
              rootRef.current?.querySelector('input')?.blur()
            }}
            className="flex w-full items-center justify-between border-t border-rosver-line px-3 py-2.5 text-left text-xs font-bold text-rosver-red transition hover:bg-rosver-soft"
          >
            <span>Ver todos en catálogo</span>
            <span aria-hidden>→</span>
          </button>
        </div>
      ) : null}
    </form>
  )
}
