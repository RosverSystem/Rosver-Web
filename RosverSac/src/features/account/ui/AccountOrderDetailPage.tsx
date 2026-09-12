import { fetchMyOrder } from '@/features/account/model/api-orders'
import { readLocalOrders } from '@/features/account/model/local-orders'
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STEPS,
  ORDER_STATUS_TONE,
  type Order,
} from '@/features/account/model/mocks'
import { useAuth } from '@/features/auth'
import { Badge } from '@/shared/ui/badge'
import { StatusStepper } from '@/shared/ui/status-stepper'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export function AccountOrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const code = id ? decodeURIComponent(id) : ''
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!code) {
        setOrder(null)
        setLoading(false)
        return
      }
      if (user && !code.startsWith('LOC-')) {
        const remote = await fetchMyOrder(code)
        if (!cancelled) {
          setOrder(remote)
          setLoading(false)
        }
        return
      }
      const local = readLocalOrders().find((o) => o.id === code) ?? null
      if (!cancelled) {
        setOrder(local)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [code, user])

  if (loading) {
    return (
      <p className="rounded-2xl border border-rosver-line bg-white px-4 py-10 text-center text-sm text-rosver-muted">
        Cargando pedido…
      </p>
    )
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-rosver-line bg-white px-4 py-8 text-center sm:px-6">
        <p className="text-sm font-semibold text-rosver-ink">
          No encontramos este pedido
        </p>
        <Link
          to="/cuenta/pedidos"
          className="mt-3 inline-block text-xs font-bold text-rosver-red uppercase"
        >
          ← Volver a mis pedidos
        </Link>
      </div>
    )
  }

  const stepIndex = Math.max(0, ORDER_STATUS_STEPS.indexOf(order.status))

  return (
    <article className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rosver-line bg-rosver-soft/50 px-4 py-4 sm:px-6">
        <div>
          <Link
            to="/cuenta/pedidos"
            className="text-xs font-bold text-rosver-red uppercase"
          >
            ← Mis pedidos
          </Link>
          <h2 className="mt-1 font-display text-xl font-bold text-rosver-ink">
            Pedido {order.id}
          </h2>
          <p className="text-sm text-rosver-muted">{order.date}</p>
        </div>
        <Badge tone={ORDER_STATUS_TONE[order.status]}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <StatusStepper
          currentIndex={stepIndex}
          steps={ORDER_STATUS_STEPS.map((key) => ({
            key,
            label: ORDER_STATUS_LABEL[key],
          }))}
        />
        {order.trackingHint ? (
          <p className="rounded-xl bg-rosver-blue/10 px-3 py-2 text-sm text-rosver-blue">
            {order.trackingHint}
          </p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={item.name}
              className="flex gap-3 rounded-xl border border-rosver-line p-3"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="size-20 rounded-xl object-cover"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-xl bg-rosver-soft text-[10px] font-bold text-rosver-muted">
                  N/A
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rosver-ink">{item.name}</p>
                <p className="text-sm text-rosver-muted">Cantidad: {item.qty}</p>
                <p className="mt-1 font-bold text-rosver-ink">
                  S/ {(item.unitPrice * item.qty).toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-right text-lg font-bold text-rosver-ink">
          Total: S/ {order.total.toFixed(2)}
        </p>
      </div>
    </article>
  )
}
