import { useAuth } from '@/features/auth'
import { cnField } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { type FormEvent, useState } from 'react'

export function OtpVerifyPanel({
  email,
  onVerified,
}: {
  email: string
  onVerified: (user?: { roleCode: string }) => void
}) {
  const { verifyEmail, resendOtp } = useAuth()
  const { toasts, showErrors, dismiss, clear } = useFormToasts()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      setError(true)
      showErrors({ code: 'Ingresa el código OTP.' }, ['code'])
      return
    }
    setBusy(true)
    try {
      clear()
      const user = await verifyEmail(email, code.trim())
      onVerified(user)
    } catch (err) {
      showErrors(
        { code: err instanceof Error ? err.message : 'Código inválido' },
        ['code'],
      )
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <p className="text-sm text-rosver-muted">
        Enviamos un código a <strong className="text-rosver-ink">{email}</strong>.
        Revisa tu bandeja (o la consola del API si SMTP aún no está configurado).
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        aria-invalid={error}
        onChange={(e) => {
          setCode(e.target.value)
          setError(false)
        }}
        placeholder="Código de 6 dígitos"
        className={cnField(
          'rounded-lg border border-rosver-line bg-rosver-soft px-3 py-2.5 text-sm tracking-widest outline-none focus:border-rosver-red/50',
          error,
        )}
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
      >
        {busy ? 'Verificando…' : 'Verificar y entrar'}
      </button>
      <button
        type="button"
        className="text-sm font-semibold text-rosver-red"
        onClick={() => void resendOtp(email, 'email_verify')}
      >
        Reenviar código
      </button>
    </form>
  )
}
