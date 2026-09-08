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
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-24 pt-3 lg:px-6">
      <section
        className="relative overflow-hidden rounded-3xl bg-rosver-ink text-white shadow-sm"
        aria-labelledby="cuenta-banner-title"
      >
        {/* Patrón geométrico liviano (CSS) — estilo marca, sin bitmap */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 40%, #E30613 40%, #E30613 42%, transparent 42%), linear-gradient(45deg, transparent 60%, #E30613 60%, #E30613 62%, transparent 62%), radial-gradient(circle at 90% 20%, #E30613 0 8%, transparent 9%)',
            backgroundSize: '48px 48px, 36px 36px, 100% 100%',
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 -bottom-20 size-56 rounded-full bg-rosver-red/30 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-0 left-0 h-full w-1.5 bg-rosver-red"
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7">
          <div className="flex min-w-0 items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                width={72}
                height={72}
                className="size-[4.5rem] shrink-0 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.22em] text-white/70 uppercase">
                Área cliente
              </p>
              <h1
                id="cuenta-banner-title"
                className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Mi cuenta
              </h1>
              {greet ? (
                <p className="mt-2 text-base text-white/90 sm:text-lg">
                  Hola,{' '}
                  <span className="font-bold text-white">{greet}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-white/70">
                  Gestiona pedidos, cotizaciones y tu perfil
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-full bg-rosver-blue px-4 py-2.5 text-xs font-bold text-white uppercase hover:brightness-110"
              >
                SystemRSV
              </Link>
            ) : null}
            <Link
              to="/cuenta/perfil"
              className="rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white uppercase hover:bg-rosver-red-dark"
            >
              Editar perfil
            </Link>
          </div>
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-rosver-line bg-rosver-soft p-1.5">
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
                'shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold uppercase transition',
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
