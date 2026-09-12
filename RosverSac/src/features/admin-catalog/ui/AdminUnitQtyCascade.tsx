import { api, ApiError } from '@/shared/lib/api'
import { cn, formatInternalCode } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Pen, Plus, Trash } from 'cssvg-icons'
import { useEffect, useState } from 'react'

type UnitType = {
  id: string
  code: string
  internalCode?: number | null
  name: string
  isBase?: boolean
}

type UnitQty = {
  id: string
  unitTypeId: string
  code?: number | null
  contentQty: number
  label: string | null
  sortOrder: number
}

function qtyLabel(q: UnitQty) {
  const n = Number(q.contentQty)
  const base = Number.isInteger(n) ? String(n) : n.toFixed(2)
  if (q.label?.trim()) return `${q.label.trim()} · ${base} u.`
  return `${base} unidad${n === 1 ? '' : 'es'}`
}

/**
 * Cascada tipo ubigeo: tipos de unidad | cantidades de esa presentación.
 * CRUD completo en ambos paneles.
 */
export function AdminUnitQtyCascade() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [units, setUnits] = useState<UnitType[]>([])
  const [quantities, setQuantities] = useState<UnitQty[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [loadingQty, setLoadingQty] = useState(false)
  const [busy, setBusy] = useState(false)

  const [unitModal, setUnitModal] = useState(false)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [unitName, setUnitName] = useState('')
  const [unitInternalCode, setUnitInternalCode] = useState<number | null>(null)

  const [qtyModal, setQtyModal] = useState(false)
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null)
  const [contentQty, setContentQty] = useState('')
  const [qtyInternalCode, setQtyInternalCode] = useState<number | null>(null)

  const selected = units.find((u) => u.id === selectedId) ?? null

  async function loadUnits(preferId?: string | null) {
    setLoadingUnits(true)
    try {
      const data = await api<{ unitTypes: UnitType[] }>('/api/admin/unit-types')
      setUnits(data.unitTypes)
      const next =
        (preferId && data.unitTypes.some((u) => u.id === preferId)
          ? preferId
          : null) ??
        (selectedId && data.unitTypes.some((u) => u.id === selectedId)
          ? selectedId
          : null) ??
        data.unitTypes[0]?.id ??
        null
      setSelectedId(next)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar las unidades',
      ])
    } finally {
      setLoadingUnits(false)
    }
  }

  async function loadQuantities(unitId: string) {
    setLoadingQty(true)
    try {
      const data = await api<{ quantities: UnitQty[] }>(
        `/api/admin/unit-types/${unitId}/quantities`,
      )
      setQuantities(data.quantities)
    } catch (e) {
      setQuantities([])
      showMessages([
        e instanceof ApiError
          ? e.message
          : 'No se pudieron cargar las cantidades',
      ])
    } finally {
      setLoadingQty(false)
    }
  }

  useEffect(() => {
    void loadUnits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setQuantities([])
      return
    }
    void loadQuantities(selectedId)
  }, [selectedId])

  function openCreateUnit() {
    clear()
    setEditingUnitId(null)
    setUnitName('')
    setUnitInternalCode(null)
    setUnitModal(true)
    void api<{ code: number }>('/api/admin/unit-types/next-code')
      .then((r) => {
        if (typeof r.code === 'number' && Number.isFinite(r.code)) {
          setUnitInternalCode(r.code)
        }
      })
      .catch(() => {
        /* preview opcional */
      })
  }

  function openEditUnit(u: UnitType) {
    clear()
    setEditingUnitId(u.id)
    setUnitName(u.name)
    setUnitInternalCode(
      typeof u.internalCode === 'number' && Number.isFinite(u.internalCode)
        ? u.internalCode
        : null,
    )
    setUnitModal(true)
  }

  async function saveUnit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!unitName.trim()) {
      showMessages(['Escribe el nombre del tipo de unidad'])
      return
    }
    setBusy(true)
    try {
      if (editingUnitId) {
        await api(`/api/admin/unit-types/${editingUnitId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: unitName.trim(),
          }),
        })
        showMessages(['Tipo de unidad actualizado'])
        setUnitModal(false)
        await loadUnits(editingUnitId)
      } else {
        const res = await api<{ unitType: UnitType }>('/api/admin/unit-types', {
          method: 'POST',
          body: JSON.stringify({
            name: unitName.trim(),
          }),
        })
        showMessages(['Tipo de unidad creado'])
        setUnitModal(false)
        await loadUnits(res.unitType.id)
      }
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function deleteUnit(u: UnitType) {
    if (!window.confirm(`¿Eliminar el tipo «${u.name}»?`)) return
    clear()
    try {
      await api(`/api/admin/unit-types/${u.id}`, { method: 'DELETE' })
      showMessages(['Tipo de unidad eliminado'])
      if (selectedId === u.id) setSelectedId(null)
      await loadUnits()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  function openCreateQty() {
    if (!selectedId) {
      showMessages(['Elige un tipo de unidad primero'])
      return
    }
    clear()
    setEditingQtyId(null)
    setContentQty('')
    setQtyInternalCode(null)
    setQtyModal(true)
    void api<{ code: number }>('/api/admin/unit-type-quantities/next-code')
      .then((r) => {
        if (typeof r.code === 'number' && Number.isFinite(r.code)) {
          setQtyInternalCode(r.code)
        }
      })
      .catch(() => {
        /* preview opcional */
      })
  }

  function openEditQty(q: UnitQty) {
    clear()
    setEditingQtyId(q.id)
    setContentQty(String(q.contentQty))
    setQtyInternalCode(
      typeof q.code === 'number' && Number.isFinite(q.code) ? q.code : null,
    )
    setQtyModal(true)
  }

  async function saveQty(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId) return
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica una cantidad válida (mayor que 0)'])
      return
    }
    setBusy(true)
    try {
      if (editingQtyId) {
        await api(`/api/admin/unit-type-quantities/${editingQtyId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            contentQty: qty,
            label: null,
          }),
        })
        showMessages(['Cantidad actualizada'])
      } else {
        await api(`/api/admin/unit-types/${selectedId}/quantities`, {
          method: 'POST',
          body: JSON.stringify({
            contentQty: qty,
            label: null,
          }),
        })
        showMessages(['Cantidad agregada'])
      }
      setQtyModal(false)
      await loadQuantities(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function deleteQty(q: UnitQty) {
    if (!window.confirm(`¿Eliminar «${qtyLabel(q)}»?`)) return
    clear()
    try {
      await api(`/api/admin/unit-type-quantities/${q.id}`, { method: 'DELETE' })
      showMessages(['Cantidad eliminada'])
      if (selectedId) await loadQuantities(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  return (
    <div className="space-y-3">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-rosver-line bg-rosver-soft/50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-rosver-ink">Tipo de unidad</p>
              <p className="text-[11px] text-rosver-muted">
                Ej. Caja, Paquete, Unidad
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateUnit}
              className="inline-flex items-center gap-1 rounded-full bg-rosver-red px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rosver-red-dark"
            >
              <Plus size={14} color="currentColor" strokeWidth={2} />
              Nuevo
            </button>
          </div>
          <div className="max-h-[22rem] overflow-y-auto p-2">
            {loadingUnits ? (
              <AdminEmptyState title="Cargando…" />
            ) : units.length === 0 ? (
              <AdminEmptyState
                title="Sin tipos de unidad"
                detail="Crea el primero (ej. Caja)."
              />
            ) : (
              <ul className="space-y-1">
                {units.map((u) => {
                  const active = u.id === selectedId
                  return (
                    <li key={u.id}>
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-xl px-1 py-1 transition',
                          active
                            ? 'bg-rosver-soft ring-1 ring-rosver-line'
                            : 'hover:bg-rosver-soft/60',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(u.id)}
                          className={cn(
                            'min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold',
                            active ? 'text-rosver-ink' : 'text-rosver-muted',
                          )}
                        >
                          {u.name}
                          <span className="mt-0.5 block font-mono text-[10px] font-medium text-rosver-muted">
                            {formatInternalCode(u.internalCode)}
                            {u.isBase ? ' · base' : ''}
                          </span>
                        </button>
                        <button
                          type="button"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => openEditUnit(u)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-rosver-ink hover:bg-rosver-yellow/80"
                        >
                          <Pen size={14} color="currentColor" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => void deleteUnit(u)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-rosver-muted hover:bg-rosver-red hover:text-white"
                        >
                          <Trash
                            size={14}
                            color="currentColor"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-rosver-line bg-rosver-soft/50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-rosver-ink">
                Cantidades
                {selected ? (
                  <span className="font-semibold text-rosver-red">
                    {' '}
                    · {selected.name}
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-rosver-muted">
                Ej. 10, 20, 100 unidades por presentación
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedId}
              onClick={openCreateQty}
              className="inline-flex items-center gap-1 rounded-full bg-rosver-red px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rosver-red-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} color="currentColor" strokeWidth={2} />
              Nueva
            </button>
          </div>
          <div className="max-h-[22rem] overflow-y-auto p-2">
            {!selectedId ? (
              <AdminEmptyState
                title="Elige un tipo"
                detail="Selecciona Caja, Paquete… a la izquierda."
              />
            ) : loadingQty ? (
              <AdminEmptyState title="Cargando…" />
            ) : quantities.length === 0 ? (
              <AdminEmptyState
                title="Sin cantidades"
                detail={`Agrega cuántas unidades trae cada «${selected?.name}».`}
              />
            ) : (
              <ul className="space-y-1">
                {quantities.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center gap-1 rounded-xl bg-rosver-soft/50 px-1 py-1 ring-1 ring-rosver-line/80"
                  >
                    <div className="min-w-0 flex-1 px-3 py-2">
                      <p className="text-sm font-semibold text-rosver-ink">
                        {qtyLabel(q)}
                      </p>
                      {q.code != null ? (
                        <p className="font-mono text-[10px] text-rosver-muted">
                          {formatInternalCode(q.code)}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      title="Editar"
                      aria-label="Editar"
                      onClick={() => openEditQty(q)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-rosver-ink hover:bg-rosver-yellow/80"
                    >
                      <Pen size={14} color="currentColor" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      title="Eliminar"
                      aria-label="Eliminar"
                      onClick={() => void deleteQty(q)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-rosver-muted hover:bg-rosver-red hover:text-white"
                    >
                      <Trash size={14} color="currentColor" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <AdminModal
        open={unitModal}
        onClose={() => setUnitModal(false)}
        title={editingUnitId ? 'Editar tipo de unidad' : 'Nuevo tipo de unidad'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setUnitModal(false)}
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
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form
          id="unit-type-form"
          noValidate
          onSubmit={(e) => void saveUnit(e)}
          className="space-y-4"
        >
          <AdminField label="Código interno" htmlFor="ut-code">
            <AdminInput
              id="ut-code"
              readOnly
              tabIndex={-1}
              autoComplete="off"
              value={formatInternalCode(unitInternalCode)}
              className="cursor-default bg-rosver-soft font-mono text-base font-bold tabular-nums tracking-wide text-rosver-ink"
              aria-readonly="true"
            />
          </AdminField>
          <AdminField label="Nombre" htmlFor="ut-name">
            <AdminInput
              id="ut-name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Ej. Caja"
            />
          </AdminField>
        </form>
      </AdminModal>

      <AdminModal
        open={qtyModal}
        onClose={() => setQtyModal(false)}
        title={editingQtyId ? 'Editar cantidad' : 'Nueva cantidad'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setQtyModal(false)}
              className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="unit-qty-form"
              disabled={busy}
              className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form
          id="unit-qty-form"
          noValidate
          onSubmit={(e) => void saveQty(e)}
          className="space-y-4"
        >
          <AdminField label="Código interno" htmlFor="uq-code">
            <AdminInput
              id="uq-code"
              readOnly
              tabIndex={-1}
              autoComplete="off"
              value={formatInternalCode(qtyInternalCode)}
              className="cursor-default bg-rosver-soft font-mono text-base font-bold tabular-nums tracking-wide text-rosver-ink"
              aria-readonly="true"
            />
          </AdminField>
          <AdminField label="Tipo de unidad" htmlFor="uq-unit">
            <AdminInput
              id="uq-unit"
              readOnly
              tabIndex={-1}
              autoComplete="off"
              value={selected?.name ?? '—'}
              className="cursor-default bg-rosver-soft font-semibold text-rosver-ink"
              aria-readonly="true"
            />
          </AdminField>
          <AdminField label="Cantidad" htmlFor="uq-qty">
            <AdminInput
              id="uq-qty"
              type="number"
              min={0.0001}
              step="any"
              value={contentQty}
              onChange={(e) => setContentQty(e.target.value)}
              placeholder="Ej. 100"
            />
          </AdminField>
        </form>
      </AdminModal>
    </div>
  )
}
