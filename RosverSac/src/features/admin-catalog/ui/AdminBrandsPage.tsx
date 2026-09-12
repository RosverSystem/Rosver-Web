import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
} from '@/shared/ui/admin-field'
import { AdminImageUpload } from '@/shared/ui/admin-image-upload'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Pen, Search, Trash } from 'cssvg-icons'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'

type Brand = {
  id: string
  code: number
  sku: string
  name: string
  slug: string
  logoUrl?: string | null
  visible: boolean
  showOnHome?: boolean
  sortOrder?: number
}

type HomeFilter = 'all' | 'home' | 'off'
type VisibleFilter = 'all' | 'visible' | 'hidden'

export function AdminBrandsPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [showOnHome, setShowOnHome] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [homeFilter, setHomeFilter] = useState<HomeFilter>('all')
  const [visibleFilter, setVisibleFilter] = useState<VisibleFilter>('all')

  const stats = useMemo(() => {
    const visible = brands.filter((b) => b.visible).length
    const onHome = brands.filter((b) => b.showOnHome !== false).length
    return { total: brands.length, visible, onHome, hidden: brands.length - visible }
  }, [brands])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return brands.filter((b) => {
      if (visibleFilter === 'visible' && !b.visible) return false
      if (visibleFilter === 'hidden' && b.visible) return false
      if (homeFilter === 'home' && b.showOnHome === false) return false
      if (homeFilter === 'off' && b.showOnHome !== false) return false
      if (!q) return true
      return (
        b.name.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        String(b.code).includes(q)
      )
    })
  }, [brands, deferredQuery, homeFilter, visibleFilter])

  async function load() {
    setLoading(true)
    try {
      const data = await api<{ brands: Brand[] }>('/api/admin/brands')
      setBrands(data.brands)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar marcas',
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
    setName('')
    setSku('')
    setLogoUrl('')
    setShowOnHome(true)
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function startEdit(b: Brand) {
    setEditingId(b.id)
    setName(b.name)
    setSku(b.sku)
    setLogoUrl(b.logoUrl ?? '')
    setShowOnHome(b.showOnHome !== false)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const errors: string[] = []
    if (!name.trim()) errors.push('Escribe el nombre de la marca')
    if (!sku.trim()) errors.push('Escribe el código de marca')
    if (errors.length) {
      showMessages(errors)
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        showOnHome,
        logoUrl: logoUrl.trim() || null,
      }
      if (editingId) {
        await api(`/api/admin/brands/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        showMessages(['Marca actualizada'])
      } else {
        await api('/api/admin/brands', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        showMessages(['Marca creada'])
      }
      closeModal()
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo guardar la marca',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function toggleHome(b: Brand) {
    clear()
    try {
      await api(`/api/admin/brands/${b.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ showOnHome: !b.showOnHome }),
      })
      await load()
      showMessages([
        b.showOnHome !== false
          ? 'Marca quitada del inicio'
          : 'Marca agregada al inicio',
      ])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo actualizar',
      ])
    }
  }

  async function onDelete(id: string, brandName: string) {
    if (!window.confirm(`¿Eliminar la marca «${brandName}»?`)) return
    clear()
    try {
      await api(`/api/admin/brands/${id}`, { method: 'DELETE' })
      if (editingId === id) closeModal()
      await load()
      showMessages(['Marca eliminada'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Marcas"
        description="Proveedores y logos que se muestran en la tienda."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Visibles', value: stats.visible, tone: 'success' },
          { label: 'En inicio', value: stats.onHome, tone: 'warning' },
          { label: 'Ocultas', value: stats.hidden, tone: 'danger' },
        ]}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white uppercase shadow-sm shadow-rosver-red/30 hover:bg-rosver-red-dark"
          >
            Nueva marca
          </button>
        }
      />

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
              placeholder="Nombre, código o SKU…"
              className="w-full rounded-xl border border-rosver-line bg-white py-2.5 pr-3 pl-10 text-sm text-rosver-ink outline-none placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/15"
            />
          </div>
        </label>
        <label className="block w-full sm:w-40">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Visibilidad
          </span>
          <AdminSelect
            value={visibleFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || v === 'visible' || v === 'hidden') {
                setVisibleFilter(v)
              }
            }}
          >
            <option value="all">Todas</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultas</option>
          </AdminSelect>
        </label>
        <label className="block w-full sm:w-44">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Inicio
          </span>
          <AdminSelect
            value={homeFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || v === 'home' || v === 'off') setHomeFilter(v)
            }}
          >
            <option value="all">Todas</option>
            <option value="home">En el inicio</option>
            <option value="off">Fuera del inicio</option>
          </AdminSelect>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState title="Cargando…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState
              title={
                brands.length === 0
                  ? 'Todavía no hay marcas'
                  : 'Sin resultados'
              }
              detail={
                brands.length === 0
                  ? 'Usa «Nueva marca» para crear una.'
                  : 'Prueba otro filtro o búsqueda.'
              }
            />
          </div>
        ) : (
          filtered.map((b) => (
            <article
              key={b.id}
              className="flex items-center gap-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm transition hover:border-rosver-red/25 hover:shadow-md"
            >
              {b.logoUrl ? (
                <img
                  src={b.logoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-2xl object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rosver-soft text-base font-bold text-rosver-ink">
                  {b.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold text-rosver-ink">
                    {b.name}
                  </h3>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      b.visible
                        ? 'bg-rosver-success text-white'
                        : 'bg-rosver-soft text-rosver-muted',
                    )}
                  >
                    {b.visible ? 'Visible' : 'Oculta'}
                  </span>
                  {b.showOnHome !== false ? (
                    <span className="rounded-full bg-rosver-yellow px-2 py-0.5 text-[10px] font-bold text-rosver-ink">
                      Inicio
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-rosver-muted">
                  Código #{b.code} · {b.sku}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    title="Editar"
                    aria-label="Editar"
                    onClick={() => startEdit(b)}
                    className="inline-flex size-9 items-center justify-center rounded-xl bg-rosver-yellow text-rosver-ink shadow-sm shadow-rosver-yellow/30 hover:opacity-90"
                  >
                    <Pen size={16} color="currentColor" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleHome(b)}
                    className="rounded-lg border border-rosver-line px-2.5 py-1.5 text-[11px] font-bold text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-red"
                  >
                    {b.showOnHome !== false
                      ? 'Quitar inicio'
                      : 'Poner inicio'}
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    aria-label="Eliminar"
                    onClick={() => void onDelete(b.id, b.name)}
                    className="inline-flex size-9 items-center justify-center rounded-xl bg-rosver-red text-white shadow-sm shadow-rosver-red/25 hover:bg-rosver-red-dark"
                  >
                    <Trash size={16} color="currentColor" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar marca' : 'Nueva marca'}
        size="lg"
        layer={80}
        closeOnEscape={false}
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
              form="brand-form"
              disabled={busy}
              className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : editingId ? 'Guardar' : 'Crear marca'}
            </button>
          </>
        }
      >
        <form id="brand-form" noValidate onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Nombre comercial" htmlFor="brand-name">
              <AdminInput
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Bosch"
              />
            </AdminField>
            <AdminField label="Código de marca" htmlFor="brand-sku">
              <AdminInput
                id="brand-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. BOSCH"
                className="uppercase"
              />
            </AdminField>
          </div>
          <AdminImageUpload
            folder="brands"
            value={logoUrl}
            onChange={setLogoUrl}
            onError={(msg) => showMessages([msg])}
            label="Logo"
          />
          <label className="flex items-center gap-2 text-sm text-rosver-ink">
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="size-4 rounded border-rosver-line text-rosver-red"
            />
            Mostrar en el inicio
          </label>
        </form>
      </AdminModal>
    </div>
  )
}
