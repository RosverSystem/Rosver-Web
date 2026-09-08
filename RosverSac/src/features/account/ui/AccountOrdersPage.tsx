import { readLocalOrders } from '@/features/account/model/local-orders'
import {
  ORDERS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STEPS,
  ORDER_STATUS_TONE,
  type Order,
} from '@/features/account/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { StatusStepper } from '@/shared/ui/status-stepper'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function OrderCard({ order }: { order: Order }) {
  const stepIndex = Math.max(0, ORDER_STATUS_STEPS.indexOf(order.status))

  return (
    <article className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rosver-line bg-rosver-soft/50 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-bold text-rosver-ink">
            Pedido {order.id}
          </p>
          <p className="text-xs text-rosver-muted">Realizado el {order.date}</p>
        </div>
        <Badge tone={ORDER_STATUS_TONE[order.status]}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <StatusStepper
          currentIndex={stepIndex}
          steps={ORDER_STATUS_STEPS.map((key) => ({
            key,
            label: ORDER_STATUS_LABEL[key],
          }))}
        />
        {order.trackingHint ? (
          <p className="mt-3 text-xs font-medium text-rosver-blue">
            {order.trackingHint}
          </p>
        ) : null}

        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={`${order.id}-${item.name}`} className="flex gap-3">
              <img
                src={item.imageUrl}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-rosver-line"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden'
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-rosver-ink">
                  {item.name}
                </p>
                <p className="text-xs text-rosver-muted">Cant. {item.qty}</p>
                <p className="mt-0.5 text-sm font-bold text-rosver-ink">
                  S/ {(item.unitPrice * item.qty).toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rosver-line px-4 py-3 sm:px-5">
        <p className="text-sm text-rosver-muted">
          Total{' '}
          <span className="text-base font-bold text-rosver-ink">
            S/ {order.total.toFixed(2)}
          </span>
        </p>
        <Link
          to={`/cuenta/pedidos/${order.id}`}
          className="rounded-full bg-rosver-ink px-4 py-2 text-xs font-bold text-white uppercase hover:bg-rosver-red"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  )
}

function mergeOrders(): Order[] {
  const local = readLocalOrders()
  const ids = new Set(local.map((o) => o.id))
  return [...local, ...ORDERS.filter((o) => !ids.has(o.id))]
}

export function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(() => mergeOrders())

  useEffect(() => {
    function reload() {
      setOrders(mergeOrders())
    }
    reload()
    window.addEventListener('focus', reload)
    window.addEventListener('storage', reload)
    return () => {
      window.removeEventListener('focus', reload)
      window.removeEventListener('storage', reload)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-rosver-ink">
            Mis pedidos
          </h2>
          <p className="text-sm text-rosver-muted">
            Pedidos desde el carrito (sesión) + demos de seguimiento
          </p>
        </div>
        <span className="rounded-full bg-rosver-soft px-2.5 py-1 text-[10px] font-bold text-rosver-muted">
          Local + demo
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
