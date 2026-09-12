import {
  CLAIM_KIND_LABEL,
  COMPLAINT_PIPELINE_BADGE,
  COMPLAINT_PIPELINE_LABEL,
  COMPLAINT_PIPELINE_STATUSES,
  GOOD_KIND_LABEL,
  isComplaintPipelineStatus,
  type ComplaintPipelineStatus,
} from '@/shared/lib/complaint-pipeline'
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

type Complaint = {
  id: string
  code: string
  claimKind: string
  goodKind: string
  consumerName: string
  consumerDocType: string
  consumerDocNumber: string
  consumerAddress: string
  consumerDistrict: string | null
  consumerProvince: string | null
  consumerDepartment: string | null
  consumerPhone: string
  consumerEmail: string
  consumerIsMinor: boolean
  guardianName: string | null
  contractedDetail: string
  amount: number | null
  claimDetail: string
  consumerRequest: string
  status: string
  providerResponse: string | null
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

function normalizeStatus(raw: string): ComplaintPipelineStatus {
  return isComplaintPipelineStatus(raw) ? raw : 'recibido'
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

export function AdminComplaintsPage() {
  const { toasts, showSuccess, showErrors, dismiss, clear } = useFormToasts()
  const [items, setItems] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [statusFilter, setStatusFilter] = useState<
    'all' | ComplaintPipelineStatus
  >('all')
  const [kindFilter, setKindFilter] = useState<'all' | 'reclamo' | 'queja'>(
    'all',
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view')
  const [confirmDelete, setConfirmDelete] = useState<Complaint | null>(null)
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api<{ complaints: Complaint[] }>(
          '/api/admin/complaints',
        )
        if (!cancelled) setItems(data.complaints)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : 'No se pudo cargar el libro.',
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
    return items.filter((c) => {
      const st = normalizeStatus(c.status)
      if (statusFilter !== 'all' && st !== statusFilter) return false
      if (kindFilter !== 'all' && c.claimKind !== kindFilter) return false
      if (!q) return true
      return (
        c.code.toLowerCase().includes(q) ||
        c.consumerName.toLowerCase().includes(q) ||
        c.consumerPhone.toLowerCase().includes(q) ||
        c.consumerEmail.toLowerCase().includes(q) ||
        c.claimDetail.toLowerCase().includes(q) ||
        COMPLAINT_PIPELINE_LABEL[st].toLowerCase().includes(q)
      )
    })
  }, [items, deferredQuery, statusFilter, kindFilter])

  const stats = useMemo(() => {
    let received = 0
    let inReview = 0
    let responded = 0
    for (const c of items) {
      const st = normalizeStatus(c.status)
      if (st === 'recibido') received += 1
      else if (st === 'en_revision') inReview += 1
      else if (st === 'respondido') responded += 1
    }
    return { total: items.length, received, inReview, responded }
  }, [items])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  useEffect(() => {
    setPage(1)
  }, [deferredQuery, statusFilter, kindFilter])

  function openDetail(c: Complaint, mode: 'view' | 'edit') {
    setDetailMode(mode)
    setSelected(c)
    setResponse(c.providerResponse ?? '')
  }

  async function setStatus(id: string, status: ComplaintPipelineStatus) {
    clear()
    setSaving(true)
    try {
      const data = await api<{ complaint: Complaint }>(
        `/api/admin/complaints/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      )
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...data.complaint } : x)),
      )
      setSelected((cur) =>
        cur?.id === id ? { ...cur, ...data.complaint } : cur,
      )
      showSuccess(['Estado actualizado'])
    } catch (e) {
      showErrors([
        e instanceof ApiError ? e.message : 'No se pudo actualizar.',
      ])
    } finally {
      setSaving(false)
    }
  }

  async function saveResponse() {
    if (!selected) return
    clear()
    if (response.trim().length < 5) {
      showErrors(['Escribe la respuesta al consumidor'])
      return
    }
    setSaving(true)
    try {
      const data = await api<{ complaint: Complaint }>(
        `/api/admin/complaints/${selected.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'respondido',
            providerResponse: response.trim(),
          }),
        },
      )
      setItems((prev) =>
        prev.map((x) =>
          x.id === selected.id ? { ...x, ...data.complaint } : x,
        ),
      )
      setSelected(null)
      showSuccess(['Respuesta guardada'])
    } catch (e) {
      showErrors([
        e instanceof ApiError ? e.message : 'No se pudo guardar.',
      ])
    } finally {
      setSaving(false)
    }
  }

  async function removeComplaint(c: Complaint) {
    clear()
    setSaving(true)
    try {
      await api(`/api/admin/complaints/${c.id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((x) => x.id !== c.id))
      setSelected((cur) => (cur?.id === c.id ? null : cur))
      setConfirmDelete(null)
      showSuccess([`Hoja ${c.code} eliminada`])
    } catch (e) {
      showErrors([
        e instanceof ApiError ? e.message : 'No se pudo eliminar.',
      ])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        eyebrow="Atención"
        title="Libro de reclamaciones"
        description="Hojas recibidas y respuesta al consumidor."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Recibidas', value: stats.received, tone: 'warning' },
          { label: 'En revisión', value: stats.inReview },
          { label: 'Respondidas', value: stats.responded, tone: 'success' },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-rosver-line bg-gradient-to-br from-white via-white to-rosver-soft/60 p-4 shadow-sm lg:flex-row lg:items-end lg:gap-4">
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
              placeholder="Código, consumidor, teléfono, email o detalle…"
              className="w-full rounded-xl border border-rosver-line bg-white py-2.5 pr-3 pl-10 text-sm text-rosver-ink outline-none placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/15"
            />
          </div>
        </label>
        <label className="block w-full sm:w-44">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Tipo
          </span>
          <AdminSelect
            value={kindFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || v === 'reclamo' || v === 'queja') {
                setKindFilter(v)
              }
            }}
          >
            <option value="all">Reclamos y quejas</option>
            <option value="reclamo">Solo reclamos</option>
            <option value="queja">Solo quejas</option>
          </AdminSelect>
        </label>
        <label className="block w-full sm:w-48">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Estado
          </span>
          <AdminSelect
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all') setStatusFilter('all')
              else if (isComplaintPipelineStatus(v)) setStatusFilter(v)
            }}
          >
            <option value="all">Todos</option>
            {COMPLAINT_PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {COMPLAINT_PIPELINE_LABEL[s]}
              </option>
            ))}
          </AdminSelect>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <div className="border-b border-rosver-line bg-gradient-to-r from-rosver-ink to-rosver-blue px-4 py-3">
          <p className="text-sm font-bold text-white">Hojas registradas</p>
          <p className="text-xs text-white/70">
            Reclamos y quejas · ver / responder / eliminar
          </p>
        </div>

        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : error ? (
          <AdminEmptyState title="No se pudo cargar" detail={error} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title={
              items.length === 0
                ? 'Aún no hay hojas registradas'
                : 'Sin resultados'
            }
            detail={
              items.length === 0
                ? 'Cuando alguien envíe desde /libro-reclamaciones, aparecerán aquí.'
                : 'Prueba otro filtro o término de búsqueda.'
            }
          />
        ) : (
          <>
            <BootstrapTable className="min-w-[720px]" size="sm" striped hover>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Consumidor</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => {
                  const st = normalizeStatus(c.status)
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="rounded-lg bg-rosver-red/10 px-2.5 py-1 text-xs font-bold text-rosver-red">
                          {c.code}
                        </span>
                      </td>
                      <td>
                        <p className="max-w-[16rem] truncate font-semibold text-rosver-ink">
                          {c.consumerName}
                        </p>
                        <p className="text-xs text-rosver-muted">
                          {c.consumerPhone} · {c.consumerEmail}
                        </p>
                      </td>
                      <td>
                        <p className="text-xs font-bold text-rosver-ink">
                          {CLAIM_KIND_LABEL[c.claimKind] ?? c.claimKind}
                        </p>
                        <p className="text-[11px] text-rosver-muted">
                          {GOOD_KIND_LABEL[c.goodKind] ?? c.goodKind}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-sm text-rosver-ink">
                        {DATE_FMT.format(new Date(c.createdAt))}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold leading-tight shadow-sm',
                            COMPLAINT_PIPELINE_BADGE[st],
                          )}
                        >
                          {COMPLAINT_PIPELINE_LABEL[st]}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <IconAction
                            label="Ver detalles"
                            onClick={() => openDetail(c, 'view')}
                            className="bg-rosver-blue text-white shadow-sm shadow-rosver-blue/25 hover:opacity-90"
                          >
                            <Monitor
                              size={16}
                              color="currentColor"
                              strokeWidth={2}
                            />
                          </IconAction>
                          <IconAction
                            label="Responder / editar"
                            onClick={() => openDetail(c, 'edit')}
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
                            onClick={() => setConfirmDelete(c)}
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
              ? `Responder ${selected.code}`
              : `Detalle ${selected.code}`
            : 'Hoja'
        }
        footer={
          selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-rosver-line px-4 py-2.5 text-sm font-bold text-rosver-ink hover:bg-rosver-soft"
              >
                Cerrar
              </button>
              {detailMode === 'view' ? (
                <button
                  type="button"
                  onClick={() => setDetailMode('edit')}
                  className="rounded-xl bg-rosver-yellow px-4 py-2.5 text-sm font-bold text-rosver-ink"
                >
                  Responder
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveResponse()}
                  className="rounded-xl bg-rosver-red px-4 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-50"
                >
                  Guardar respuesta
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={() => void setStatus(selected.id, 'archivado')}
                className="rounded-xl border border-rosver-line px-4 py-2.5 text-sm font-bold text-rosver-ink disabled:opacity-50"
              >
                Archivar
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <div className="rounded-xl border border-rosver-line bg-rosver-soft/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                    Consumidor
                  </p>
                  <p className="mt-1 font-bold text-rosver-ink">
                    {selected.consumerName}
                  </p>
                  <p className="text-xs text-rosver-muted">
                    {selected.consumerDocType} {selected.consumerDocNumber}
                  </p>
                  <p className="mt-1 text-xs text-rosver-muted">
                    {selected.consumerPhone} · {selected.consumerEmail}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-rosver-ink px-2.5 py-1 text-[10px] font-bold text-white">
                    {CLAIM_KIND_LABEL[selected.claimKind] ?? selected.claimKind}
                  </span>
                  <span className="rounded-full bg-rosver-blue px-2.5 py-1 text-[10px] font-bold text-white">
                    {GOOD_KIND_LABEL[selected.goodKind] ?? selected.goodKind}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold',
                      COMPLAINT_PIPELINE_BADGE[
                        normalizeStatus(selected.status)
                      ],
                    )}
                  >
                    {
                      COMPLAINT_PIPELINE_LABEL[
                        normalizeStatus(selected.status)
                      ]
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold text-rosver-muted uppercase">
                  Dirección
                </p>
                <p className="mt-1 text-rosver-ink">{selected.consumerAddress}</p>
                <p className="text-xs text-rosver-muted">
                  {[
                    selected.consumerDistrict,
                    selected.consumerProvince,
                    selected.consumerDepartment,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-rosver-muted uppercase">
                  Bien / servicio
                </p>
                <p className="mt-1 text-rosver-ink">{selected.contractedDetail}</p>
                {selected.amount != null ? (
                  <p className="mt-1 font-bold text-rosver-red">
                    S/ {selected.amount.toFixed(2)}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-rosver-muted uppercase">
                Detalle del reclamo / queja
              </p>
              <p className="mt-1 whitespace-pre-wrap text-rosver-ink">
                {selected.claimDetail}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-rosver-muted uppercase">
                Pedido del consumidor
              </p>
              <p className="mt-1 whitespace-pre-wrap text-rosver-ink">
                {selected.consumerRequest}
              </p>
            </div>

            {detailMode === 'edit' || selected.providerResponse ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-rosver-muted uppercase">
                  Respuesta del proveedor
                </span>
                <textarea
                  rows={4}
                  value={response}
                  disabled={detailMode === 'view'}
                  onChange={(e) => setResponse(e.target.value)}
                  className="min-h-28 w-full rounded-xl border border-rosver-line bg-white px-3 py-2 text-sm outline-none focus:border-rosver-red/35 focus:ring-2 focus:ring-rosver-red/10 disabled:bg-rosver-soft/50"
                />
              </label>
            ) : null}

            {detailMode === 'edit' ? (
              <label className="block max-w-xs">
                <span className="mb-1.5 block text-xs font-bold text-rosver-muted uppercase">
                  Cambiar estado
                </span>
                <AdminSelect
                  value={normalizeStatus(selected.status)}
                  disabled={saving}
                  onChange={(e) => {
                    const v = e.target.value
                    if (isComplaintPipelineStatus(v)) {
                      void setStatus(selected.id, v)
                    }
                  }}
                >
                  {COMPLAINT_PIPELINE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {COMPLAINT_PIPELINE_LABEL[s]}
                    </option>
                  ))}
                </AdminSelect>
              </label>
            ) : null}

            <p className="text-xs text-rosver-muted">
              Registrada: {DATE_FMT.format(new Date(selected.createdAt))}
            </p>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar hoja"
      >
        {confirmDelete ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-rosver-ink">
              ¿Eliminar{' '}
              <span className="font-bold">{confirmDelete.code}</span> de{' '}
              {confirmDelete.consumerName}?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void removeComplaint(confirmDelete)}
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
