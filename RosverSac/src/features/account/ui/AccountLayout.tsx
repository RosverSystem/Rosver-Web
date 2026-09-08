import { cn } from '@/shared/lib'
import { Link, Outlet, useLocation } from 'react-router-dom'

const TABS = [
  { name: 'Resumen', link: '/cuenta' },
  { name: 'Pedidos', link: '/cuenta/pedidos' },
  { name: 'Cotizaciones', link: '/cuenta/cotizaciones' },
  { name: 'Perfil', link: '/cuenta/perfil' },
]

export function AccountLayout() {
  const { pathname } = useLocation()

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-24 lg:px-6">
      <h1 className="mt-4 font-display text-2xl font-bold text-rosver-ink uppercase">
        Mi cuenta
      </h1>

      <nav className="flex gap-1 overflow-x-auto border-b border-rosver-line">
        {TABS.map((tab) => {
          const active =
            tab.link === '/cuenta'
              ? pathname === '/cuenta'
              : pathname.startsWith(tab.link)
          return (
            <Link
              key={tab.link}
              to={tab.link}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-bold uppercase',
                active
                  ? 'border-rosver-red text-rosver-red'
                  : 'border-transparent text-rosver-muted hover:text-rosver-ink',
              )}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>

      <Outlet />
    </main>
  )
}
