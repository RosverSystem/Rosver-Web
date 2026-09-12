import { useAuth } from '@/features/auth'
import { cnField, normalizeOtpCode } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { type FormEvent, useEffect, useState } from 'react'

type OtpPurpose = 'email_verify' | 'login' | 'reset_password'

/**
 * Panel OTP: errores/éxito solo con toasts flotantes.
 * Reenvío: cooldown 30s y tope de envíos (API).
 * Pega con espacios → se limpia a solo dígitos.
 */
export function OtpVerifyPanel({
  email,
  purpose = 'email_verify',
  submitLabel,
  initialRetryAfterSec = 30,
  initialMailDelivered,
  onVerified,
  onCodeSubmit,
}: {
  email: string
  purpose?: OtpPurpose
  submitLabel?: string
  initialRetryAfterSec?: number
  initialMailDelivered?: boolean
  onVerified?: (user?: { roleCode: string }) => void
  onCodeSubmit?: (code: string) => Promise<void>
}) {
  const { verifyEmail, loginEmailOtp, resendOtp } = useAuth()
  const { toasts, showErrors, showSuccess, showWarning, dismiss, clear } =
    useFormToasts()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [cooldown, setCooldown] = useState(Math.max(0, initialRetryAfterSec))
  const [resendBusy, setResendBusy] = useState(false)

  useEffect(() => {
    if (initialMailDelivered === false) {
      showWarning([
        'No pudimos enviar el correo ahora. Revisa spam o reenvía en unos segundos.',
      ])
    } else if (initialMailDelivered === true) {
      showSuccess(['Código enviado a tu correo.'])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [cooldown])

  function setNormalizedCode(raw: string) {
    setCode(normalizeOtpCode(raw, 6))
    setError(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = normalizeOtpCode(code, 6)
    if (!clean) {
      setError(true)
      showErrors({ code: 'Ingresa el código OTP.' }, ['code'])
      return
    }
    setBusy(true)
    try {
      clear()
      if (onCodeSubmit) {
        await onCodeSubmit(clean)
        showSuccess(['Código verificado.'])
      } else if (purpose === 'login') {
        const user = await loginEmailOtp(email, clean)
        showSuccess(['Sesión iniciada.'])
        onVerified?.(user)
      } else {
        const user = await verifyEmail(email, clean)
        showSuccess(['Correo verificado.'])
        onVerified?.(user)
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Intento fallido.'
      showErrors({ code: msg }, ['code'])
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  async function onResend() {
    if (cooldown > 0 || resendBusy) return
    setResendBusy(true)
    try {
      clear()
      const res = await resendOtp(email, purpose)
      setCooldown(res.retryAfterSec ?? 30)
      if (res.mailDelivered) {
        showSuccess(['Código reenviado a tu correo.'])
      } else {
        showWarning([
          res.message ||
            'No pudimos enviar el correo ahora. Revisa spam o intenta más tarde.',
        ])
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo reenviar.'
      showErrors({ code: msg }, ['code'])
      if (err instanceof ApiError && typeof err.payload === 'object' && err.payload) {
        const p = err.payload as { retryAfterSec?: number }
        if (p.retryAfterSec) setCooldown(p.retryAfterSec)
      }
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col items-center gap-3">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <p className="w-full text-center text-sm text-rosver-muted">
        Enviamos un código a{' '}
        <strong className="text-rosver-ink">{email}</strong>.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        aria-invalid={error}
        onChange={(e) => setNormalizedCode(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          setNormalizedCode(e.clipboardData.getData('text'))
        }}
        placeholder="Código de 6 dígitos"
        className={cnField(
          'w-full rounded-xl border border-rosver-line bg-rosver-soft px-3 py-3 text-center text-lg font-semibold tracking-[0.35em] outline-none focus:border-rosver-red/50',
          error,
        )}
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-full bg-rosver-red px-5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
      >
        {busy
          ? 'Validando…'
          : submitLabel ||
            (purpose === 'login' ? 'Entrar con código' : 'Verificar y entrar')}
      </button>
      <button
        type="button"
        disabled={cooldown > 0 || resendBusy}
        className="text-center text-sm font-semibold text-rosver-red disabled:text-rosver-muted disabled:opacity-70"
        onClick={() => void onResend()}
      >
        {resendBusy
          ? 'Enviando…'
          : cooldown > 0
            ? `Reenviar código (${cooldown}s)`
            : 'Reenviar código'}
      </button>
    </form>
  )
}
