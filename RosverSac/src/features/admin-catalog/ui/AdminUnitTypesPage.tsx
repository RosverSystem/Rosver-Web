import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { useEffect, useState } from 'react'

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

  function startEdit(u: UnitType) {
    setEditingId(u.id)
    setName(u.name)
    setCode(u.code)
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
      } else {
        await api('/api/admin/unit-types', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      reset()
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
      if (editingId === u.id) reset()
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader title="Tipos de unidad" />

      <form
        noValidate
        onSubmit={onSubmit}
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="mb-4 text-sm font-semibold text-rosver-ink">
          {editingId ? 'Editar unidad' : 'Nueva unidad'}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : editingId ? 'Guardar' : 'Crear'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={reset}
                className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : units.length === 0 ? (
          <AdminEmptyState title="Sin unidades" detail="Crea unidad, paquete o caja." />
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
    </div>
  )
}
