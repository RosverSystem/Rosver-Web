import { ORDERS, ORDER_STATUS_TONE } from '@/features/account/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { Link } from 'react-router-dom'

export function AccountOrdersPage() {
  return (
    <section className="rounded-2xl border border-rosver-line bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-rosver-line px-4 py-3 sm:px-5">
        <h2 className="font-display text-base font-bold text-rosver-ink">
          Historial de pedidos
        </h2>
        <span className="rounded bg-rosver-yellow/80 px-1.5 py-0.5 text-[10px] font-bold text-rosver-ink">
          Demo
        </span>
      </div>
      <ul className="divide-y divide-rosver-line">
        {ORDERS.map((order) => (
          <li key={order.id}>
            <Link
              to={`/cuenta/pedidos/${order.id}`}
              className="flex flex-col gap-2 px-4 py-4 transition hover:bg-rosver-soft/60 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-rosver-ink">
                  {order.id}
                  <span className="ml-2 font-normal text-rosver-muted">
                    {order.date}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-rosver-muted">
                  {order.itemsSummary}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-bold text-rosver-ink">
                  S/ {order.total.toFixed(2)}
                </span>
                <Badge tone={ORDER_STATUS_TONE[order.status]}>
                  {order.status}
                </Badge>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
