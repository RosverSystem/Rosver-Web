import { api, ApiError } from '@/shared/lib/api'
import { cn, formatInternalCode } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Pen, Plus, Search, Trash } from 'cssvg-icons'
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'

type SpecAttr = {
  id: string
  key: string
  name: string
  internalCode: number
  codeLabel?: string
  isSystem: boolean
}

function IconAction({
  label,
  onClick,
  className,
  children,
  disabled,
}: {
  label: string
  onClick: () => void
  className: string
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xl transition hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}

/**
 * Catálogo de tipos de especificación técnica.
 * Solo nombre; el SKU (00000000) se asigna solo.
 */
export function AdminSpecsPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [rows, setRows] = useState<SpecAttr[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingIsSystem, setEditingIsSystem] = useState(false)
  const [editingCode, setEditingCode] = useState(0)
  const [nextCode, setNextCode] = useState(0)
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const sku = formatInternalCode(r.internalCode)
      return (
        r.name.toLowerCase().includes(q) ||
        sku.includes(q) ||
        r.key.toLowerCase().includes(q)
      )
    })
  }, [rows, deferredQuery])

  const stats = useMemo(() => {
    const system = rows.filter((r) => r.isSystem).length
    return { total: rows.length, system, custom: rows.length - system }
  }, [rows])

  const skuDisplay = editingId
    ? formatInternalCode(editingCode)
    : formatInternalCode(nextCode)

  async function load() {
    setLoading(true)
    try {
      const data = await api<{ attributes: SpecAttr[] }>(
        '/api/admin/spec-attributes',
      )
      setRows(data.attributes)
    } catch (e) {
      showMessages([
        e instanceof ApiError
          ? e.message
          : 'No se pudieron cargar las especificaciones',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setEditingIsSystem(false)
    setEditingCode(0)
    setName('')
  }

  async function openCreate() {
    resetForm()
    setModalOpen(true)
    try {
      const next = await api<{ code: number }>(
        '/api/admin/spec-attributes/next-code',
      )
      setNextCode(next.code)
    } catch {
      setNextCode(0)
    }
  }

  function startEdit(r: SpecAttr) {
    setEditingId(r.id)
    setEditingIsSystem(r.isSystem)
    setEditingCode(r.internalCode)
    setName(r.name)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!name.trim()) {
      showMessages(['Escribe el nombre de la especificación'])
      return
    }
    setBusy(true)
    try {
      if (editingId) {
        await api(`/api/admin/spec-attributes/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: name.trim() }),
        })
        showMessages(['Especificación actualizada'])
      } else {
        await api('/api/admin/spec-attributes', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim() }),
        })
        showMessages(['Especificación creada'])
      }
      closeModal()
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo guardar la especificación',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function remove(r: SpecAttr) {
    if (r.isSystem) {
      showMessages(['Las especificaciones del sistema no se eliminan'])
      return
    }
    if (!window.confirm(`¿Eliminar «${r.name}»?`)) return
    clear()
    setBusy(true)
    try {
      await api(`/api/admin/spec-attributes/${r.id}`, { method: 'DELETE' })
      showMessages(['Especificación eliminada'])
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar la especificación',
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Especificaciones"
        description="Solo ficha técnica. Creas el nombre; el SKU (00000000) se asigna solo. Código, marca y precio del producto no van aquí."
        actions={
          <button
            type="button"
            onClick={() => void openCreate()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark"
          >
            <Plus size={18} color="currentColor" strokeWidth={2} />
            Nueva especificación
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-rosver-line bg-white p-4">
          <p className="text-xs font-semibold text-rosver-muted">Total</p>
          <p className="mt-1 text-2xl font-bold text-rosver-ink">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-rosver-line bg-white p-4">
          <p className="text-xs font-semibold text-rosver-muted">Del sistema</p>
          <p className="mt-1 text-2xl font-bold text-rosver-ink">
            {stats.system}
          </p>
        </div>
        <div className="rounded-2xl border border-rosver-line bg-white p-4">
          <p className="text-xs font-semibold text-rosver-muted">Tus tipos</p>
          <p className="mt-1 text-2xl font-bold text-rosver-ink">
            {stats.custom}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rosver-line bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rosver-muted">
            <Search size={16} color="currentColor" strokeWidth={2} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="h-11 w-full rounded-xl border border-rosver-line bg-white pl-9 pr-3 text-sm outline-none focus:border-rosver-red/45 focus:ring-2 focus:ring-rosver-red/15"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white">
        {loading ? (
          <AdminEmptyState title="Cargando especificaciones…" />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="Sin especificaciones"
            detail="Crea un tipo (ej. Material, Voltaje) para usarlo en productos."
          />
        ) : (
          <ul className="divide-y divide-rosver-line">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-rosver-ink">{r.name}</p>
                    {r.isSystem ? (
                      <span className="rounded-full bg-rosver-soft px-2 py-0.5 text-[10px] font-bold text-rosver-muted">
                        Sistema
                      </span>
                    ) : (
                      <span className="rounded-full bg-rosver-success/15 px-2 py-0.5 text-[10px] font-bold text-rosver-success">
                        Personalizada
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-rosver-muted">
                    SKU {formatInternalCode(r.internalCode)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <IconAction
                    label="Editar"
                    onClick={() => startEdit(r)}
                    className="bg-rosver-red/10 text-rosver-red hover:bg-rosver-red/20"
                  >
                    <Pen size={16} color="currentColor" strokeWidth={2} />
                  </IconAction>
                  <IconAction
                    label={
                      r.isSystem
                        ? 'No se puede eliminar (sistema)'
                        : 'Eliminar'
                    }
                    disabled={busy || r.isSystem}
                    onClick={() => void remove(r)}
                    className="bg-rosver-soft text-rosver-muted hover:bg-rosver-red/10 hover:text-rosver-red"
                  >
                    <Trash size={16} color="currentColor" strokeWidth={2} />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar especificación' : 'Nueva especificación'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="spec-attr-form"
              disabled={busy}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : editingId ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form
          id="spec-attr-form"
          noValidate
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <AdminField label="Nombre" htmlFor="spec-name">
            <AdminInput
              id="spec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Material, Voltaje, Dimensiones…"
            />
          </AdminField>
          <AdminField label="SKU" htmlFor="spec-sku">
            <AdminInput
              id="spec-sku"
              readOnly
              tabIndex={-1}
              value={skuDisplay}
              className="cursor-default bg-rosver-soft font-mono text-sm font-semibold tracking-wide text-rosver-ink"
              aria-readonly="true"
            />
          </AdminField>
          <p className="text-xs text-rosver-muted">
            {editingId
              ? editingIsSystem
                ? 'Especificación del sistema: puedes cambiar el nombre; el SKU no cambia y no se elimina.'
                : 'El SKU no cambia. En el producto solo pondrás el valor.'
              : 'Este será el SKU al guardar (formato 00000000). En el producto solo pondrás el valor (ej. «ABS + aluminio»).'}
          </p>
        </form>
      </AdminModal>
    </div>
  )
}
