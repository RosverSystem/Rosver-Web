import { cn } from '@/shared/lib'
import { IconUser } from '@/shared/ui/icons'
import { Link, Outlet, useLocation } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    title: 'General',
    items: [{ name: 'Dashboard', link: '/admin' }],
  },
  {
    title: 'Catálogo',
    items: [
      { name: 'Productos', link: '/admin/productos' },
      { name: 'Categorías', link: '/admin/categorias' },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { name: 'Leads', link: '/admin/leads' },
      { name: 'Cotizaciones', link: '/admin/cotizaciones' },
      { name: 'Pedidos', link: '/admin/pedidos' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { name: 'Contenido web', link: '/admin/contenido' },
      { name: 'Usuarios', link: '/admin/usuarios' },
    ],
  },
]

export function AdminShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-white lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-rosver-line px-4 py-6 lg:block">
        <Link
          to="/admin"
          className="mb-6 block font-display text-xl font-bold tracking-tight"
        >
          <span className="text-rosver-red italic">ROS</span>
          <span className="text-rosver-ink italic">VER</span>
          <span className="ml-1 text-xs font-semibold text-rosver-muted not-italic">
            admin
          </span>
        </Link>

        <nav className="flex flex-col gap-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 text-[11px] font-bold tracking-widest text-rosver-muted uppercase">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active =
                    item.link === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.link)
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      className={cn(
                        'rounded-lg px-2.5 py-2 text-sm font-semibold',
                        active
                          ? 'bg-rosver-soft text-rosver-red'
                          : 'text-rosver-ink hover:bg-rosver-soft',
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-rosver-line px-4 py-3 lg:px-8">
          <Link
            to="/admin"
            className="font-display text-lg font-bold tracking-tight lg:hidden"
          >
            <span className="text-rosver-red italic">ROS</span>
            <span className="text-rosver-ink italic">VER</span>
          </Link>
          <span className="hidden text-sm text-rosver-muted lg:inline">
            Panel de gestión
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-rosver-ink">
              Ana Torres
              <span className="ml-1.5 text-xs font-normal text-rosver-muted">
                (admin)
              </span>
            </span>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-rosver-ink text-white">
              <IconUser />
            </span>
            <Link to="/login" className="text-xs font-semibold text-rosver-muted hover:text-rosver-red">
              Salir
            </Link>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-rosver-line px-4 py-2 lg:hidden">
          {NAV_SECTIONS.flatMap((section) => section.items).map((item) => {
            const active =
              item.link === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.link)
            return (
              <Link
                key={item.link}
                to={item.link}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                  active
                    ? 'bg-rosver-red text-white'
                    : 'bg-rosver-soft text-rosver-muted',
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
