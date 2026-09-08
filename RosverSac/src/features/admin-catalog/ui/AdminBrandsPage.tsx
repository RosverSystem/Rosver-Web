import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { AdminImageUpload } from '@/shared/ui/admin-image-upload'
import { useEffect, useMemo, useState } from 'react'

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

export function AdminBrandsPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [showOnHome, setShowOnHome] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return brands
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        String(b.code).includes(q),
    )
  }, [brands, query])

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

  function startEdit(b: Brand) {
    setEditingId(b.id)
    setName(b.name)
    setSku(b.sku)
    setLogoUrl(b.logoUrl ?? '')
    setShowOnHome(b.showOnHome !== false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      } else {
        await api('/api/admin/brands', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      resetForm()
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
      if (editingId === id) resetForm()
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
      <AdminPageHeader
        title="Marcas"
        actions={
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rosver-muted ring-1 ring-rosver-line">
            {brands.length} marcas
          </span>
        }
      />

      <form
        noValidate
        onSubmit={onSubmit}
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-rosver-ink">
            {editingId ? 'Editar marca' : 'Nueva marca'}
          </p>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="sm:col-span-2 lg:col-span-1">
            <AdminImageUpload
              folder="brands"
              value={logoUrl}
              onChange={setLogoUrl}
              onError={(msg) => showMessages([msg])}
              label="Logo"
            />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-rosver-ink">
          <input
            type="checkbox"
            checked={showOnHome}
            onChange={(e) => setShowOnHome(e.target.checked)}
            className="size-4 rounded border-rosver-line text-rosver-red"
          />
          Mostrar en «Marcas que importamos» (inicio)
        </label>
        <div className="mt-4">
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Guardando…' : editingId ? 'Guardar' : 'Crear marca'}
          </button>
        </div>
      </form>

      <AdminInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar marca…"
        className="max-w-sm"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState title="Cargando…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState
              title="Todavía no hay marcas"
              detail="Al desplegar se cargan Bosch, DeWalt, 3M y las demás por defecto."
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
                />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rosver-soft text-base font-bold text-rosver-ink">
                  {b.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold text-rosver-ink">{b.name}</h3>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      b.visible
                        ? 'bg-rosver-success/15 text-rosver-success'
                        : 'bg-rosver-soft text-rosver-muted',
                    )}
                  >
                    {b.visible ? 'Visible' : 'Oculta'}
                  </span>
                  {b.showOnHome !== false ? (
                    <span className="rounded-full bg-rosver-red/10 px-2 py-0.5 text-[10px] font-bold text-rosver-red">
                      Inicio
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-rosver-muted">
                  Código #{b.code} · {b.sku}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="text-xs font-semibold text-rosver-red hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleHome(b)}
                    className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    {b.showOnHome !== false ? 'Quitar del inicio' : 'Poner en inicio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(b.id, b.name)}
                    className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
