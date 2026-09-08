import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminCombobox,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { PriceHistoryPanel } from './PriceHistoryPanel'

type ProductRow = {
  id: string
  name: string
  sku: string
  brandName: string | null
}

type UnitType = {
  id: string
  code: string
  name: string
  isBase?: boolean
}

type Packaging = {
  id: string
  unitTypeId: string
  unitName: string
  contentQty: number
  label: string | null
  isDefault: boolean
}

type Price = {
  id: string
  packagingId: string
  priceKind: string
  minQty: number
  amount: number
  compareAtAmount: number | null
  isActive: boolean
}

type ModalKind = 'pack-create' | 'pack-edit' | 'price' | 'unit-create' | null

const KIND_LABEL: Record<string, string> = {
  list: 'Venta',
  wholesale: 'Mayorista',
  offer: 'Oferta',
  custom: 'Otro',
}

function packagingTitle(pk: Packaging) {
  const base = pk.label?.trim() || pk.unitName
  const qty = Number(pk.contentQty)
  return qty === 1 ? `${base} · 1 u.` : `${base} · ${qty} u.`
}

/**
 * Listado de precios — flujo tipo ubicación:
 * 1) tipo de unidad + cantidad → presentación
 * 2) dentro de esa presentación → varios precios (venta, mayorista, oferta…)
 * Formularios create/edit en AdminModal (regla 17).
 */
export function AdminPriceListPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalKind>(null)

  const [unitTypeText, setUnitTypeText] = useState('')
  const [contentQty, setContentQty] = useState('1')
  const [packLabel, setPackLabel] = useState('')
  const [newUnitName, setNewUnitName] = useState('')
  const [listAmount, setListAmount] = useState('')
  const [wholesaleAmount, setWholesaleAmount] = useState('')

  const [packagingId, setPackagingId] = useState('')
  const [editPackQty, setEditPackQty] = useState('1')
  const [editPackLabel, setEditPackLabel] = useState('')
  const [editPackUnitText, setEditPackUnitText] = useState('')
  const [priceKind, setPriceKind] = useState<'list' | 'wholesale' | 'offer'>('offer')
  const [amount, setAmount] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)

  const selected = products.find((p) => p.id === selectedId) ?? null
  const activePack = packagings.find((p) => p.id === packagingId) ?? null
  const pricesForPack = prices.filter(
    (p) => p.isActive && p.packagingId === packagingId,
  )

  async function loadUnitTypes() {
    const units = await api<{ unitTypes: UnitType[] }>('/api/admin/unit-types')
    setUnitTypes(units.unitTypes)
    setUnitTypeText((prev) => {
      if (prev.trim()) return prev
      return units.unitTypes[0]?.name ?? ''
    })
    return units.unitTypes
  }

  async function loadProducts() {
    setLoading(true)
    try {
      const [prod] = await Promise.all([
        api<{ products: ProductRow[] }>('/api/admin/products'),
        loadUnitTypes(),
      ])
      setProducts(prod.products)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo cargar el listado',
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(id: string, preferPackId?: string) {
    setBusy(true)
    try {
      const data = await api<{
        packagings: Packaging[]
        prices: Price[]
      }>(`/api/admin/products/${id}`)
      setPackagings(data.packagings)
      setPrices(data.prices)
      const prefer =
        preferPackId && data.packagings.some((x) => x.id === preferPackId)
          ? preferPackId
          : null
      const def =
        prefer ??
        (data.packagings.find((x) => x.isDefault) ?? data.packagings[0])?.id ??
        ''
      setPackagingId(def)
      const pack = data.packagings.find((x) => x.id === def)
      if (pack) {
        setEditPackQty(String(pack.contentQty))
        setEditPackLabel(pack.label ?? '')
        setEditPackUnitText(pack.unitName)
      }
      setEditingPriceId(null)
      setAmount('')
      setCompareAt('')
      setPriceKind('offer')
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo abrir el producto',
      ])
      setSelectedId(null)
    } finally {
      setBusy(false)
    }
  }

  async function openProduct(id: string) {
    clear()
    setSelectedId(id)
    setModal(null)
    setPackLabel('')
    setContentQty('1')
    setListAmount('')
    setWholesaleAmount('')
    setAmount('')
    setCompareAt('')
    setPriceKind('offer')
    setNewUnitName('')
    await loadDetail(id)
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false),
    )
  }, [products, query])

  function closeModal() {
    setModal(null)
    setNewUnitName('')
    setEditingPriceId(null)
    setAmount('')
    setCompareAt('')
    setPriceKind('offer')
  }

  function openCreatePack() {
    setPackLabel('')
    setContentQty('1')
    setListAmount('')
    setWholesaleAmount('')
    if (!unitTypeText.trim() && unitTypes[0]) {
      setUnitTypeText(unitTypes[0].name)
    }
    setModal('pack-create')
  }

  function openEditPack() {
    if (!activePack) return
    setEditPackQty(String(activePack.contentQty))
    setEditPackLabel(activePack.label ?? '')
    setEditPackUnitText(activePack.unitName)
    setModal('pack-edit')
  }

  function openCreatePrice() {
    setEditingPriceId(null)
    setAmount('')
    setCompareAt('')
    setPriceKind('offer')
    setModal('price')
  }

  function openUnitCreate() {
    setNewUnitName('')
    setModal('unit-create')
  }

  async function createUnitType(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const name = newUnitName.trim()
    if (!name) {
      showMessages(['Escribe el tipo (ej. Caja, Paquete)'])
      return
    }
    setBusy(true)
    try {
      const created = await api<{ unitType: UnitType }>('/api/admin/unit-types', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      setNewUnitName('')
      const list = await loadUnitTypes()
      const id = created.unitType?.id
      if (created.unitType?.name) setUnitTypeText(created.unitType.name)
      else if (id) {
        const match = list.find((u) => u.id === id)
        if (match) setUnitTypeText(match.name)
      } else {
        const match = list.find((u) => u.name.toLowerCase() === name.toLowerCase())
        if (match) setUnitTypeText(match.name)
      }
      setModal(null)
      showMessages(['Tipo creado'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo crear el tipo',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function renameUnitType(id: string, currentName: string) {
    clear()
    const next = window.prompt('Nuevo nombre del tipo', currentName)?.trim()
    if (!next || next === currentName) return
    setBusy(true)
    try {
      await api(`/api/admin/unit-types/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: next }),
      })
      await loadUnitTypes()
      if (selectedId) await loadDetail(selectedId, packagingId || undefined)
      showMessages(['Tipo actualizado'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo renombrar',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function removeUnitType(id: string, name: string) {
    clear()
    if (!window.confirm(`¿Eliminar el tipo «${name}»?`)) return
    setBusy(true)
    try {
      await api(`/api/admin/unit-types/${id}`, { method: 'DELETE' })
      await loadUnitTypes()
      showMessages(['Tipo eliminado'])
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar (puede estar en uso)',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function resolveUnitTypeId(text: string): Promise<string | null> {
    const name = text.trim()
    if (!name) return null
    const existing = unitTypes.find(
      (u) =>
        u.name.toLowerCase() === name.toLowerCase() ||
        u.code.toLowerCase() === name.toLowerCase(),
    )
    if (existing) return existing.id
    const created = await api<{ unitType: UnitType }>('/api/admin/unit-types', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    await loadUnitTypes()
    return created.unitType.id
  }

  async function addPresentation(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId) return
    if (!unitTypeText.trim()) {
      showMessages(['Selecciona o escribe un tipo de unidad'])
      return
    }
    const qty = Number(contentQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica cuántas unidades lleva esa presentación'])
      return
    }
    const listAmt = Number(listAmount)
    if (!Number.isFinite(listAmt) || listAmt < 0) {
      showMessages(['Pon el precio de venta'])
      return
    }
    const whAmt =
      wholesaleAmount.trim() === '' ? null : Number(wholesaleAmount)
    if (whAmt != null && (!Number.isFinite(whAmt) || whAmt < 0)) {
      showMessages(['El precio mayorista no es válido'])
      return
    }
    setBusy(true)
    try {
      const unitTypeId = await resolveUnitTypeId(unitTypeText)
      if (!unitTypeId) {
        showMessages(['Selecciona o escribe un tipo de unidad'])
        return
      }
      const res = await api<{ packaging: { id: string } }>(
        `/api/admin/products/${selectedId}/packagings`,
        {
          method: 'POST',
          body: JSON.stringify({
            unitTypeId,
            contentQty: qty,
            label: packLabel.trim() || undefined,
            isDefault: packagings.length === 0,
          }),
        },
      )
      const packId = res.packaging.id
      await api(`/api/admin/products/${selectedId}/prices`, {
        method: 'POST',
        body: JSON.stringify({
          packagingId: packId,
          priceKind: 'list',
          minQty: 1,
          amount: listAmt,
        }),
      })
      if (whAmt != null) {
        await api(`/api/admin/products/${selectedId}/prices`, {
          method: 'POST',
          body: JSON.stringify({
            packagingId: packId,
            priceKind: 'wholesale',
            minQty: 1,
            amount: whAmt,
          }),
        })
      }
      setPackLabel('')
      setContentQty('1')
      setListAmount('')
      setWholesaleAmount('')
      setModal(null)
      await loadDetail(selectedId, packId)
      showMessages(['Presentación creada con precio'])
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo agregar la presentación',
      ])
    } finally {
      setBusy(false)
    }
  }

  function selectPackaging(pk: Packaging) {
    setPackagingId(pk.id)
    setEditPackQty(String(pk.contentQty))
    setEditPackLabel(pk.label ?? '')
    setEditPackUnitText(pk.unitName)
    setEditingPriceId(null)
    setAmount('')
    setCompareAt('')
    setPriceKind('offer')
  }

  async function updatePresentation(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId || !packagingId) return
    const qty = Number(editPackQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      showMessages(['Indica cuántas unidades lleva'])
      return
    }
    if (!editPackUnitText.trim()) {
      showMessages(['Elige o escribe el tipo de unidad'])
      return
    }
    setBusy(true)
    try {
      const unitTypeId = await resolveUnitTypeId(editPackUnitText)
      if (!unitTypeId) {
        showMessages(['Elige o escribe el tipo de unidad'])
        return
      }
      await api(`/api/admin/products/${selectedId}/packagings/${packagingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          unitTypeId,
          contentQty: qty,
          label: editPackLabel.trim() || null,
        }),
      })
      setModal(null)
      await loadDetail(selectedId, packagingId)
      showMessages(['Presentación actualizada'])
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo actualizar la presentación',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function setDefaultPresentation() {
    if (!selectedId || !packagingId) return
    clear()
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/packagings/${packagingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDefault: true }),
      })
      await loadDetail(selectedId, packagingId)
      showMessages(['Marcada como principal'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo actualizar',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function removePresentation(id: string) {
    if (!selectedId) return
    clear()
    if (
      !window.confirm(
        '¿Eliminar esta presentación y todos sus precios?',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/packagings/${id}`, {
        method: 'DELETE',
      })
      if (modal === 'pack-edit' && packagingId === id) setModal(null)
      await loadDetail(selectedId)
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar la presentación',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function savePrice(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!selectedId) return
    if (!packagingId) {
      showMessages(['Primero selecciona una presentación'])
      return
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 0) {
      showMessages(['Escribe un precio válido'])
      return
    }
    const compare = compareAt.trim() === '' ? null : Number(compareAt)
    if (compare != null && (!Number.isFinite(compare) || compare < 0)) {
      showMessages(['El precio tachado no es válido'])
      return
    }
    setBusy(true)
    try {
      const kind = editingPriceId ? priceKind : 'offer'
      await api(`/api/admin/products/${selectedId}/prices`, {
        method: 'POST',
        body: JSON.stringify({
          id: editingPriceId ?? undefined,
          packagingId,
          priceKind: kind,
          minQty: 1,
          amount: amt,
          compareAtAmount: compare,
          saveAsNew: false,
        }),
      })
      await loadDetail(selectedId, packagingId)
      setAmount('')
      setCompareAt('')
      setEditingPriceId(null)
      setPriceKind('offer')
      setModal(null)
      showMessages([editingPriceId ? 'Precio actualizado' : 'Oferta agregada'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  function startEditPrice(pr: Price) {
    setEditingPriceId(pr.id)
    setPriceKind(pr.priceKind as 'list' | 'wholesale' | 'offer')
    setAmount(String(pr.amount))
    setCompareAt(
      pr.compareAtAmount != null ? String(pr.compareAtAmount) : '',
    )
    setModal('price')
  }

  async function removePrice(id: string) {
    if (!selectedId) return
    clear()
    setBusy(true)
    try {
      await api(`/api/admin/products/${selectedId}/prices/${id}`, {
        method: 'DELETE',
      })
      if (editingPriceId === id) {
        setEditingPriceId(null)
        setModal(null)
      }
      await loadDetail(selectedId, packagingId)
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo quitar el precio',
      ])
    } finally {
      setBusy(false)
    }
  }

  if (selected) {
    return (
      <div className="space-y-5">
        <FloatingToasts toasts={toasts} onDismiss={dismiss} />
        <AdminPageHeader
          title="Listado de precios"
          actions={
            <button
              type="button"
              onClick={() => {
                setSelectedId(null)
                setPackagings([])
                setPrices([])
                setModal(null)
              }}
              className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
            >
              ← Todos los productos
            </button>
          }
        />

        <div className="rounded-2xl border border-rosver-line bg-white px-4 py-3 shadow-sm sm:px-5">
          <p className="text-base font-bold text-rosver-ink">{selected.name}</p>
          <p className="text-xs text-rosver-muted">
            {selected.sku}
            {selected.brandName ? ` · ${selected.brandName}` : ''}
          </p>
        </div>

        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-rosver-ink">Tipos de unidad</h2>
            <button
              type="button"
              onClick={openUnitCreate}
              className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
            >
              Crear tipo
            </button>
          </div>
          {unitTypes.length === 0 ? (
            <p className="text-sm text-rosver-muted">
              Aún no hay tipos. Crea uno para armar presentaciones.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {unitTypes.map((u) => (
                <li
                  key={u.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rosver-line bg-rosver-soft/40 px-2.5 py-1 text-xs"
                >
                  <span className="font-semibold text-rosver-ink">{u.name}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void renameUnitType(u.id, u.name)}
                    className="font-semibold text-rosver-red"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeUnitType(u.id, u.name)}
                    className="font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Borrar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-rosver-ink">Presentaciones</h2>
            <button
              type="button"
              onClick={openCreatePack}
              className="rounded-full bg-rosver-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-rosver-red-dark"
            >
              Nueva presentación
            </button>
          </div>

          {packagings.length === 0 ? (
            <p className="rounded-xl border border-rosver-line px-4 py-6 text-center text-sm text-rosver-muted">
              Aún no hay presentaciones. Usa «Nueva presentación».
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {packagings.map((pk) => {
                const count = prices.filter(
                  (p) => p.isActive && p.packagingId === pk.id,
                ).length
                const active = packagingId === pk.id
                return (
                  <li
                    key={pk.id}
                    className={cn(
                      'flex items-start justify-between gap-2 rounded-xl border px-4 py-3 transition',
                      active
                        ? 'border-rosver-red bg-rosver-red/5 ring-1 ring-rosver-red/30'
                        : 'border-rosver-line bg-white hover:border-rosver-red/35',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectPackaging(pk)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-semibold text-rosver-ink">
                        {packagingTitle(pk)}
                        {pk.isDefault ? (
                          <span className="ml-2 text-[10px] font-bold text-rosver-red">
                            Principal
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-rosver-muted">
                        {count === 0
                          ? 'Sin precios'
                          : `${count} precio${count === 1 ? '' : 's'}`}
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {active ? (
                        <button
                          type="button"
                          onClick={openEditPack}
                          className="text-xs font-semibold text-rosver-red"
                        >
                          Editar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void removePresentation(pk.id)}
                        className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {activePack && !activePack.isDefault ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void setDefaultPresentation()}
              className="text-xs font-semibold text-rosver-ink hover:text-rosver-red"
            >
              Marcar «{packagingTitle(activePack)}» como principal
            </button>
          ) : null}
        </section>

        <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-rosver-ink">Precios</h2>
              {activePack ? (
                <p className="mt-1 text-xs text-rosver-muted">
                  {packagingTitle(activePack)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-rosver-muted">
                  Selecciona una presentación.
                </p>
              )}
            </div>
            {activePack ? (
              <button
                type="button"
                onClick={openCreatePrice}
                className="rounded-full bg-rosver-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-rosver-red-dark"
              >
                Agregar precio
              </button>
            ) : null}
          </div>

          {activePack ? (
            <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
              {pricesForPack.length === 0 ? (
                <li className="px-4 py-4 text-sm text-rosver-muted">
                  Sin precios. Agrega al menos Venta.
                </li>
              ) : (
                pricesForPack.map((pr) => (
                  <li
                    key={pr.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                  >
                    <div>
                      <span className="rounded-full bg-rosver-soft px-2 py-0.5 text-[11px] font-bold text-rosver-ink">
                        {KIND_LABEL[pr.priceKind] ?? pr.priceKind}
                      </span>
                      <span className="ml-2 text-xs text-rosver-muted">
                        desde {pr.minQty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {pr.compareAtAmount != null &&
                      pr.compareAtAmount > pr.amount ? (
                        <span className="text-xs text-rosver-muted line-through">
                          S/ {pr.compareAtAmount.toFixed(2)}
                        </span>
                      ) : null}
                      <span className="font-bold text-rosver-red">
                        S/ {pr.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditPrice(pr)}
                        className="text-xs font-semibold text-rosver-red"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void removePrice(pr.id)}
                        className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </section>

        <PriceHistoryPanel productId={selected.id} />

        <AdminModal
          open={modal === 'unit-create'}
          onClose={closeModal}
          title="Crear tipo de unidad"
          size="md"
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
                form="pl-unit-form"
                disabled={busy}
                className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                {busy ? 'Guardando…' : 'Crear tipo'}
              </button>
            </>
          }
        >
          <form id="pl-unit-form" noValidate onSubmit={createUnitType} className="space-y-4">
            <AdminField label="Nombre del tipo" htmlFor="pl-new-unit">
              <AdminInput
                id="pl-new-unit"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Ej. Caja"
              />
            </AdminField>
          </form>
        </AdminModal>

        <AdminModal
          open={modal === 'pack-create'}
          onClose={closeModal}
          title="Nueva presentación"
          size="lg"
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
                form="pl-pack-create-form"
                disabled={busy || !unitTypeText.trim()}
                className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                {busy ? 'Guardando…' : 'Crear con precio'}
              </button>
            </>
          }
        >
          <form
            id="pl-pack-create-form"
            noValidate
            onSubmit={addPresentation}
            className="grid gap-3 sm:grid-cols-2"
          >
            <AdminField label="Tipo de unidad" htmlFor="pl-unit">
              <AdminCombobox
                id="pl-unit"
                listId="pl-unit-list"
                value={unitTypeText}
                onChange={(e) => setUnitTypeText(e.target.value)}
                placeholder="Elegir o escribir…"
                options={unitTypes.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
              />
            </AdminField>
            <AdminField label="Unidades por presentación" htmlFor="pl-qty">
              <AdminInput
                id="pl-qty"
                inputMode="decimal"
                value={contentQty}
                onChange={(e) => setContentQty(e.target.value)}
                placeholder="1, 12, 24…"
              />
            </AdminField>
            <AdminField label="Nombre (opcional)" htmlFor="pl-label">
              <AdminInput
                id="pl-label"
                value={packLabel}
                onChange={(e) => setPackLabel(e.target.value)}
                placeholder="Ej. Caja x12"
              />
            </AdminField>
            <AdminField label="Precio de venta (S/)" htmlFor="pl-list">
              <AdminInput
                id="pl-list"
                inputMode="decimal"
                value={listAmount}
                onChange={(e) => setListAmount(e.target.value)}
                placeholder="200.00"
              />
            </AdminField>
            <AdminField label="Mayorista (opcional)" htmlFor="pl-wh" className="sm:col-span-2">
              <AdminInput
                id="pl-wh"
                inputMode="decimal"
                value={wholesaleAmount}
                onChange={(e) => setWholesaleAmount(e.target.value)}
                placeholder="S/ …"
              />
            </AdminField>
          </form>
        </AdminModal>

        <AdminModal
          open={modal === 'pack-edit'}
          onClose={closeModal}
          title="Editar presentación"
          size="lg"
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
                form="pl-pack-edit-form"
                disabled={busy}
                className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          }
        >
          <form
            id="pl-pack-edit-form"
            noValidate
            onSubmit={updatePresentation}
            className="grid gap-3 sm:grid-cols-2"
          >
            <AdminField label="Tipo de unidad" htmlFor="pl-edit-unit">
              <AdminCombobox
                id="pl-edit-unit"
                listId="pl-edit-unit-list"
                value={editPackUnitText}
                onChange={(e) => setEditPackUnitText(e.target.value)}
                placeholder="Elegir o escribir…"
                options={unitTypes.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
              />
            </AdminField>
            <AdminField label="Unidades por presentación" htmlFor="pl-edit-qty">
              <AdminInput
                id="pl-edit-qty"
                value={editPackQty}
                onChange={(e) => setEditPackQty(e.target.value)}
              />
            </AdminField>
            <AdminField label="Nombre" htmlFor="pl-edit-label" className="sm:col-span-2">
              <AdminInput
                id="pl-edit-label"
                value={editPackLabel}
                onChange={(e) => setEditPackLabel(e.target.value)}
              />
            </AdminField>
          </form>
        </AdminModal>

        <AdminModal
          open={modal === 'price'}
          onClose={closeModal}
          title={editingPriceId ? 'Editar precio' : 'Agregar oferta'}
          size="lg"
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
                form="pl-price-form"
                disabled={busy}
                className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                {busy
                  ? 'Guardando…'
                  : editingPriceId
                    ? 'Guardar cambios'
                    : 'Agregar oferta'}
              </button>
            </>
          }
        >
          <form
            id="pl-price-form"
            noValidate
            onSubmit={savePrice}
            className="grid gap-3 sm:grid-cols-2"
          >
            {editingPriceId ? (
              <p className="sm:col-span-2 text-sm text-rosver-muted">
                Tipo:{' '}
                <span className="font-semibold text-rosver-ink">
                  {KIND_LABEL[priceKind] ?? priceKind}
                </span>
              </p>
            ) : (
              <p className="sm:col-span-2 text-xs text-rosver-muted">
                Venta y mayorista se cargan al crear la presentación. Aquí solo
                agregas una oferta.
              </p>
            )}
            <AdminField
              label={editingPriceId ? 'Precio (S/)' : 'Precio de oferta (S/)'}
              htmlFor="pl-amt"
            >
              <AdminInput
                id="pl-amt"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </AdminField>
            <AdminField label="Precio tachado" htmlFor="pl-cmp">
              <AdminInput
                id="pl-cmp"
                inputMode="decimal"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                placeholder="Opcional"
              />
            </AdminField>
          </form>
        </AdminModal>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Listado de precios"
        actions={
          <Link
            to="/admin/productos"
            className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
          >
            Productos
          </Link>
        }
      />

      <p className="text-sm text-rosver-muted">
        Abre un producto → crea presentaciones (tipo + cantidad) → en cada una
        configura varios precios.
      </p>

      <AdminInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto, SKU, marca…"
        className="max-w-md"
      />

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : filteredProducts.length === 0 ? (
          <AdminEmptyState
            title="Sin productos"
            detail="Crea un producto primero."
          />
        ) : (
          <ul className="divide-y divide-rosver-line">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => void openProduct(p.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-rosver-soft/50 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-rosver-ink">
                      {p.name}
                    </p>
                    <p className="text-xs text-rosver-muted">
                      {p.sku}
                      {p.brandName ? ` · ${p.brandName}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-rosver-red">
                    Presentaciones y precios →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
