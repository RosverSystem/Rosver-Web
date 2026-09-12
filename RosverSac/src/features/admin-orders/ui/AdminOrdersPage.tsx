import {
  ORDER_PIPELINE_BADGE,
  ORDER_PIPELINE_LABEL,
  ORDER_PIPELINE_STATUSES,
  isOrderPipelineStatus,
  type OrderPipelineStatus,
} from '@/features/admin-orders/model/order-pipeline'
import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSelect,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { BootstrapTable } from '@/shared/ui/bootstrap-table'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { cn } from '@/shared/lib'
import { Monitor, Pen, Search, Trash } from 'cssvg-icons'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

type OrderRow = {
  id: string
  code: string
  businessName: string
  phone: string
  status: string
  shipAddress: string | null
  shipDistrict: string | null
  shipProvince: string | null
  shipDepartment: string | null
  agencyName: string | null
  itemCount: number
  totalEstimated: number | null
  publicSlug: string | null
  shareUrl: string | null
  linkExpiresAt: string | null
  createdAt: string
}

type DetailMode = 'view' | 'edit'

const PAGE_SIZE = 10

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const MONEY_FMT = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

function normalizeStatus(raw: string): OrderPipelineStatus {
  return isOrderPipelineStatus(raw) ? raw : 'confirmacion_pedido'
}

function formatMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return MONEY_FMT.format(n)
}

function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xl transition hover:scale-[1.03] active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const { toasts, showSuccess, showErrors, dismiss, clear } = useFormToasts()
  const [items, setItems] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [statusFilter, setStatusFilter] = useState<'all' | OrderPipelineStatus>(
    'all',
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<OrderRow | null>(null)
  const [detailMode, setDetailMode] = useState<DetailMode>('view')
  const [confirmDelete, setConfirmDelete] = useState<OrderRow | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api<{ items: OrderRow[] }>('/api/admin/orders')
        if (!cancelled) setItems(data.items)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : 'No se pudieron cargar los pedidos.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return items.filter((o) => {
      const st = normalizeStatus(o.status)
      if (statusFilter !== 'all' && st !== statusFilter) return false
      if (!q) return true
      return (
        o.code.toLowerCase().includes(q) ||
        o.businessName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        ORDER_PIPELINE_LABEL[st].toLowerCase().includes(q)
      )
    })
  }, [items, deferredQuery, statusFilter])

  const stats = useMemo(() => {
    let pending = 0
    let shipping = 0
    let delivered = 0
    for (const o of items) {
      const st = normalizeStatus(o.status)
      if (st === 'confirmacion_pedido' || st === 'confirmacion_pago') pending += 1
      else if (st === 'realizando_envio' || st === 'enviado') shipping += 1
      else if (st === 'entregado') delivered += 1
    }
    return { total: items.length, pending, shipping, delivered }
  }, [items])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  useEffect(() => {
    setPage(1)
  }, [deferredQuery, statusFilter])

  function openWorkspace(order: OrderRow) {
    const q = new URLSearchParams({
      'codigo-pedido': order.code,
      codcliente: order.phone,
    })
    navigate(`/admin/pedidos/vista?${q.toString()}`)
  }

  function openDetail(order: OrderRow, mode: DetailMode) {
    setDetailMode(mode)
    setSelected(order)
  }

  async function setStatus(order: OrderRow, status: OrderPipelineStatus) {
    if (normalizeStatus(order.status) === status) return
    clear()
    setSaving(true)
    try {
      await api(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setItems((prev) =>
        prev.map((x) => (x.id === order.id ? { ...x, status } : x)),
      )
      setSelected((cur) =>
        cur?.id === order.id ? { ...cur, status } : cur,
      )
      showSuccess([`Pedido ${order.code} actualizado`])
    } catch (e) {
      showErrors([
        e instanceof ApiError
          ? e.message
          : 'No se pudo actualizar el estado.',
      ])
    } finally {
      setSaving(false)
    }
  }

  async function removeOrder(order: OrderRow) {
    clear()
    setSaving(true)
    try {
      await api(`/api/admin/orders/${order.id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((x) => x.id !== order.id))
      setSelected((cur) => (cur?.id === order.id ? null : cur))
      setConfirmDelete(null)
      showSuccess([`Pedido ${order.code} eliminado`])
    } catch (e) {
      showErrors([
        e instanceof ApiError ? e.message : 'No se pudo eliminar el pedido.',
      ])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        eyebrow="Ventas"
        title="Pedidos"
        description="Solicitudes del carrito y seguimiento por fase."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Pendientes', value: stats.pending, tone: 'warning' },
          { label: 'En envío', value: stats.shipping },
          { label: 'Entregados', value: stats.delivered, tone: 'success' },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-rosver-line bg-gradient-to-br from-white via-white to-rosver-soft/60 p-4 shadow-sm sm:flex-row sm:items-end sm:gap-4">
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
              placeholder="Escribe para filtrar: código, cliente, teléfono o fase…"
              className="w-full rounded-xl border border-rosver-line bg-white py-2.5 pr-3 pl-10 text-sm text-rosver-ink outline-none placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/15"
            />
          </div>
        </label>
        <label className="block w-full sm:w-56">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Fase
          </span>
          <AdminSelect
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all') setStatusFilter('all')
              else if (isOrderPipelineStatus(v)) setStatusFilter(v)
            }}
          >
            <option value="all">Todas las fases</option>
            {ORDER_PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_PIPELINE_LABEL[s]}
              </option>
            ))}
          </AdminSelect>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rosver-line bg-gradient-to-r from-rosver-ink to-rosver-blue px-4 py-3">
          <div>
            <p className="text-sm font-bold text-white">Listado de pedidos</p>
            <p className="text-xs text-white/70">
              Filtrado al escribir · ver / editar / eliminar
            </p>
          </div>
          {query.trim() ? (
            <span className="rounded-full bg-rosver-yellow px-2.5 py-1 text-[11px] font-bold text-rosver-ink">
              Filtrando: “{query.trim()}”
            </span>
          ) : null}
        </div>

        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : error ? (
          <AdminEmptyState title="No se pudo cargar" detail={error} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title={items.length === 0 ? 'Aún no hay pedidos' : 'Sin resultados'}
            detail={
              items.length === 0
                ? 'Cuando alguien continúe el pedido desde el carrito, aparecerán aquí.'
                : 'Prueba otro término o quita el filtro de fase.'
            }
          />
        ) : (
          <>
            <BootstrapTable className="min-w-[640px]" size="sm" striped hover>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Fase</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => {
                  const st = normalizeStatus(o.status)
                  return (
                    <tr key={o.id}>
                      <td>
                        <span className="rounded-lg bg-rosver-red/10 px-2.5 py-1 text-xs font-bold text-rosver-red">
                          {o.code}
                        </span>
                      </td>
                      <td>
                        <p className="max-w-[18rem] truncate font-semibold text-rosver-ink">
                          {o.businessName}
                        </p>
                        <p className="text-xs text-rosver-muted">{o.phone}</p>
                      </td>
                      <td className="whitespace-nowrap text-sm text-rosver-ink">
                        {DATE_FMT.format(new Date(o.createdAt))}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold leading-tight shadow-sm',
                            ORDER_PIPELINE_BADGE[st],
                          )}
                        >
                          {ORDER_PIPELINE_LABEL[st]}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <IconAction
                            label="Ver detalles"
                            onClick={() => openWorkspace(o)}
                            className="bg-rosver-blue text-white shadow-sm shadow-rosver-blue/25 hover:opacity-90"
                          >
                            <Monitor
                              size={16}
                              color="currentColor"
                              strokeWidth={2}
                            />
                          </IconAction>
                          <IconAction
                            label="Editar fase"
                            onClick={() => openDetail(o, 'edit')}
                            className="bg-rosver-yellow text-rosver-ink shadow-sm shadow-rosver-yellow/30 hover:opacity-90"
                          >
                            <Pen
                              size={16}
                              color="currentColor"
                              strokeWidth={2}
                            />
                          </IconAction>
                          <IconAction
                            label="Eliminar"
                            onClick={() => setConfirmDelete(o)}
                            className="bg-rosver-red text-white shadow-sm shadow-rosver-red/25 hover:bg-rosver-red-dark"
                          >
                            <Trash
                              size={16}
                              color="currentColor"
                              strokeWidth={2}
                            />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </BootstrapTable>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rosver-line bg-rosver-soft/60 px-4 py-3">
              <p className="text-xs font-medium text-rosver-muted">
                Mostrando {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} de{' '}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-rosver-line bg-white px-3 py-1.5 text-xs font-bold text-rosver-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="min-w-16 rounded-lg bg-rosver-ink px-2 py-1 text-center text-xs font-bold text-white">
                  {safePage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="rounded-lg border border-rosver-line bg-white px-3 py-1.5 text-xs font-bold text-rosver-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        size="xl"
        title={
          selected
            ? detailMode === 'edit'
              ? `Editar ${selected.code}`
              : `Detalle ${selected.code}`
            : 'Pedido'
        }
        footer={
          selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-rosver-line bg-white px-4 py-2.5 text-sm font-bold text-rosver-ink hover:bg-rosver-soft"
              >
                Cerrar
              </button>
              {detailMode === 'view' ? (
                <button
                  type="button"
                  onClick={() => setDetailMode('edit')}
                  className="inline-flex items-center gap-2 rounded-xl bg-rosver-yellow px-4 py-2.5 text-sm font-bold text-rosver-ink hover:opacity-90"
                >
                  <Pen size={16} color="currentColor" strokeWidth={2} />
                  Editar fase
                </button>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setConfirmDelete(selected)
                  setSelected(null)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-rosver-red px-4 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-50"
              >
                <Trash size={16} color="currentColor" strokeWidth={2} />
                Eliminar
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            {/* Datos principales arriba */}
            <div className="rounded-2xl border border-rosver-line bg-gradient-to-br from-rosver-ink via-rosver-blue to-rosver-ink p-4 text-white sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-white/60 uppercase">
                    Cliente
                  </p>
                  <p className="mt-1 text-lg font-bold leading-snug sm:text-xl">
                    {selected.businessName}
                  </p>
                  <p className="mt-1 text-sm text-white/75">{selected.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                    {selected.code}
                  </span>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-rosver-yellow sm:text-3xl">
                    {formatMoney(selected.totalEstimated)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-[11px] font-bold',
                    ORDER_PIPELINE_BADGE[normalizeStatus(selected.status)],
                  )}
                >
                  {ORDER_PIPELINE_LABEL[normalizeStatus(selected.status)]}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">
                  {DATE_FMT.format(new Date(selected.createdAt))}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">
                  {selected.itemCount} ítem
                  {selected.itemCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-rosver-line bg-rosver-soft/40 p-4">
                <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                  Destino
                </p>
                <p className="mt-2 text-sm font-semibold text-rosver-ink">
                  {selected.shipAddress || '—'}
                </p>
                <p className="mt-1 text-xs text-rosver-muted">
                  {[
                    selected.shipDistrict,
                    selected.shipProvince,
                    selected.shipDepartment,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Sin ubigeo'}
                </p>
                {selected.agencyName ? (
                  <p className="mt-2 text-xs font-semibold text-rosver-blue">
                    Agencia: {selected.agencyName}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-rosver-line bg-rosver-soft/40 p-4">
                <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                  Link público
                </p>
                {selected.shareUrl ? (
                  <a
                    href={selected.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm font-semibold text-rosver-red hover:underline"
                  >
                    {selected.publicSlug}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-rosver-muted">Sin link</p>
                )}
                {selected.linkExpiresAt ? (
                  <p className="mt-2 text-xs text-rosver-muted">
                    Vence:{' '}
                    {DATE_FMT.format(new Date(selected.linkExpiresAt))}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                'rounded-xl border p-4',
                detailMode === 'edit'
                  ? 'border-rosver-yellow/60 bg-rosver-yellow/10'
                  : 'border-rosver-line bg-white',
              )}
            >
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold tracking-wide text-rosver-ink uppercase">
                  Fase del pedido
                </span>
                <AdminSelect
                  value={normalizeStatus(selected.status)}
                  disabled={saving || detailMode === 'view'}
                  onChange={(e) => {
                    const v = e.target.value
                    if (isOrderPipelineStatus(v)) void setStatus(selected, v)
                  }}
                >
                  {ORDER_PIPELINE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_PIPELINE_LABEL[s]}
                    </option>
                  ))}
                </AdminSelect>
                {detailMode === 'view' ? (
                  <p className="text-xs text-rosver-muted">
                    Abrí editar para cambiar la fase.
                  </p>
                ) : (
                  <p className="text-xs font-medium text-rosver-ink/80">
                    Elegí la fase y se guarda al instante.
                  </p>
                )}
              </label>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar pedido"
      >
        {confirmDelete ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-rosver-ink">
              ¿Eliminar{' '}
              <span className="font-bold">{confirmDelete.code}</span> de{' '}
              {confirmDelete.businessName}? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void removeOrder(confirmDelete)}
                className="inline-flex items-center gap-2 rounded-xl bg-rosver-red px-4 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-50"
              >
                <Trash size={16} color="currentColor" strokeWidth={2} />
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-rosver-line px-4 py-2.5 text-sm font-bold text-rosver-ink hover:bg-rosver-soft"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
