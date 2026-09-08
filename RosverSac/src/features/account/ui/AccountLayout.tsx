import { shortDisplayName, useAuth } from '@/features/auth'
import { cn } from '@/shared/lib'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { name: 'Resumen', link: '/cuenta' },
  { name: 'Pedidos', link: '/cuenta/pedidos' },
  { name: 'Cotizaciones', link: '/cuenta/cotizaciones' },
  { name: 'Perfil', link: '/cuenta/perfil' },
]

export function AccountLayout() {
  const { pathname } = useLocation()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const greet = user ? shortDisplayName(user) : null

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-24 lg:px-6">
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-rosver-ink uppercase">
            Mi cuenta
          </h1>
          {greet ? (
            <p className="mt-1 text-sm text-rosver-muted">
              Hola, <span className="font-semibold text-rosver-ink">{greet}</span>
              {user?.email ? (
                <span className="text-rosver-muted"> · {user.email}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <Link
              to="/admin"
              className="rounded-full border border-rosver-blue px-3 py-2 text-xs font-bold text-rosver-blue uppercase"
            >
              SystemRSV
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void onLogout()}
            className="rounded-full border border-rosver-line px-3 py-2 text-xs font-bold text-rosver-ink uppercase transition hover:border-rosver-red hover:text-rosver-red"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

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
