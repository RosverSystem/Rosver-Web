import { ORDERS, ORDER_STATUS_TONE } from '@/features/account/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'
import { Link } from 'react-router-dom'

export function AccountOrdersPage() {
  return (
    <WireBlock label="Historial de pedidos">
      <div className="flex flex-col divide-y divide-dashed divide-rosver-line">
        {ORDERS.map((order) => (
          <Link
            key={order.id}
            to={`/cuenta/pedidos/${order.id}`}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-rosver-ink">
                {order.id} · {order.date}
              </p>
              <p className="text-xs text-rosver-muted">{order.itemsSummary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-rosver-ink">
                S/ {order.total.toFixed(2)}
              </span>
              <Badge tone={ORDER_STATUS_TONE[order.status]}>
                {order.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </WireBlock>
  )
}
