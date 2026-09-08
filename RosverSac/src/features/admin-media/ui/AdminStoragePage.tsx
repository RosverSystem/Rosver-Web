import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Hardrive } from 'cssvg-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type StorageObject = {
  key: string
  size: number
  lastModified: string | null
  url: string
}

type FolderChip = {
  id: string
  label: string
  prefix: string
}

const FOLDERS: FolderChip[] = [
  { id: 'all', label: 'Todos', prefix: '' },
  { id: 'products', label: 'Productos', prefix: 'products/' },
  { id: 'categories', label: 'Categorías', prefix: 'categories/' },
  { id: 'brands', label: 'Marcas', prefix: 'brands/' },
  { id: 'avatars', label: 'Avatares', prefix: 'avatars/' },
]

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function fileName(key: string) {
  const parts = key.split('/')
  return parts[parts.length - 1] || key
}

function isImageKey(key: string) {
  return /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(key)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

/**
 * Biblioteca de medios R2 — carpetas, grid, preview modal, subir / borrar.
 */
export function AdminStoragePage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const inputRef = useRef<HTMLInputElement>(null)
  const [folderId, setFolderId] = useState('all')
  const [query, setQuery] = useState('')
  const [objects, setObjects] = useState<StorageObject[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [uploadFolder, setUploadFolder] = useState<'products' | 'categories' | 'brands'>(
    'products',
  )
  const [preview, setPreview] = useState<StorageObject | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const activeFolder = FOLDERS.find((f) => f.id === folderId) ?? FOLDERS[0]

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (activeFolder.prefix) params.set('prefix', activeFolder.prefix)
        if (query.trim()) params.set('q', query.trim())
        if (cursor) params.set('cursor', cursor)
        const data = await api<{
          objects: StorageObject[]
          nextCursor: string | null
          enabled?: boolean
        }>(`/api/admin/storage?${params.toString()}`)
        setEnabled(true)
        setObjects((prev) => (append ? [...prev, ...data.objects] : data.objects))
        setNextCursor(data.nextCursor)
      } catch (e) {
        if (e instanceof ApiError && e.status === 503) {
          setEnabled(false)
          setObjects([])
          setNextCursor(null)
        }
        showMessages([
          e instanceof ApiError ? e.message : 'No se pudo cargar el almacenamiento',
        ])
      } finally {
        setLoading(false)
      }
    },
    [activeFolder.prefix, query, showMessages],
  )

  useEffect(() => {
    void load()
  }, [folderId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return objects
    return objects.filter((o) => o.key.toLowerCase().includes(q))
  }, [objects, query])

  async function onUpload(file: File | undefined) {
    if (!file) return
    clear()
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', uploadFolder)
      await api('/api/admin/storage/upload', { method: 'POST', body: fd })
      showMessages(['Archivo subido'])
      if (folderId !== uploadFolder && folderId !== 'all') {
        setFolderId(uploadFolder)
      } else {
        await load()
      }
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo subir el archivo',
      ])
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onDelete(obj: StorageObject) {
    clear()
    if (!window.confirm(`¿Eliminar «${fileName(obj.key)}» de R2?`)) return
    setBusy(true)
    try {
      await api('/api/admin/storage', {
        method: 'DELETE',
        body: JSON.stringify({ key: obj.key }),
      })
      setPreview(null)
      showMessages(['Archivo eliminado'])
      await load()
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo eliminar',
      ])
    } finally {
      setBusy(false)
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(
        url.startsWith('http') ? url : `${window.location.origin}${url}`,
      )
      showMessages(['URL copiada'])
    } catch {
      showMessages(['No se pudo copiar la URL'])
    }
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Almacenamiento"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rosver-line bg-white px-3 py-1.5 text-[11px] font-semibold text-rosver-muted">
            <Hardrive size={14} color="currentColor" strokeWidth={2} />
            Cloudflare R2
          </span>
        }
      />

      {!enabled ? (
        <AdminEmptyState
          title="R2 no configurado"
          detail="Faltan variables R2 en el servidor. Revisa el despliegue."
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* Carpetas */}
            <aside className="w-full shrink-0 rounded-2xl border border-rosver-line bg-white p-3 shadow-sm lg:w-52">
              <p className="mb-2 px-2 text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                Carpetas
              </p>
              <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {FOLDERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFolderId(f.id)}
                    className={cn(
                      'shrink-0 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition',
                      folderId === f.id
                        ? 'bg-rosver-red/10 text-rosver-red'
                        : 'text-rosver-ink hover:bg-rosver-soft',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 flex-1 space-y-4">
              {/* Acciones */}
              <div className="flex flex-col gap-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-0 flex-1">
                  <AdminInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar archivo…"
                    className="max-w-md"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex min-w-[8rem] flex-col gap-1.5">
                    <span className="text-xs font-semibold text-rosver-ink">
                      Subir a
                    </span>
                    <AdminSelect
                      value={uploadFolder}
                      onChange={(e) =>
                        setUploadFolder(
                          e.target.value as 'products' | 'categories' | 'brands',
                        )
                      }
                    >
                      <option value="products">Productos</option>
                      <option value="categories">Categorías</option>
                      <option value="brands">Marcas</option>
                    </AdminSelect>
                  </label>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => void onUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                  >
                    Subir imagen
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void load()}
                    className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-ink hover:border-rosver-red/40"
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="rounded-2xl border border-rosver-line bg-white p-3 shadow-sm sm:p-4">
                {loading && objects.length === 0 ? (
                  <AdminEmptyState title="Cargando archivos…" />
                ) : filtered.length === 0 ? (
                  <AdminEmptyState
                    title="Sin archivos en esta carpeta"
                    detail="Sube una imagen o elige otra carpeta."
                  />
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {filtered.map((obj) => (
                      <li key={obj.key}>
                        <button
                          type="button"
                          onClick={() => setPreview(obj)}
                          className="group flex w-full flex-col overflow-hidden rounded-xl border border-rosver-line bg-rosver-soft/40 text-left transition hover:border-rosver-red/35 hover:shadow-sm"
                        >
                          <div className="relative aspect-square bg-white">
                            {isImageKey(obj.key) ? (
                              <img
                                src={obj.url}
                                alt=""
                                width={200}
                                height={200}
                                loading="lazy"
                                decoding="async"
                                className="size-full object-cover"
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-xs font-bold text-rosver-muted">
                                FILE
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5 px-2.5 py-2">
                            <p className="truncate text-xs font-semibold text-rosver-ink">
                              {fileName(obj.key)}
                            </p>
                            <p className="text-[10px] text-rosver-muted">
                              {formatBytes(obj.size)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {nextCursor ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void load(nextCursor, true)}
                      className="rounded-xl border border-rosver-line px-4 py-2 text-sm font-semibold text-rosver-ink hover:border-rosver-red/40"
                    >
                      Cargar más
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}

      <AdminModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview ? fileName(preview.key) : 'Vista previa'}
        size="xl"
        footer={
          preview ? (
            <>
              <button
                type="button"
                onClick={() => void copyUrl(preview.url)}
                className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-ink hover:border-rosver-red/40"
              >
                Copiar URL
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete(preview)}
                className="h-10 rounded-xl border border-rosver-red/40 px-4 text-sm font-semibold text-rosver-red hover:bg-rosver-red hover:text-white disabled:opacity-60"
              >
                Eliminar
              </button>
            </>
          ) : null
        }
      >
        {preview ? (
          <div className="space-y-4">
            <div className="flex max-h-[55vh] items-center justify-center overflow-hidden rounded-xl border border-rosver-line bg-rosver-soft/50 p-2">
              {isImageKey(preview.key) ? (
                <img
                  src={preview.url}
                  alt={fileName(preview.key)}
                  className="max-h-[52vh] w-auto max-w-full object-contain"
                />
              ) : (
                <p className="py-16 text-sm text-rosver-muted">Sin vista previa</p>
              )}
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-rosver-muted">Clave</dt>
                <dd className="break-all font-medium text-rosver-ink">{preview.key}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-rosver-muted">Tamaño</dt>
                <dd className="font-medium text-rosver-ink">
                  {formatBytes(preview.size)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-rosver-muted">Modificado</dt>
                <dd className="font-medium text-rosver-ink">
                  {formatDate(preview.lastModified)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-rosver-muted">URL</dt>
                <dd className="break-all text-xs text-rosver-muted">{preview.url}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
