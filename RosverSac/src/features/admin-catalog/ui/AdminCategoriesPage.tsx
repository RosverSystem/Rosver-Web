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
import { AdminImageUpload } from '@/shared/ui/admin-image-upload'
import { AdminModal } from '@/shared/ui/admin-modal'
import { CategoryHomeCard } from '@/features/catalog'
import { IconWrench } from '@/shared/ui/icons'
import { AdminWebPreview } from './AdminWebPreview'
import { useEffect, useMemo, useState } from 'react'

type Category = {
  id: string
  parentId: string | null
  code: number
  sku: string | null
  name: string
  slug: string
  imageUrl?: string | null
  visible: boolean
  showInNav: boolean
  showOnHome?: boolean
  tagline?: string | null
  highlightPoints?: string[]
}

const emptyForm = () => ({
  name: '',
  sku: '',
  parentId: '',
  tagline: '',
  point1: '',
  point2: '',
  point3: '',
  imageUrl: '',
  showInNav: true,
  showOnHome: true,
})

export function AdminCategoriesPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  const isRoot = !form.parentId

  const previewCategory = useMemo(
    () => ({
      name: form.name,
      slug: 'preview',
      tagline: form.tagline || undefined,
      points: [form.point1, form.point2, form.point3].filter((p) => p.trim()),
      imageUrl: form.imageUrl || undefined,
      icon: IconWrench,
    }),
    [form.imageUrl, form.name, form.point1, form.point2, form.point3, form.tagline],
  )

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

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm())
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function startEdit(cat: Category) {
    const pts = cat.highlightPoints ?? []
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      sku: cat.sku ?? '',
      parentId: cat.parentId ?? '',
      tagline: cat.tagline ?? '',
      point1: pts[0] ?? '',
      point2: pts[1] ?? '',
      point3: pts[2] ?? '',
      imageUrl: cat.imageUrl ?? '',
      showInNav: cat.showInNav,
      showOnHome: Boolean(cat.showOnHome),
    })
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
    if (!form.name.trim()) errors.push('Escribe el nombre de la categoría')

    const points = [form.point1, form.point2, form.point3]
      .map((p) => p.trim())
      .filter(Boolean)

    if (isRoot && form.showOnHome) {
      if (!form.tagline.trim()) {
        errors.push('Etiqueta corta (texto rojo arriba del nombre en el inicio)')
      }
      if (!points.length) {
        errors.push('Al menos un punto destacado para la card del inicio')
      }
      if (!form.imageUrl.trim()) {
        errors.push('Sube o pega la imagen de la card del inicio')
      }
    }
    if (errors.length) {
      showMessages(errors)
      return
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      parentId: form.parentId || null,
      showInNav: form.showInNav,
      showOnHome: isRoot ? form.showOnHome : false,
      tagline: isRoot ? form.tagline.trim() || null : null,
      highlightPoints: isRoot ? points : [],
      imageUrl: form.imageUrl.trim() || undefined,
    }

    setBusy(true)
    try {
      if (editingId) {
        await api(`/api/admin/categories/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      closeModal()
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError
          ? err.message
          : 'No se pudo guardar la categoría',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar la categoría «${name}»?`)) return
    clear()
    try {
      await api(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (editingId === id) closeModal()
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
        title="Categorías"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rosver-muted ring-1 ring-rosver-line">
              {categories.length} en total
            </span>
            <button
              type="button"
              onClick={openCreate}
              className="h-9 rounded-xl bg-rosver-red px-4 text-xs font-semibold text-white hover:bg-rosver-red-dark"
            >
              Nueva categoría
            </button>
          </div>
        }
      />

      <AdminInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar categoría…"
        className="max-w-sm"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState title="Cargando…" />
          </div>
        ) : filteredRoots.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState
              title="Todavía no hay categorías"
              detail="Usa «Nueva categoría» para crear una."
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
                  {root.imageUrl ? (
                    <img
                      src={root.imageUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rosver-ink text-sm font-bold text-white">
                      {root.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-rosver-ink">
                        {root.name}
                      </h3>
                      {root.showInNav ? (
                        <span className="rounded-full bg-rosver-red/10 px-2 py-0.5 text-[10px] font-bold text-rosver-red">
                          Menú
                        </span>
                      ) : null}
                      {root.showOnHome ? (
                        <span className="rounded-full bg-rosver-ink/10 px-2 py-0.5 text-[10px] font-bold text-rosver-ink">
                          Inicio
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-rosver-muted">
                      {root.tagline || 'Sin etiqueta de inicio'} · {children.length}{' '}
                      {children.length === 1 ? 'subcategoría' : 'subcategorías'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(root)}
                        className="text-xs font-semibold text-rosver-red hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(root.id, root.name)}
                        className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                      >
                        Eliminar
                      </button>
                    </div>
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
                        className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-rosver-ink"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-1.5 shrink-0 rounded-full bg-rosver-red/60"
                            aria-hidden
                          />
                          <span className="truncate font-medium">{ch.name}</span>
                        </span>
                        <span className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(ch)}
                            className="text-xs font-semibold text-rosver-red"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(ch.id, ch.name)}
                            className="text-xs font-semibold text-rosver-muted hover:text-rosver-red"
                          >
                            Eliminar
                          </button>
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </article>
            )
          })
        )}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar categoría' : 'Nueva categoría'}
        size="xl"
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
              form="category-form"
              disabled={busy}
              className="h-10 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy
                ? 'Guardando…'
                : editingId
                  ? 'Guardar cambios'
                  : 'Agregar categoría'}
            </button>
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
          <form
            id="category-form"
            noValidate
            onSubmit={onSubmit}
            className="min-w-0 space-y-4"
          >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminField label="Nombre" htmlFor="cat-name">
              <AdminInput
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Herramientas"
              />
            </AdminField>
            <AdminField label="Código interno (opcional)" htmlFor="cat-sku">
              <AdminInput
                id="cat-sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="Opcional"
                className="uppercase"
              />
            </AdminField>
            <AdminField label="Ubicación" htmlFor="cat-parent">
              <AdminSelect
                id="cat-parent"
                value={form.parentId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parentId: e.target.value,
                    showOnHome: e.target.value ? false : f.showOnHome,
                  }))
                }
              >
                <option value="">Categoría principal (menú)</option>
                {roots
                  .filter((r) => r.id !== editingId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Dentro de: {r.name}
                    </option>
                  ))}
              </AdminSelect>
            </AdminField>
          </div>

          {isRoot ? (
            <div className="space-y-4 rounded-xl border border-rosver-line bg-rosver-soft/40 p-4">
              <p className="text-sm font-semibold text-rosver-ink">
                Card en inicio — «Explora por categoría»
              </p>
              <label className="flex items-center gap-2 text-sm text-rosver-ink">
                <input
                  type="checkbox"
                  checked={form.showOnHome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, showOnHome: e.target.checked }))
                  }
                  className="size-4 rounded border-rosver-line text-rosver-red"
                />
                Mostrar en el inicio
              </label>
              <label className="flex items-center gap-2 text-sm text-rosver-ink">
                <input
                  type="checkbox"
                  checked={form.showInNav}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, showInNav: e.target.checked }))
                  }
                  className="size-4 rounded border-rosver-line text-rosver-red"
                />
                Mostrar en menú «Ver categorías»
              </label>
              {form.showOnHome ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Etiqueta corta" htmlFor="cat-tagline">
                    <AdminInput
                      id="cat-tagline"
                      value={form.tagline}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tagline: e.target.value }))
                      }
                      placeholder="Ej. Listas para obra y taller"
                    />
                  </AdminField>
                  <div className="sm:col-span-2">
                    <AdminImageUpload
                      folder="categories"
                      value={form.imageUrl}
                      onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                      onError={(msg) => showMessages([msg])}
                      label="Imagen de la card"
                    />
                  </div>
                  <AdminField label="Punto 1" htmlFor="cat-p1">
                    <AdminInput
                      id="cat-p1"
                      value={form.point1}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, point1: e.target.value }))
                      }
                      placeholder="Ej. Marcas de importación"
                    />
                  </AdminField>
                  <AdminField label="Punto 2" htmlFor="cat-p2">
                    <AdminInput
                      id="cat-p2"
                      value={form.point2}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, point2: e.target.value }))
                      }
                      placeholder="Ej. Stock continuo"
                    />
                  </AdminField>
                  <AdminField label="Punto 3" htmlFor="cat-p3">
                    <AdminInput
                      id="cat-p3"
                      value={form.point3}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, point3: e.target.value }))
                      }
                      placeholder="Ej. Asesoría técnica"
                    />
                  </AdminField>
                </div>
              ) : null}
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm text-rosver-ink">
              <input
                type="checkbox"
                checked={form.showInNav}
                onChange={(e) =>
                  setForm((f) => ({ ...f, showInNav: e.target.checked }))
                }
                className="size-4 rounded border-rosver-line text-rosver-red"
              />
              Mostrar en el menú (bajo su categoría padre)
            </label>
          )}
        </form>

          <AdminWebPreview
            label={
              isRoot
                ? 'Vista previa — inicio (Explora por categoría)'
                : 'Vista previa — card de categoría'
            }
            className="lg:sticky lg:top-0"
            wide
          >
            <CategoryHomeCard
              category={previewCategory}
              preview
              className="mx-auto"
            />
            {isRoot && !form.showOnHome ? (
              <p className="mt-3 text-center text-[11px] text-rosver-muted">
                No aparecerá en el inicio hasta marcar «Mostrar en el inicio».
              </p>
            ) : null}
          </AdminWebPreview>
        </div>
      </AdminModal>
    </div>
  )
}
