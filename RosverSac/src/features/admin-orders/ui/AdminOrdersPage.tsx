import { ORDERS, ORDER_STATUS_TONE } from '@/features/admin-orders/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'

export function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        Pedidos
      </h1>

      <WireBlock label="Listado con estados">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-rosver-line text-xs text-rosver-muted uppercase">
                <th className="pb-2 font-semibold">ID</th>
                <th className="pb-2 font-semibold">Cliente</th>
                <th className="pb-2 font-semibold">Fecha</th>
                <th className="pb-2 font-semibold">Total</th>
                <th className="pb-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-rosver-line">
              {ORDERS.map((order) => (
                <tr key={order.id}>
                  <td className="py-2.5 font-semibold text-rosver-ink">
                    {order.id}
                  </td>
                  <td className="py-2.5">{order.customerName}</td>
                  <td className="py-2.5 text-rosver-muted">{order.date}</td>
                  <td className="py-2.5 font-semibold text-rosver-ink">
                    S/ {order.total.toFixed(2)}
                  </td>
                  <td className="py-2.5">
                    <Badge tone={ORDER_STATUS_TONE[order.status]}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WireBlock>
    </div>
  )
}
