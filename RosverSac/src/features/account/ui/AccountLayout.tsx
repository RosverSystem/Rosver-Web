import { shortDisplayName, useAuth } from '@/features/auth'
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
  const { user, isAdmin } = useAuth()
  const greet = user ? shortDisplayName(user) : null

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-24 pt-2 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rosver-line pb-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-rosver-muted uppercase">
            Área cliente
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
            Mi cuenta
          </h1>
          {greet ? (
            <p className="mt-1 text-sm text-rosver-muted">
              Hola,{' '}
              <span className="font-semibold text-rosver-ink">{greet}</span>
            </p>
          ) : null}
        </div>
        {isAdmin ? (
          <Link
            to="/admin"
            className="rounded-full bg-rosver-blue px-4 py-2 text-xs font-bold text-white uppercase"
          >
            Ir a SystemRSV
          </Link>
        ) : null}
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-rosver-soft p-1">
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
                'shrink-0 rounded-lg px-3 py-2.5 text-sm font-bold uppercase transition',
                active
                  ? 'bg-white text-rosver-red shadow-sm'
                  : 'text-rosver-muted hover:text-rosver-ink',
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
