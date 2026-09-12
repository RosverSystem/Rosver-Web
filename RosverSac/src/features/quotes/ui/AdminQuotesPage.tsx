import {
  QUOTE_PIPELINE_BADGE,
  QUOTE_PIPELINE_LABEL,
  QUOTE_PIPELINE_STATUSES,
  isQuotePipelineStatus,
  type QuotePipelineStatus,
} from '@/shared/lib/quote-pipeline'
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

type QuoteRow = {
  id: string
  code: string
  businessName: string
  phone: string
  status: string
  shipDistrict: string | null
  agencyName: string | null
  itemCount: number
  totalEstimated: number | null
  createdAt: string
}

const PAGE_SIZE = 10

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function normalizeStatus(raw: string): QuotePipelineStatus {
  return isQuotePipelineStatus(raw) ? raw : 'recibida'
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

export function AdminQuotesPage() {
  const navigate = useNavigate()
  const { toasts, showSuccess, showErrors, dismiss, clear } = useFormToasts()
  const [items, setItems] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [statusFilter, setStatusFilter] = useState<'all' | QuotePipelineStatus>(
    'all',
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<QuoteRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<QuoteRow | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api<{ items: QuoteRow[] }>('/api/admin/quotes')
        if (!cancelled) setItems(data.items)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : 'No se pudieron cargar las cotizaciones.',
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
        QUOTE_PIPELINE_LABEL[st].toLowerCase().includes(q)
      )
    })
  }, [items, deferredQuery, statusFilter])

  const stats = useMemo(() => {
    let received = 0
    let inReview = 0
    let accepted = 0
    for (const o of items) {
      const st = normalizeStatus(o.status)
      if (st === 'recibida') received += 1
      else if (st === 'en_revision' || st === 'respondida') inReview += 1
      else if (st === 'aceptada') accepted += 1
    }
    return { total: items.length, received, inReview, accepted }
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

  function openWorkspace(row: QuoteRow) {
    const q = new URLSearchParams({
      'codigo-cotizacion': row.code,
      codcliente: row.phone,
    })
    navigate(`/admin/cotizaciones/vista?${q.toString()}`)
  }

  async function setStatus(row: QuoteRow, status: QuotePipelineStatus) {
    if (normalizeStatus(row.status) === status) return
    clear()
    setSaving(true)
    try {
      await api(`/api/admin/quotes/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, status } : x)),
      )
      setSelected((cur) =>
        cur?.id === row.id ? { ...cur, status } : cur,
      )
      showSuccess([`Cotización ${row.code} actualizada`])
    } catch (e) {
      showErrors([
        e instanceof ApiError
          ? e.message
          : 'No se pudo actualizar. Completá evidencias en la vista.',
      ])
    } finally {
      setSaving(false)
    }
  }

  async function removeQuote(row: QuoteRow) {
    clear()
    setSaving(true)
    try {
      await api(`/api/admin/quotes/${row.id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((x) => x.id !== row.id))
      setSelected((cur) => (cur?.id === row.id ? null : cur))
      setConfirmDelete(null)
      showSuccess([`Cotización ${row.code} eliminada`])
    } catch (e) {
      showErrors([
        e instanceof ApiError
          ? e.message
          : 'No se pudo eliminar la cotización.',
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
        title="Cotizaciones"
        description="Solicitudes comerciales y seguimiento por fase."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Recibidas', value: stats.received, tone: 'warning' },
          { label: 'En curso', value: stats.inReview },
          { label: 'Aceptadas', value: stats.accepted, tone: 'success' },
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
              else if (isQuotePipelineStatus(v)) setStatusFilter(v)
            }}
          >
            <option value="all">Todas las fases</option>
            {QUOTE_PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUOTE_PIPELINE_LABEL[s]}
              </option>
            ))}
          </AdminSelect>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rosver-line bg-gradient-to-r from-rosver-ink to-rosver-blue px-4 py-3">
          <div>
            <p className="text-sm font-bold text-white">Listado de cotizaciones</p>
            <p className="text-xs text-white/70">
              Filtrado al escribir · ver / editar / eliminar
            </p>
          </div>
        </div>

        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : error ? (
          <AdminEmptyState title="No se pudo cargar" detail={error} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title={
              items.length === 0
                ? 'Aún no hay cotizaciones'
                : 'Sin resultados'
            }
            detail={
              items.length === 0
                ? 'Cuando alguien envíe desde /cotizar, aparecerán aquí.'
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
                            QUOTE_PIPELINE_BADGE[st],
                          )}
                        >
                          {QUOTE_PIPELINE_LABEL[st]}
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
                            onClick={() => setSelected(o)}
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
        title={selected ? `Editar ${selected.code}` : 'Cotización'}
      >
        {selected ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-rosver-ink">
              {selected.businessName}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-rosver-ink uppercase">
                Fase
              </span>
              <AdminSelect
                value={normalizeStatus(selected.status)}
                disabled={saving}
                onChange={(e) => {
                  const v = e.target.value
                  if (isQuotePipelineStatus(v)) void setStatus(selected, v)
                }}
              >
                {QUOTE_PIPELINE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {QUOTE_PIPELINE_LABEL[s]}
                  </option>
                ))}
              </AdminSelect>
              <p className="text-xs text-rosver-muted">
                Si pide evidencias, usá la vista completa (botón azul).
              </p>
            </label>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar cotización"
      >
        {confirmDelete ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-rosver-ink">
              ¿Eliminar{' '}
              <span className="font-bold">{confirmDelete.code}</span> de{' '}
              {confirmDelete.businessName}?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void removeQuote(confirmDelete)}
                className="rounded-xl bg-rosver-red px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-rosver-line px-4 py-2.5 text-sm font-bold"
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
