import { fetchMyOrders } from '@/features/account/model/api-orders'
import { shortDisplayName, useAuth } from '@/features/auth'
import { fetchMyQuotes } from '@/features/quotes'
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  type Order,
} from '@/features/account/model/mocks'
import {
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_TONE,
  type Quote,
} from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function AccountOverviewPage() {
  const { user } = useAuth()
  const first = user ? shortDisplayName(user) : null
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [lastQuote, setLastQuote] = useState<Quote | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setLastOrder(null)
        setLastQuote(null)
        return
      }
      try {
        const [orders, quotes] = await Promise.all([
          fetchMyOrders(),
          fetchMyQuotes(),
        ])
        if (cancelled) return
        setLastOrder(orders[0] ?? null)
        setLastQuote(quotes[0] ?? null)
      } catch {
        if (!cancelled) {
          setLastOrder(null)
          setLastQuote(null)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="flex flex-col gap-5">
      {user ? (
        <section className="relative overflow-hidden rounded-2xl border border-rosver-line bg-gradient-to-br from-white via-white to-rosver-soft px-5 py-5 shadow-sm sm:px-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-widest text-rosver-muted uppercase">
              Último pedido o compra
            </h2>
            {lastOrder ? (
              <Badge tone={ORDER_STATUS_TONE[lastOrder.status]}>
                {ORDER_STATUS_LABEL[lastOrder.status]}
              </Badge>
            ) : null}
          </div>
          {lastOrder ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {lastOrder.items.map((item) =>
                  item.imageUrl ? (
                    <img
                      key={item.name}
                      src={item.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-rosver-line"
                    />
                  ) : null,
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-rosver-ink">
                {lastOrder.id}
              </p>
              <p className="text-sm text-rosver-muted">{lastOrder.itemsSummary}</p>
              <p className="mt-1 font-bold text-rosver-ink">
                S/ {lastOrder.total.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-sm text-rosver-muted">Sin pedidos todavía.</p>
          )}
          <Link
            to="/cuenta/pedidos"
            className="mt-4 inline-block text-xs font-bold text-rosver-red uppercase"
          >
            Ver mis pedidos →
          </Link>
        </section>

        <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-widest text-rosver-muted uppercase">
              Última cotización
            </h2>
            {lastQuote ? (
              <Badge tone={QUOTE_STATUS_TONE[lastQuote.status]}>
                {QUOTE_STATUS_LABEL[lastQuote.status]}
              </Badge>
            ) : null}
          </div>
          {lastQuote ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {lastQuote.items.map((item) =>
                  item.imageUrl ? (
                    <img
                      key={item.name}
                      src={item.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-rosver-line"
                    />
                  ) : null,
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-rosver-ink">
                {lastQuote.id}
              </p>
              <p className="text-sm text-rosver-muted">
                {lastQuote.itemsSummary}
              </p>
            </>
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
