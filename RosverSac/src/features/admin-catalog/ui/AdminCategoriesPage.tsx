import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
} from '@/shared/ui/admin-field'
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
  const [query, setQuery] = useState('')

  const roots = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  )

  const filteredRoots = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roots
    return roots.filter((r) => {
      const kids = categories.filter((c) => c.parentId === r.id)
      return (
        r.name.toLowerCase().includes(q) ||
        kids.some((k) => k.name.toLowerCase().includes(q))
      )
    })
  }, [roots, categories, query])

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
      showMessages(['Escribe el nombre de la categoría'])
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
      <AdminPageHeader
        title="Categorías"
        actions={
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rosver-muted ring-1 ring-rosver-line">
            {categories.length} en total
          </span>
        }
      />

      <form
        noValidate
        onSubmit={onSubmit}
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="mb-4 text-sm font-semibold text-rosver-ink">Nueva categoría</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="Nombre" htmlFor="cat-name">
            <AdminInput
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Herramientas"
            />
          </AdminField>
          <AdminField label="Código interno (opcional)" htmlFor="cat-sku">
            <AdminInput
              id="cat-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Opcional"
              className="uppercase"
            />
          </AdminField>
          <AdminField label="Ubicación" htmlFor="cat-parent">
            <AdminSelect
              id="cat-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Categoría principal (menú)</option>
              {roots.map((r) => (
                <option key={r.id} value={r.id}>
                  Dentro de: {r.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : 'Agregar categoría'}
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar categoría…"
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState title="Cargando…" />
          </div>
        ) : filteredRoots.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState
              title="Todavía no hay categorías"
              detail="Crea una categoría principal para el menú de la tienda."
            />
          </div>
        ) : (
          filteredRoots.map((root) => {
            const children = categories.filter((c) => c.parentId === root.id)
            return (
              <article
                key={root.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm"
              >
                <div className="flex items-start gap-3 border-b border-rosver-line bg-gradient-to-br from-rosver-soft/80 to-white p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rosver-ink text-sm font-bold text-white">
                    {root.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-rosver-ink">{root.name}</h3>
                      {root.showInNav ? (
                        <span className="rounded-full bg-rosver-red/10 px-2 py-0.5 text-[10px] font-bold text-rosver-red">
                          En el menú
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-rosver-muted">
                      Principal · {children.length}{' '}
                      {children.length === 1 ? 'subcategoría' : 'subcategorías'}
                    </p>
                  </div>
                </div>
                <ul className="flex-1 divide-y divide-rosver-line">
                  {children.length === 0 ? (
                    <li className="px-4 py-3 text-xs text-rosver-muted">
                      Sin grupos dentro
                    </li>
                  ) : (
                    children.map((ch) => (
                      <li
                        key={ch.id}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-rosver-ink"
                      >
                        <span className="size-1.5 rounded-full bg-rosver-red/60" aria-hidden />
                        <span className="min-w-0 truncate font-medium">{ch.name}</span>
                      </li>
                    ))
                  )}
                </ul>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
