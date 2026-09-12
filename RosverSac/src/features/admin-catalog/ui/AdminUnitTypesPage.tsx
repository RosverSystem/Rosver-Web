import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { useEffect, useMemo, useState } from 'react'

type UnitType = {
  id: string
  code: string
  name: string
  isBase: boolean
  sortOrder: number
}

export function AdminUnitTypesPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [units, setUnits] = useState<UnitType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await api<{ unitTypes: UnitType[] }>('/api/admin/unit-types')
      setUnits(data.unitTypes)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar las unidades',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function reset() {
    setEditingId(null)
    setName('')
    setCode('')
  }

  function openCreate() {
    reset()
    setModalOpen(true)
  }

  function startEdit(u: UnitType) {
    setEditingId(u.id)
    setName(u.name)
    setCode(u.code)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    reset()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!name.trim()) {
      showMessages(['Escribe el nombre de la unidad'])
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
      }
      if (editingId) {
        await api(`/api/admin/unit-types/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        showMessages(['Unidad actualizada'])
      } else {
        await api('/api/admin/unit-types', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        showMessages(['Unidad creada'])
      }
      closeModal()
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(u: UnitType) {
    if (!window.confirm(`¿Eliminar la unidad «${u.name}»?`)) return
    clear()
    try {
      await api(`/api/admin/unit-types/${u.id}`, { method: 'DELETE' })
      if (editingId === u.id) closeModal()
      await load()
      showMessages(['Unidad eliminada'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  const stats = useMemo(
    () => ({
      total: units.length,
      base: units.filter((u) => u.isBase).length,
    }),
    [units],
  )

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Tipos de unidad"
        description="Unidad, paquete o caja para presentaciones."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Base', value: stats.base, tone: 'success' },
        ]}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white uppercase shadow-sm shadow-rosver-red/30 hover:bg-rosver-red-dark"
          >
            Nueva unidad
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : units.length === 0 ? (
          <AdminEmptyState
            title="Sin unidades"
            detail="Usa «Nueva unidad» para crear unidad, paquete o caja."
          />
        ) : (
          <ul className="divide-y divide-rosver-line">
            {units.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-rosver-ink">{u.name}</p>
                  <p className="text-xs text-rosver-muted">
                    {u.code}
                    {u.isBase ? ' · unidad base' : ''}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(u)}
                    className="text-xs font-semibold text-rosver-red"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(u)}
                    className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar unidad' : 'Nueva unidad'}
        size="md"
        layer={80}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="unit-type-form"
              disabled={busy}
              className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : editingId ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="unit-type-form" noValidate onSubmit={onSubmit} className="space-y-4">
          <AdminField label="Nombre" htmlFor="unit-name">
            <AdminInput
              id="unit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Caja"
            />
          </AdminField>
          <AdminField label="Código (opcional)" htmlFor="unit-code">
            <AdminInput
              id="unit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="caja"
              className="lowercase"
            />
          </AdminField>
        </form>
      </AdminModal>
    </div>
  )
}
