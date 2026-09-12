import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { AdminField, AdminInput, AdminSelect } from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { useEffect, useMemo, useRef, useState } from 'react'

type Folder = 'categories' | 'brands' | 'products' | 'all'

type StorageObject = {
  key: string
  size: number
  lastModified: string | null
  url: string
}

type Props = {
  open: boolean
  onClose: () => void
  /** Carpeta preferida al subir / filtrar. */
  folder?: Exclude<Folder, 'all'>
  onSelect: (picked: { url: string; key: string }) => void
  onError?: (message: string) => void
}

function fileName(key: string) {
  const parts = key.split('/')
  return parts[parts.length - 1] || key
}

function isImageKey(key: string) {
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(key)
}

/**
 * Selector de medios R2 (estilo Drive): buscar, elegir existente o subir con nombre.
 */
export function AdminMediaPicker({
  open,
  onClose,
  folder = 'products',
  onSelect,
  onError,
}: Props) {
  const { showSuccess, showErrors } = useFormToasts()
  const inputRef = useRef<HTMLInputElement>(null)
  const [scope, setScope] = useState<Folder>(folder)
  const [query, setQuery] = useState('')
  const [objects, setObjects] = useState<StorageObject[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadFolder, setUploadFolder] = useState<Exclude<Folder, 'all'>>(folder)

  useEffect(() => {
    if (!open) return
    setScope(folder)
    setUploadFolder(folder)
    setQuery('')
    setPendingFile(null)
    setUploadName('')
  }, [open, folder])

  useEffect(() => {
    if (!open) return
    void loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope])

  async function loadList() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (scope !== 'all') params.set('prefix', `${scope}/`)
      const data = await api<{ objects: StorageObject[] }>(
        `/api/admin/storage?${params.toString()}`,
      )
      setObjects(data.objects.filter((o) => isImageKey(o.key)))
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'No se pudieron cargar las imágenes'
      onError?.(msg)
      showErrors({ media: msg }, ['media'])
      setObjects([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return objects
    return objects.filter(
      (o) =>
        o.key.toLowerCase().includes(q) ||
        fileName(o.key).toLowerCase().includes(q),
    )
  }, [objects, query])

  function onPickFile(file: File | undefined) {
    if (!file) return
    setPendingFile(file)
    const base = file.name.replace(/\.[^.]+$/, '')
    setUploadName(base)
  }

  async function confirmUpload() {
    if (!pendingFile) return
    const name = uploadName.trim()
    if (!name) {
      onError?.('Ponle un nombre a la imagen')
      showErrors({ media: 'Ponle un nombre a la imagen' }, ['media'])
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('folder', uploadFolder)
      fd.append('name', name)
      const res = await api<{ url: string; key: string }>(
        '/api/admin/storage/upload',
        { method: 'POST', body: fd },
      )
      onSelect({ url: res.url, key: res.key })
      showSuccess(['Imagen subida.'])
      onClose()
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'No se pudo subir la imagen'
      onError?.(msg)
      showErrors({ media: msg }, ['media'])
    } finally {
      setBusy(false)
      setPendingFile(null)
      setUploadName('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Elegir imagen"
      size="xl"
      layer={90}
      footer={
        pendingFile ? (
          <>
            <button
              type="button"
              onClick={() => {
                setPendingFile(null)
                setUploadName('')
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar subida
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmUpload()}
              className="h-10 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Subiendo…' : 'Subir y usar'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-ink"
          >
            Cerrar
          </button>
        )
      }
    >
      <div className="space-y-4">
        {pendingFile ? (
          <div className="space-y-3 rounded-xl border border-rosver-line bg-rosver-soft/40 p-4">
            <p className="text-sm font-semibold text-rosver-ink">
              Nueva imagen — dale un nombre
            </p>
            <p className="text-xs text-rosver-muted">
              Archivo: {pendingFile.name} · {(pendingFile.size / 1024).toFixed(0)} KB
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Nombre" htmlFor="media-name">
                <AdminInput
                  id="media-name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Ej. logo-bosch"
                  autoFocus
                />
              </AdminField>
              <AdminField label="Carpeta" htmlFor="media-folder">
                <AdminSelect
                  id="media-folder"
                  value={uploadFolder}
                  onChange={(e) =>
                    setUploadFolder(e.target.value as Exclude<Folder, 'all'>)
                  }
                >
                  <option value="brands">Marcas</option>
                  <option value="products">Productos</option>
                  <option value="categories">Categorías</option>
                </AdminSelect>
              </AdminField>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <AdminField label="Buscar en R2" htmlFor="media-search">
                  <AdminInput
                    id="media-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre o carpeta…"
                  />
                </AdminField>
              </div>
              <AdminField label="Carpeta" htmlFor="media-scope" className="sm:w-40">
                <AdminSelect
                  id="media-scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as Folder)}
                >
                  <option value="all">Todas</option>
                  <option value="brands">Marcas</option>
                  <option value="products">Productos</option>
                  <option value="categories">Categorías</option>
                </AdminSelect>
              </AdminField>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="h-11 shrink-0 rounded-xl bg-rosver-ink px-4 text-sm font-semibold text-white hover:bg-rosver-red"
              >
                Subir nueva
              </button>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-rosver-muted">
                Cargando imágenes…
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-rosver-muted">
                No hay imágenes. Sube una nueva o cambia el filtro.
              </p>
            ) : (
              <ul className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((obj) => (
                  <li key={obj.key}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({ url: obj.url, key: obj.key })
                        onClose()
                      }}
                      className={cn(
                        'group flex w-full flex-col overflow-hidden rounded-xl border border-rosver-line bg-white text-left transition',
                        'hover:border-rosver-red/40 hover:shadow-sm',
                      )}
                    >
                      <div className="aspect-square bg-rosver-soft/50">
                        <img
                          src={obj.url}
                          alt=""
                          width={160}
                          height={160}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      </div>
                      <p className="truncate px-2 py-1.5 text-[11px] font-semibold text-rosver-ink">
                        {fileName(obj.key)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AdminModal>
  )
}
