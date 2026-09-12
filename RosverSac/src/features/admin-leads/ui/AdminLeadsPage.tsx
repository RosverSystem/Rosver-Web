import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { AdminEmptyState, AdminField, AdminPageHeader, AdminSelect } from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Trash } from 'cssvg-icons'
import { useEffect, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Lead = {
  id: string
  code: string
  fullName: string
  email: string | null
  phone: string | null
  documentType: string | null
  documentNumber: string | null
  businessName: string | null
  message: string
  status: 'nuevo' | 'en_proceso' | 'cerrado'
  adminNote: string | null
  confirmationSent: boolean
  userId: string | null
  createdAt: string
  updatedAt: string | null
}

type StatusFilter = 'all' | 'nuevo' | 'en_proceso' | 'cerrado'

const STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  en_proceso: 'En proceso',
  cerrado: 'Cerrado',
}

const STATUS_COLOR: Record<string, string> = {
  nuevo: 'bg-rosver-blue/10 text-rosver-blue',
  en_proceso: 'bg-rosver-yellow/20 text-rosver-ink',
  cerrado: 'bg-rosver-soft text-rosver-muted',
}

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function fmtDate(iso: string) {
  try {
    return DATE_FMT.format(new Date(iso))
  } catch {
    return iso
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminLeadsPage() {
  const { toasts, showMessages, showSuccess, dismiss, clear } = useFormToasts()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [editStatus, setEditStatus] = useState<string>('nuevo')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    setLoading(true)
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const data = await api<{ leads: Lead[] }>(`/api/admin/leads${qs}`)
      setLeads(data.leads)
    } catch (e) {
      showMessages([e instanceof ApiError ? e.message : 'No se pudieron cargar los contactos'])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // ── Open detail ───────────────────────────────────────────────────────────

  function openDetail(lead: Lead) {
    setSelected(lead)
    setEditStatus(lead.status)
    setEditNote(lead.adminNote ?? '')
    setDetailOpen(true)
  }

  // ── Save changes ──────────────────────────────────────────────────────────

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    clear()
    setSaving(true)
    try {
      await api(`/api/admin/leads/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editStatus,
          adminNote: editNote.trim() || null,
        }),
      })
      showSuccess(['Contacto actualizado'])
      setDetailOpen(false)
      await load()
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo actualizar'])
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function onDelete(lead: Lead) {
    if (!window.confirm(`¿Eliminar el mensaje de «${lead.fullName}» (${lead.code})?`)) return
    clear()
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: 'DELETE' })
      showSuccess(['Contacto eliminado'])
      setDetailOpen(false)
      await load()
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo eliminar'])
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <AdminPageHeader
        title="Contactos"
        eyebrow="Bandeja de mensajes del formulario de contacto"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'nuevo', 'en_proceso', 'cerrado'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-rosver-ink text-white'
                : 'bg-rosver-soft text-rosver-muted hover:text-rosver-ink'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
        <span className="ml-auto text-xs text-rosver-muted">
          {leads.length} resultado{leads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-sm text-rosver-muted">Cargando…</div>
      ) : leads.length === 0 ? (
        <AdminEmptyState
          title="Sin mensajes"
          detail="Aún no hay contactos en esta bandeja."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rosver-line bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-rosver-line bg-rosver-soft text-left text-xs font-semibold uppercase tracking-wide text-rosver-muted">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="hidden px-4 py-3 sm:table-cell">Mensaje</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 md:table-cell">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rosver-line">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer hover:bg-rosver-soft/50"
                  onClick={() => openDetail(lead)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-rosver-muted">{lead.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-rosver-ink">{lead.fullName}</div>
                    {lead.email && (
                      <div className="text-xs text-rosver-muted">{lead.email}</div>
                    )}
                    {lead.phone && (
                      <div className="text-xs text-rosver-muted">{lead.phone}</div>
                    )}
                    {lead.businessName && (
                      <div className="text-xs italic text-rosver-muted">{lead.businessName}</div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <p className="line-clamp-2 max-w-xs text-xs text-rosver-muted">
                      {lead.message}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[lead.status] ?? ''}`}
                    >
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-rosver-muted md:table-cell">
                    {fmtDate(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="Eliminar"
                      onClick={(e) => {
                        e.stopPropagation()
                        void onDelete(lead)
                      }}
                      className="rounded-lg p-1.5 text-rosver-muted hover:bg-red-50 hover:text-rosver-red"
                    >
                      <Trash size={14} color="currentColor" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail / edit modal ──────────────────────────────────────────────── */}
      <AdminModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected ? `${selected.code} — ${selected.fullName}` : 'Contacto'}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => selected && void onDelete(selected)}
              className="rounded-lg border border-rosver-line px-4 py-2 text-sm text-rosver-red hover:bg-red-50"
            >
              Eliminar
            </button>
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="rounded-lg border border-rosver-line px-4 py-2 text-sm text-rosver-ink hover:bg-rosver-soft"
            >
              Cerrar
            </button>
            <button
              form="lead-detail-form"
              type="submit"
              disabled={saving}
              className="rounded-lg bg-rosver-red px-5 py-2 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        {selected && (
          <form id="lead-detail-form" noValidate onSubmit={onSave} className="flex flex-col gap-4">
            {/* Info block */}
            <div className="space-y-1 rounded-lg bg-rosver-soft p-4 text-sm">
              <div>
                <span className="font-semibold">Nombre:</span> {selected.fullName}
              </div>
              {selected.email && (
                <div>
                  <span className="font-semibold">Email:</span> {selected.email}
                </div>
              )}
              {selected.phone && (
                <div>
                  <span className="font-semibold">Teléfono:</span> {selected.phone}
                </div>
              )}
              {selected.businessName && (
                <div>
                  <span className="font-semibold">Empresa:</span> {selected.businessName}
                </div>
              )}
              {selected.documentType && (
                <div>
                  <span className="font-semibold">{selected.documentType}:</span>{' '}
                  {selected.documentNumber}
                </div>
              )}
              <div className="mt-2 text-xs text-rosver-muted">
                Recibido {fmtDate(selected.createdAt)}
              </div>
            </div>

            {/* Message */}
            <div className="whitespace-pre-wrap rounded-lg border border-rosver-line bg-white p-4 text-sm text-rosver-ink">
              {selected.message}
            </div>

            {/* Status */}
            <AdminField label="Estado">
              <AdminSelect
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="nuevo">Nuevo</option>
                <option value="en_proceso">En proceso</option>
                <option value="cerrado">Cerrado</option>
              </AdminSelect>
            </AdminField>

            {/* Note */}
            <AdminField label="Nota interna (opcional)">
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={3}
                placeholder="Escribe una nota de seguimiento…"
                className="w-full resize-none rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/60"
              />
            </AdminField>
          </form>
        )}
      </AdminModal>
    </div>
  )
}
