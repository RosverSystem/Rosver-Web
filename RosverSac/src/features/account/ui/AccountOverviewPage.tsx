import { ORDERS, ORDER_STATUS_TONE } from '@/features/account/model/mocks'
import { shortDisplayName, useAuth } from '@/features/auth'
import { QUOTES, QUOTE_STATUS_TONE } from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { Link } from 'react-router-dom'

export function AccountOverviewPage() {
  const { user } = useAuth()
  const lastOrder = ORDERS[0]
  const lastQuote = QUOTES[0]
  const first = user ? shortDisplayName(user) : null

  return (
    <div className="flex flex-col gap-5">
      {user ? (
        <section className="relative overflow-hidden rounded-2xl border border-rosver-line bg-gradient-to-br from-white via-white to-rosver-soft px-5 py-5 sm:px-6">
          <div
            className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-rosver-red/5"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={user.avatarUrl}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-bold text-rosver-ink">
                {user.fullName?.trim() || first}
              </p>
              <p className="truncate text-sm text-rosver-muted">{user.email}</p>
              <p className="mt-1 text-xs text-rosver-muted">
                <span className="rounded bg-rosver-ink px-1.5 py-0.5 font-bold text-white uppercase">
                  {user.roleName}
                </span>
                {user.phone ? (
                  <span className="ml-2">{user.phone}</span>
                ) : (
                  <span className="ml-2 text-rosver-red">Falta teléfono</span>
                )}
              </p>
            </div>
            <Link
              to="/cuenta/perfil"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white uppercase hover:bg-rosver-red-dark"
            >
              Editar perfil
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-rosver-line bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-widest text-rosver-muted uppercase">
              Último pedido
            </h2>
            <span className="rounded bg-rosver-yellow/80 px-1.5 py-0.5 text-[10px] font-bold text-rosver-ink">
              Demo
            </span>
          </div>
          {lastOrder ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-rosver-ink">{lastOrder.id}</p>
                <p className="mt-0.5 text-sm text-rosver-muted">
                  {lastOrder.itemsSummary}
                </p>
              </div>
              <Badge tone={ORDER_STATUS_TONE[lastOrder.status]}>
                {lastOrder.status}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-rosver-muted">Sin pedidos todavía.</p>
          )}
          <Link
            to="/cuenta/pedidos"
            className="mt-4 inline-block text-xs font-bold text-rosver-red uppercase"
          >
            Ver pedidos →
          </Link>
        </section>

        <section className="rounded-2xl border border-rosver-line bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-widest text-rosver-muted uppercase">
              Última cotización
            </h2>
            <span className="rounded bg-rosver-yellow/80 px-1.5 py-0.5 text-[10px] font-bold text-rosver-ink">
              Demo
            </span>
          </div>
          {lastQuote ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-rosver-ink">{lastQuote.id}</p>
                <p className="mt-0.5 text-sm text-rosver-muted">
                  {lastQuote.itemsSummary}
                </p>
              </div>
              <Badge tone={QUOTE_STATUS_TONE[lastQuote.status]}>
                {lastQuote.status}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-rosver-muted">Sin cotizaciones todavía.</p>
          )}
          <Link
            to="/cuenta/cotizaciones"
            className="mt-4 inline-block text-xs font-bold text-rosver-red uppercase"
          >
            Ver cotizaciones →
          </Link>
        </section>
      </div>
    </div>
  )
}
