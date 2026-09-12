import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { AdminMediaPicker } from '@/shared/ui/admin-media-picker'
import { useRef, useState, type DragEvent } from 'react'

type Folder = 'categories' | 'brands' | 'products'

type Props = {
  folder: Folder
  value: string
  onChange: (url: string) => void
  onError: (message: string) => void
  label?: string
  className?: string
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)
}

/**
 * Campo imagen ERP: arrastrar archivo, abrir selector R2 o quitar foto.
 */
export function AdminImageUpload({
  folder,
  value,
  onChange,
  onError,
  label = 'Imagen',
  className,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const dragDepth = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!isImageFile(file)) {
      onError('Solo imágenes (JPG, PNG, WebP…)')
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      fd.append('name', file.name.replace(/\.[^.]+$/, '') || 'imagen')
      const res = await api<{ url: string }>('/api/admin/storage/upload', {
        method: 'POST',
        body: fd,
      })
      onChange(res.url)
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'No se pudo subir la imagen')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current += 1
    setDragging(true)
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void uploadFile(file)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-semibold text-rosver-ink">{label}</p>

      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          'rounded-2xl border-2 border-dashed p-3 transition sm:p-4',
          dragging
            ? 'border-rosver-red bg-rosver-red/5'
            : 'border-rosver-line bg-rosver-soft/40',
          busy && 'pointer-events-none opacity-70',
        )}
      >
        <div className="flex flex-wrap items-start gap-3">
          {value ? (
            <img
              src={value}
              alt=""
              width={72}
              height={72}
              className="size-[4.5rem] shrink-0 rounded-xl border border-rosver-line object-cover"
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="flex size-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-rosver-line bg-white text-[10px] font-bold text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-red"
            >
              {busy ? '…' : 'Sin foto'}
            </button>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-sm font-semibold text-rosver-ink">
              {dragging
                ? 'Suelta la imagen aquí'
                : busy
                  ? 'Subiendo…'
                  : 'Arrastra una imagen aquí'}
            </p>
            <p className="text-[11px] text-rosver-muted">
              O elige desde R2 / tu equipo
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPickerOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                {value ? 'Cambiar (R2)' : 'Elegir en R2'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rosver-line bg-white px-4 text-sm font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red disabled:opacity-60"
              >
                Subir archivo
              </button>
              {value ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onChange('')}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-red disabled:opacity-60"
                >
                  Quitar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void uploadFile(file)
        }}
      />

      <AdminMediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        folder={folder}
        onSelect={(picked) => onChange(picked.url)}
        onError={onError}
      />
    </div>
  )
}
