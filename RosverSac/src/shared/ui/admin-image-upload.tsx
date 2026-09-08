import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useRef, useState } from 'react'

type Folder = 'categories' | 'brands' | 'products'

type Props = {
  folder: Folder
  value: string
  onChange: (url: string) => void
  onError: (message: string) => void
  label?: string
  className?: string
}

/**
 * Subida a R2 (acción principal) + URL opcional si ya la tienes.
 */
export function AdminImageUpload({
  folder,
  value,
  onChange,
  onError,
  label = 'Imagen',
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showUrl, setShowUrl] = useState(Boolean(value))

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await api<{ url: string }>('/api/admin/uploads', {
        method: 'POST',
        body: fd,
      })
      onChange(res.url)
      setShowUrl(true)
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-semibold text-rosver-ink">{label}</p>
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
          <span className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-dashed border-rosver-line bg-rosver-soft text-[10px] font-bold text-rosver-muted">
            Sin foto
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            {value ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  onChange('')
                  setShowUrl(false)
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-red"
              >
                Quitar
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-rosver-muted">
            JPG, PNG o WebP · máx. 2.5 MB
          </p>
          {!showUrl ? (
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="self-start text-xs font-semibold text-rosver-muted underline-offset-2 hover:text-rosver-red hover:underline"
            >
              ¿Ya tienes una URL? Pégala aquí
            </button>
          ) : (
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://… (opcional)"
              className="h-10 w-full rounded-xl border border-rosver-line bg-white px-3 text-sm outline-none focus:border-rosver-red/40"
            />
          )}
        </div>
      </div>
    </div>
  )
}
