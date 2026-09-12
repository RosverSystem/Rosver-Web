import { useAuth } from '@/features/auth'
import { cnField, isValidPhone, normalizeOtpCode } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Camera } from 'cssvg-icons'
import { motion } from 'motion/react'
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
  const { toasts, showErrors, showSuccess, dismiss, clear } = useFormToasts()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('/avatars/default-1.svg')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName ?? '')
    setPhone(user.phone ?? '')
    setAvatarUrl(user.avatarUrl || '/avatars/default-1.svg')
  }, [user])

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    clear()
    try {
      const next = await uploadAvatar(file)
      setAvatarUrl(next.avatarUrl)
      showSuccess(['Foto de perfil actualizada.'])
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
      return
    }
    clear()
    setBusy(true)
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl,
      })
      showSuccess(['Perfil actualizado.'])
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
        <div className="flex flex-col justify-center gap-1 rounded-lg border border-dashed border-rosver-line bg-rosver-soft/40 px-3 py-2.5 text-sm sm:col-span-1">
          <p className="font-semibold text-rosver-ink">RUC / razón social</p>
          <p className="text-xs text-rosver-muted">
            Configúralos en{' '}
            <Link
              to="/cuenta/empresa"
              className="font-bold text-rosver-red underline-offset-2 hover:underline"
            >
              Mi empresa
            </Link>
            .
          </p>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <AuthenticatorSection />
    </div>
  )
}

function AuthenticatorSection() {
  const { user, setup2fa, enable2fa, disable2fa, refresh } = useAuth()
  const { toasts, showErrors, showSuccess, dismiss, clear } = useFormToasts()
  const reduce = prefersReducedMotion()
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle')

  if (!user) return null

  function closeModal() {
    setMode('idle')
    setQr(null)
    setSecret(null)
    setCode('')
  }

  async function startSetup() {
    clear()
    setBusy(true)
    try {
      const data = await setup2fa()
      setQr(data.qrDataUrl)
      setSecret(data.secret)
      setMode('setup')
      setCode('')
    } catch (err) {
      showErrors(
        {
          code:
            err instanceof ApiError
              ? err.message
              : 'No se pudo iniciar el autenticador.',
        },
        ['code'],
      )
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnable(e: FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      showErrors({ code: 'Ingresa el código de la app.' }, ['code'])
      return
    }
    setBusy(true)
    try {
      await enable2fa(normalizeOtpCode(code, 8))
      await refresh()
      closeModal()
      showSuccess(['Autenticador vinculado.'])
    } catch (err) {
      showErrors(
        {
          code:
            err instanceof ApiError ? err.message : 'Código incorrecto.',
        },
        ['code'],
      )
    } finally {
      setBusy(false)
    }
  }

  async function confirmDisable(e: FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      showErrors({ code: 'Ingresa el código del autenticador.' }, ['code'])
      return
    }
    setBusy(true)
    try {
      await disable2fa(normalizeOtpCode(code, 8))
      await refresh()
      closeModal()
      showSuccess(['Autenticador desvinculado.'])
    } catch (err) {
      showErrors(
        {
          code:
            err instanceof ApiError ? err.message : 'No se pudo desvincular.',
        },
        ['code'],
      )
    } finally {
      setBusy(false)
    }
  }

  const modalOpen = mode === 'setup' || mode === 'disable'

  return (
    <section className="mt-8 border-t border-rosver-line pt-6">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <h3 className="font-display text-lg font-bold text-rosver-ink">
        Autenticador (Google / Microsoft)
      </h3>
      <p className="mt-1 text-sm text-rosver-muted">
        Si lo vinculas, el inicio de sesión y la recuperación pedirán el código
        de la app en lugar de (o antes del) OTP por correo.
      </p>

      {user.totpEnabled ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="rounded-full bg-rosver-success/15 px-3 py-1 text-xs font-bold text-rosver-success">
            Vinculado
          </p>
          <button
            type="button"
            onClick={() => {
              setCode('')
              setMode('disable')
            }}
            className="rounded-full border border-rosver-line px-4 py-2 text-xs font-bold text-rosver-ink hover:border-rosver-red hover:text-rosver-red"
          >
            Desvincular
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void startSetup()}
          className="mt-4 rounded-full bg-rosver-red px-4 py-2 text-xs font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
        >
          {busy ? 'Preparando…' : 'Vincular autenticador'}
        </button>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-2fa-title"
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-rosver-ink/45 backdrop-blur-md"
            onClick={closeModal}
          />
          <motion.div
            className="relative z-[1] flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-xl"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-b border-rosver-line px-5 py-4 sm:px-6">
              <h4
                id="auth-2fa-title"
                className="font-display text-lg font-bold text-rosver-ink"
              >
                {mode === 'disable'
                  ? 'Desvincular autenticador'
                  : 'Vincular autenticador'}
              </h4>
              <p className="mt-1 text-sm text-rosver-muted">
                {mode === 'disable'
                  ? 'Confirma con un código de tu app para quitar el autenticador.'
                  : 'Escanea el QR o ingresa la clave manual en Google Authenticator o Microsoft Authenticator.'}
              </p>
            </div>

            <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6">
              {mode === 'setup' && qr ? (
                <form
                  noValidate
                  onSubmit={confirmEnable}
                  className="flex flex-col gap-3"
                >
                  <img
                    src={qr}
                    alt="QR autenticador"
                    width={220}
                    height={220}
                    className="mx-auto rounded-xl border border-rosver-line"
                  />
                  <div
                    className="flex items-center gap-3"
                    role="separator"
                    aria-label="o"
                  >
                    <span className="h-px flex-1 bg-rosver-line" />
                    <span className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
                      o
                    </span>
                    <span className="h-px flex-1 bg-rosver-line" />
                  </div>
                  {secret ? (
                    <p className="break-all rounded-xl bg-rosver-soft px-3 py-2 text-xs text-rosver-muted">
                      Clave manual:{' '}
                      <span className="font-mono font-semibold text-rosver-ink">
                        {secret}
                      </span>
                    </p>
                  ) : null}
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(normalizeOtpCode(e.target.value, 8))}
                    onPaste={(e) => {
                      e.preventDefault()
                      setCode(normalizeOtpCode(e.clipboardData.getData('text'), 8))
                    }}
                    placeholder="Código de 6 dígitos"
                    className={cnField(`${inputClass} text-center tracking-[0.35em]`, false)}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
                    >
                      {busy ? 'Activando…' : 'Activar autenticador'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border border-rosver-line px-4 py-2.5 text-xs font-bold text-rosver-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  noValidate
                  onSubmit={confirmDisable}
                  className="flex flex-col gap-3"
                >
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(normalizeOtpCode(e.target.value, 8))}
                    onPaste={(e) => {
                      e.preventDefault()
                      setCode(normalizeOtpCode(e.clipboardData.getData('text'), 8))
                    }}
                    placeholder="Código autenticador"
                    className={cnField(`${inputClass} text-center tracking-[0.35em]`, false)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-rosver-ink px-4 py-2.5 text-xs font-bold text-white hover:bg-rosver-red disabled:opacity-60"
                    >
                      {busy ? 'Desvinculando…' : 'Desvincular'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border border-rosver-line px-4 py-2.5 text-xs font-bold text-rosver-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </section>
  )
}
