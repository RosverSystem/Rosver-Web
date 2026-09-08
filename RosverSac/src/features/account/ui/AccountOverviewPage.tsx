import { ORDERS, ORDER_STATUS_TONE } from '@/features/account/model/mocks'
import { shortDisplayName, useAuth } from '@/features/auth'
import { QUOTES, QUOTE_STATUS_TONE } from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'
import { Link } from 'react-router-dom'

export function AccountOverviewPage() {
  const { user } = useAuth()
  const lastOrder = ORDERS[0]
  const lastQuote = QUOTES[0]
  const name = user ? shortDisplayName(user) : null

  return (
    <div className="flex flex-col gap-4">
      {user ? (
        <div className="flex items-center gap-3 rounded-xl border border-rosver-line bg-rosver-soft/60 px-4 py-3">
          <img
            src={user.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-full object-cover ring-1 ring-rosver-line"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-rosver-ink">
              {user.fullName?.trim() || name}
            </p>
            <p className="truncate text-sm text-rosver-muted">{user.email}</p>
            <p className="text-xs text-rosver-muted">
              Rol: {user.roleName}
              {user.phone ? ` · ${user.phone}` : ' · Completa tu teléfono en Perfil'}
            </p>
          </div>
          <Link
            to="/cuenta/perfil"
            className="ml-auto shrink-0 text-xs font-bold text-rosver-red uppercase"
          >
            Editar perfil →
          </Link>
        </div>
      ) : null}

      <p className="text-xs text-rosver-muted">
        Pedidos y cotizaciones abajo son demo hasta conectar la API real.
      </p>

      <WireBlock label="Último pedido">
        {lastOrder ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-rosver-ink">{lastOrder.id}</p>
              <p className="text-rosver-muted">{lastOrder.itemsSummary}</p>
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
          className="mt-3 inline-block text-xs font-semibold text-rosver-red"
        >
          Ver todos los pedidos →
        </Link>
      </WireBlock>

      <WireBlock label="Última cotización">
        {lastQuote ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-rosver-ink">{lastQuote.id}</p>
              <p className="text-rosver-muted">{lastQuote.itemsSummary}</p>
            </div>
            <Badge tone={QUOTE_STATUS_TONE[lastQuote.status]}>
              {lastQuote.status}
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-rosver-muted">
            Sin cotizaciones todavía.
          </p>
        )}
        <Link
          to="/cuenta/cotizaciones"
          className="mt-3 inline-block text-xs font-semibold text-rosver-red"
        >
          Ver todas las cotizaciones →
        </Link>
      </WireBlock>
    </div>
  )
}
