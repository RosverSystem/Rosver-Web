import { useAuth } from '@/features/auth'
import { cnField, isValidPhone } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Camera } from 'cssvg-icons'
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'

type FieldKey = 'fullName' | 'phone' | 'avatar'
type FieldErrors = Partial<Record<FieldKey, string>>

const inputClass =
  'rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50'
const AVATARS = [
  '/avatars/default-1.svg',
  '/avatars/default-2.svg',
  '/avatars/default-3.svg',
  '/avatars/default-4.svg',
  '/avatars/default-5.svg',
]

export function AccountProfilePage() {
  const { user, updateProfile, uploadAvatar } = useAuth()
  const { toasts, showErrors, dismiss, clear } = useFormToasts()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [documentType, setDocumentType] = useState('RUC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('/avatars/default-1.svg')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName ?? '')
    setPhone(user.phone ?? '')
    setCompanyName(user.companyName ?? '')
    setDocumentType(user.documentType ?? 'RUC')
    setDocumentNumber(user.documentNumber ?? '')
    setAvatarUrl(user.avatarUrl || '/avatars/default-1.svg')
  }, [user])

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setSaved(false)
    clear()
    try {
      const next = await uploadAvatar(file)
      setAvatarUrl(next.avatarUrl)
    } catch (err) {
      showErrors(
        {
          avatar:
            err instanceof ApiError
              ? err.message
              : 'No se pudo subir la foto.',
        },
        ['avatar'],
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (!fullName.trim()) next.fullName = 'El nombre es obligatorio.'
    if (!phone.trim()) next.phone = 'El teléfono es obligatorio.'
    else if (!isValidPhone(phone)) {
      next.phone = 'Ingresa un número válido (mínimo 9 dígitos).'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['fullName', 'phone'])
      setSaved(false)
      return
    }
    clear()
    setBusy(true)
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        companyName: companyName.trim() || null,
        documentType: documentType || null,
        documentNumber: documentNumber.trim() || null,
        avatarUrl,
      })
      setSaved(true)
    } catch (err) {
      showErrors(
        {
          fullName:
            err instanceof ApiError ? err.message : 'No se pudo guardar.',
        },
        ['fullName'],
      )
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <div className="rounded-2xl border border-rosver-line bg-white p-5 shadow-sm sm:p-6">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <div className="mb-5 rounded-2xl border border-rosver-line bg-rosver-soft/50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <img
              src={avatarUrl}
              alt=""
              width={88}
              height={88}
              className="size-[88px] rounded-full border-2 border-white bg-rosver-soft object-cover shadow-sm"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="absolute -right-1 -bottom-1 inline-flex size-9 items-center justify-center rounded-full bg-rosver-red text-white shadow hover:bg-rosver-red-dark disabled:opacity-60"
              aria-label="Subir foto"
            >
              <Camera size={16} color="currentColor" strokeWidth={2} />
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-widest text-rosver-muted uppercase">
              Datos de cuenta
            </p>
            <h2 className="font-display text-xl font-bold text-rosver-ink">
              {user.fullName?.trim() || 'Tu perfil'}
            </h2>
            <p className="truncate text-sm text-rosver-muted">{user.email}</p>
            <p className="mt-1 text-xs text-rosver-muted">
              Cuenta {user.roleName.toLowerCase()} · Teléfono obligatorio para
              contacto comercial
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onPickFile(e)}
      />

      <p className="mb-2 text-xs font-bold tracking-wide text-rosver-muted uppercase">
        Foto de perfil
      </p>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-rosver-red px-4 py-2 text-xs font-bold text-rosver-red uppercase hover:bg-rosver-red hover:text-white disabled:opacity-60"
        >
          {uploading ? 'Subiendo…' : 'Subir foto personalizada'}
        </button>
        <span className="text-xs text-rosver-muted">JPG/PNG/WebP · máx 2.5 MB · R2</span>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {AVATARS.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setAvatarUrl(src)}
            className={
              avatarUrl === src
                ? 'rounded-full ring-2 ring-rosver-red ring-offset-2'
                : 'rounded-full opacity-80 hover:opacity-100'
            }
          >
            <img src={src} alt="" width={44} height={44} className="size-11 rounded-full" />
          </button>
        ))}
      </div>

      <form noValidate onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={fullName}
          placeholder="Nombre completo *"
          aria-invalid={Boolean(errors.fullName)}
          onChange={(e) => {
            setFullName(e.target.value)
            setErrors((p) => {
              const { fullName: _, ...r } = p
              return r
            })
          }}
          className={cnField(inputClass, Boolean(errors.fullName))}
        />
        <input
          type="email"
          value={user.email}
          disabled
          className={`${inputClass} bg-rosver-soft text-rosver-muted`}
        />
        <input
          type="tel"
          value={phone}
          placeholder="Teléfono / WhatsApp *"
          aria-invalid={Boolean(errors.phone)}
          onChange={(e) => {
            setPhone(e.target.value)
            setErrors((p) => {
              const { phone: _, ...r } = p
              return r
            })
          }}
          className={cnField(inputClass, Boolean(errors.phone))}
        />
        <input
          type="text"
          value={companyName}
          placeholder="Empresa (opcional)"
          onChange={(e) => setCompanyName(e.target.value)}
          className={inputClass}
        />
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className={inputClass}
        >
          <option value="RUC">RUC</option>
          <option value="DNI">DNI</option>
          <option value="CE">CE</option>
          <option value="PAS">Pasaporte</option>
        </select>
        <input
          type="text"
          value={documentNumber}
          placeholder="Nº documento (opcional)"
          onChange={(e) => setDocumentNumber(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved ? (
          <p className="text-sm font-medium text-rosver-success sm:col-span-2">
            Perfil actualizado.
          </p>
        ) : null}
      </form>
    </div>
  )
}
