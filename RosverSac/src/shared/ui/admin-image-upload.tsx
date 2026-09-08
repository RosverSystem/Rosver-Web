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
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            width={56}
            height={56}
            className="size-14 rounded-xl border border-rosver-line object-cover"
          />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-xl border border-dashed border-rosver-line bg-rosver-soft text-[10px] font-bold text-rosver-muted">
            Sin foto
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-xs text-rosver-muted file:mr-3 file:rounded-lg file:border-0 file:bg-rosver-ink file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-rosver-red"
            disabled={uploading}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="O pega una URL…"
            className="h-9 w-full rounded-lg border border-rosver-line bg-white px-2.5 text-xs outline-none focus:border-rosver-red/40"
          />
          {uploading ? (
            <p className="text-[11px] font-semibold text-rosver-muted">Subiendo…</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
