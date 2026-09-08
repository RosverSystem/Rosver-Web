import { ORDERS, ORDER_STATUS_TONE } from '@/features/account/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'
import { Link, useParams } from 'react-router-dom'

export function AccountOrderDetailPage() {
  const { id } = useParams()
  const order = ORDERS.find((o) => o.id === id) ?? ORDERS[0]

  return (
    <WireBlock label={`Pedido ${order.id}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-rosver-muted">{order.date}</p>
        <Badge tone={ORDER_STATUS_TONE[order.status]}>{order.status}</Badge>
      </div>
      <p className="mt-3 text-sm text-rosver-ink">{order.itemsSummary}</p>
      <p className="mt-3 text-lg font-bold text-rosver-ink">
        Total: S/ {order.total.toFixed(2)}
      </p>
      <Link
        to="/cuenta/pedidos"
        className="mt-4 inline-block text-xs font-semibold text-rosver-red"
      >
        ← Volver a pedidos
      </Link>
    </WireBlock>
  )
}
