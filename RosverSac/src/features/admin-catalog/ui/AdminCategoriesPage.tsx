import { api, ApiError } from '@/shared/lib/api'
import { cnField } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { useEffect, useMemo, useState } from 'react'

type Category = {
  id: string
  parentId: string | null
  code: number
  sku: string | null
  name: string
  slug: string
  visible: boolean
  showInNav: boolean
}

export function AdminCategoriesPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [parentId, setParentId] = useState('')
  const [busy, setBusy] = useState(false)

  const roots = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  )

  async function load() {
    setLoading(true)
    try {
      const data = await api<{ categories: Category[] }>('/api/admin/categories')
      setCategories(data.categories)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar categorías',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    if (!name.trim()) {
      showMessages(['Nombre de categoría obligatorio'])
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || undefined,
          parentId: parentId || null,
          showInNav: true,
        }),
      })
      setName('')
      setSku('')
      setParentId('')
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo crear la categoría',
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-rosver-ink">
          Categorías
        </h2>
        <p className="mt-1 text-sm text-rosver-muted">
          Raíces → topbar “Ver categorías”. Con padre = subcategoría (filtros / menú).
        </p>
      </header>

      <form
        noValidate
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className={cnField(
              'h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm outline-none focus:border-rosver-red/40 focus:ring-2 focus:ring-rosver-red/15',
              false,
            )}
          />
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU (opcional)"
            className="h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm uppercase outline-none focus:border-rosver-red/40"
          />
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm outline-none"
          >
            <option value="">Sin padre (raíz / topbar)</option>
            {roots.map((r) => (
              <option key={r.id} value={r.id}>
                Sub de: {r.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <ul className="divide-y divide-rosver-line">
          {loading ? (
            <li className="px-4 py-8 text-center text-sm text-rosver-muted">Cargando…</li>
          ) : categories.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-rosver-muted">
              Sin categorías. Crea raíces para el topbar.
            </li>
          ) : (
            roots.map((root) => {
              const children = categories.filter((c) => c.parentId === root.id)
              return (
                <li key={root.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-rosver-ink">{root.name}</span>
                    <span className="text-xs text-rosver-muted">/{root.slug}</span>
                    {root.showInNav ? (
                      <span className="rounded-full bg-rosver-red/10 px-2 py-0.5 text-[10px] font-bold text-rosver-red">
                        NAV
                      </span>
                    ) : null}
                  </div>
                  {children.length ? (
                    <ul className="mt-2 space-y-1 border-l border-rosver-line pl-4">
                      {children.map((ch) => (
                        <li key={ch.id} className="text-sm text-rosver-muted">
                          <span className="font-medium text-rosver-ink">{ch.name}</span>
                          <span className="ml-2 text-xs">/{ch.slug}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-rosver-muted">Sin subcategorías</p>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
