import { cn } from '@/shared/lib'
import { AdminMediaPicker } from '@/shared/ui/admin-media-picker'
import { useState } from 'react'

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
 * Campo imagen ERP: abre selector R2 (Drive) o deja quitar la foto.
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark"
            >
              {value ? 'Cambiar imagen' : 'Elegir imagen'}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted hover:border-rosver-red/40 hover:text-rosver-red"
              >
                Quitar
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-rosver-muted">
            Elige una de R2 o sube una nueva con nombre
          </p>
        </div>
      </div>

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
