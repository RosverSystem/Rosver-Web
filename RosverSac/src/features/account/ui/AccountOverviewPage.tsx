import { ORDERS, ORDER_STATUS_TONE } from '@/features/account/model/mocks'
import { QUOTES, QUOTE_STATUS_TONE } from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'
import { Link } from 'react-router-dom'

export function AccountOverviewPage() {
  const lastOrder = ORDERS[0]
  const lastQuote = QUOTES[0]

  return (
    <div className="flex flex-col gap-4">
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
