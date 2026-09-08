import { SessionAccountMenu } from '@/features/auth'
import { useCart } from '@/features/cart'
import { useCatalog } from '@/features/catalog'
import { cn } from '@/shared/lib'
import { IconBag, IconChevronDown, IconSearch } from '@/shared/ui/icons'
import { Check, Compass, Message, Phone } from 'cssvg-icons'
import { Heart, Menu, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { name: 'Inicio', link: '/' },
  { name: 'Catálogo', link: '/catalogo' },
  { name: 'Ofertas', link: '/ofertas', tag: 'OFERTA' },
  { name: 'Contacto', link: '/contacto' },
  { name: 'Cotizar', link: '/cotizar', tag: 'NUEVO' },
] as const

export function PublicNavbar() {
  const { pathname } = useLocation()
  const { itemCount } = useCart()
  const { categories } = useCatalog()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [query, setQuery] = useState('')

  const navCategories = useMemo(() => {
    const visible = categories.filter((c) => c.visible !== false && c.showInNav !== false)
    const roots = visible.filter((c) => !c.parentId)
    return roots
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((root) => ({
        root,
        children: visible
          .filter((c) => c.parentId === root.id)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      }))
  }, [categories])

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
            <p className="flex items-center gap-1.5 font-medium text-white/90">
              <span className="text-rosver-red" aria-hidden>
                <Compass size={14} color="currentColor" strokeWidth={2} />
              </span>
              <span className="truncate">Envíos a nivel nacional</span>
            </p>
            <span className="hidden h-3 w-px bg-white/20 md:block" aria-hidden />
            <p className="hidden items-center gap-1.5 font-medium text-white/90 md:flex">
              <span className="text-rosver-red" aria-hidden>
                <Check size={14} color="currentColor" strokeWidth={2} />
              </span>
              Cotiza sin compromiso
            </p>
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

        <label className="hidden min-w-0 justify-self-center lg:block lg:w-full">
          <span className="sr-only">Buscar productos</span>
          <div className="flex w-full overflow-hidden rounded-md border border-rosver-line">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full px-3 py-2.5 text-sm outline-none focus:bg-rosver-soft/40"
            />
            <button
              type="button"
              aria-label="Buscar"
              className="flex shrink-0 items-center justify-center bg-rosver-red px-4 text-white transition hover:bg-rosver-red-dark"
            >
              <IconSearch />
            </button>
          </div>
        </label>

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
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-full border border-rosver-line bg-rosver-soft py-2.5 pr-10 pl-4 text-sm outline-none focus:border-rosver-red/50 focus:bg-white"
          />
          <IconSearch className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-rosver-muted" />
        </label>
      </div>

      <nav className="hidden bg-rosver-red text-white lg:block">
        <div className="relative mx-auto flex max-w-7xl items-center px-6">
          <button
            type="button"
            onClick={() => setCategoriesOpen((v) => !v)}
            aria-expanded={categoriesOpen}
            className="flex items-center gap-2 border-r border-white/20 py-3 pr-4 text-sm font-bold uppercase transition hover:bg-white/10"
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
            <div className="absolute top-full left-6 z-30 max-h-[75vh] w-[min(92vw,52rem)] overflow-y-auto border border-rosver-line bg-white p-4 text-rosver-ink shadow-[0_16px_40px_rgba(17,17,17,0.14)]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {navCategories.map(({ root, children }) => (
                  <div key={root.id} className="min-w-0">
                    <Link
                      to={`/catalogo/${root.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-rosver-soft"
                    >
                      {root.imageUrl ? (
                        <img
                          src={root.imageUrl}
                          alt=""
                          width={44}
                          height={44}
                          className="size-11 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-rosver-soft text-rosver-ink">
                          <root.icon className="size-5" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-rosver-ink">
                          {root.name}
                        </span>
                        {root.tagline ? (
                          <span className="block truncate text-[11px] text-rosver-muted">
                            {root.tagline}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                    {children.length ? (
                      <ul className="mt-1 space-y-0.5 border-l border-rosver-line pl-3 ml-2">
                        {children.map((ch) => (
                          <li key={ch.id}>
                            <Link
                              to={`/catalogo/${ch.slug}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="block rounded-md px-2 py-1.5 text-xs text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-red"
                            >
                              {ch.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
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
