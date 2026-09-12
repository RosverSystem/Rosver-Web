import { fetchMyOrders } from '@/features/account/model/api-orders'
import { readLocalOrders } from '@/features/account/model/local-orders'
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STEPS,
  ORDER_STATUS_TONE,
  type Order,
  type OrderStatus,
} from '@/features/account/model/mocks'
import { useAuth } from '@/features/auth'
import { AdminSelect } from '@/shared/ui/admin-field'
import { AdminModuleBanner } from '@/shared/ui/admin-module-banner'
import { Badge } from '@/shared/ui/badge'
import { StatusStepper } from '@/shared/ui/status-stepper'
import { Search } from 'cssvg-icons'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type FilterKey = 'all' | OrderStatus
type PeriodKey = 'all' | '30d' | '90d' | 'year'

function isLocalOrder(id: string) {
  return id.startsWith('LOC-')
}

function matchesQuery(order: Order, q: string) {
  if (!q) return true
  const hay = [
    order.id,
    order.date,
    order.itemsSummary,
    order.trackingHint ?? '',
    ...order.items.map((i) => i.name),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

function inPeriod(order: Order, period: PeriodKey) {
  if (period === 'all') return true
  const t = Date.parse(order.date)
  if (!Number.isFinite(t)) return true
  const now = Date.now()
  if (period === '30d') return now - t <= 30 * 86400000
  if (period === '90d') return now - t <= 90 * 86400000
  if (period === 'year') {
    return new Date(t).getFullYear() === new Date().getFullYear()
  }
  return true
}

function OrderCard({ order }: { order: Order }) {
  const stepIndex = Math.max(0, ORDER_STATUS_STEPS.indexOf(order.status))
  const local = isLocalOrder(order.id)

  return (
    <article className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rosver-line bg-rosver-soft/50 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-rosver-ink">
              {local ? 'Compra' : 'Pedido'} {order.id}
            </p>
            {local ? (
              <span className="rounded-full bg-rosver-yellow/80 px-2 py-0.5 text-[10px] font-bold text-rosver-ink">
                Desde carrito
              </span>
            ) : null}
          </div>
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
              {item.imageUrl ? (
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
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-rosver-soft text-[9px] font-bold text-rosver-muted ring-1 ring-rosver-line">
                  N/A
                </span>
              )}
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
          to={`/cuenta/pedidos/${encodeURIComponent(order.id)}`}
          className="rounded-full bg-rosver-ink px-4 py-2 text-xs font-bold text-white uppercase hover:bg-rosver-red"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  )
}

export function AccountOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (user) {
          const remote = await fetchMyOrders()
          if (!cancelled) setOrders(remote)
        } else {
          if (!cancelled) setOrders(readLocalOrders())
        }
      } catch {
        if (!cancelled) {
          setOrders(readLocalOrders())
          setError('No se pudieron cargar los pedidos del servidor.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    function reload() {
      void load()
    }
    window.addEventListener('focus', reload)
    return () => {
      cancelled = true
      window.removeEventListener('focus', reload)
    }
  }, [user])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (!inPeriod(o, period)) return false
      return matchesQuery(o, q)
    })
  }, [orders, filter, period, deferredQuery])

  const filteredSpend = useMemo(
    () => filtered.reduce((sum, o) => sum + o.total, 0),
    [filtered],
  )

  const totalSpend = useMemo(
    () => orders.reduce((sum, o) => sum + o.total, 0),
    [orders],
  )

  const orderStats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'entregado').length
    const delivered = orders.filter((o) => o.status === 'entregado').length
    return { total: orders.length, active, delivered }
  }, [orders])

  const hasActiveFilters =
    Boolean(query.trim()) || filter !== 'all' || period !== 'all'

  return (
    <div className="flex flex-col gap-4">
      <AdminModuleBanner
        eyebrow="Cuenta"
        title="Mis pedidos o compras"
        description="Seguimiento en vivo de tus pedidos del carrito."
        stats={[
          { label: 'Total', value: orderStats.total },
          { label: 'En curso', value: orderStats.active, tone: 'warning' },
          { label: 'Entregados', value: orderStats.delivered, tone: 'success' },
          { label: 'Gastado', value: `S/ ${totalSpend.toFixed(2)}` },
        ]}
      />

      {error ? (
        <p className="rounded-xl border border-rosver-yellow/50 bg-rosver-yellow/15 px-3 py-2 text-xs font-medium text-rosver-ink">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-rosver-line bg-gradient-to-br from-white via-white to-rosver-soft/60 p-4 shadow-sm sm:flex-row sm:items-end sm:gap-3">
        <label className="block min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Buscar
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-rosver-red">
              <Search size={18} color="currentColor" strokeWidth={2} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Código, producto, fecha o seguimiento…"
              className="w-full rounded-xl border border-rosver-line bg-white py-2.5 pr-3 pl-10 text-sm text-rosver-ink outline-none placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/15"
            />
          </div>
        </label>
        <label className="block w-full sm:w-52">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Estado
          </span>
          <AdminSelect
            value={filter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || ORDER_STATUS_STEPS.includes(v as OrderStatus)) {
                setFilter(v as FilterKey)
              }
            }}
          >
            <option value="all">Todos los estados</option>
            {ORDER_STATUS_STEPS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </AdminSelect>
        </label>
        <label className="block w-full sm:w-44">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Periodo
          </span>
          <AdminSelect
            value={period}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || v === '30d' || v === '90d' || v === 'year') {
                setPeriod(v)
              }
            }}
          >
            <option value="all">Todo el tiempo</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="year">Este año</option>
          </AdminSelect>
        </label>
      </div>

      {!loading && hasActiveFilters ? (
        <p className="text-xs font-medium text-rosver-muted">
          Mostrando {filtered.length} pedido
          {filtered.length === 1 ? '' : 's'}
          {filtered.length > 0 ? ` · S/ ${filteredSpend.toFixed(2)}` : ''}
          {' · '}
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setFilter('all')
              setPeriod('all')
            }}
            className="font-bold text-rosver-red hover:underline"
          >
            Limpiar filtros
          </button>
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-rosver-line bg-white px-4 py-10 text-center text-sm text-rosver-muted">
          Cargando pedidos…
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rosver-line bg-white px-4 py-10 text-center text-sm text-rosver-muted">
          Aún no tienes pedidos. Completa una compra desde el carrito.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rosver-line bg-white px-4 py-10 text-center text-sm text-rosver-muted">
          Ningún pedido coincide con la búsqueda o los filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
