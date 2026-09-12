import { useAuth } from '@/features/auth'
import { isValidEmail, cnField, normalizeOtpCode } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib/cn'
import {
  PASSWORD_RULES,
  PASSWORD_STRENGTH_UI,
  getPasswordStrength,
  passwordMeetsRules,
} from '@/shared/lib/password-rules'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Check } from 'cssvg-icons'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Step = 'email' | 'totp' | 'reset'
type FieldKey = 'email' | 'code' | 'totp' | 'password' | 'passwordConfirm'
type FieldErrors = Partial<Record<FieldKey, string>>

const pillInputClass =
  'min-h-12 w-full rounded-full border bg-rosver-soft px-5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:bg-white border-transparent focus:ring-2 focus:ring-rosver-red/20'

/**
 * Recuperación: si hay autenticador → TOTP primero → OTP correo → nueva clave.
 * Sin autenticador → OTP correo directo. Errores vía toasts; reenvío 30s / máx 3.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const {
    resendOtp,
    resetPassword,
    resetPasswordStart,
    resetPasswordTotp,
  } = useAuth()
  const { toasts, showErrors, showSuccess, showWarning, dismiss, clear } =
    useFormToasts()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resendBusy, setResendBusy] = useState(false)

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !isValidEmail(email)) {
      showErrors({ email: 'Ingresa un correo válido.' }, ['email'])
      return
    }
    clear()
    setBusy(true)
    try {
      const res = await resetPasswordStart(email.trim())
      setEmail(res.email || email.trim())
      if (res.requiresTotp && res.challengeToken) {
        setChallengeToken(res.challengeToken)
        setStep('totp')
      } else {
        setCooldown(res.retryAfterSec ?? 30)
        if (res.mailDelivered === false) {
          showWarning([
            res.message ||
              'No pudimos enviar el correo ahora. Revisa spam o reenvía en unos segundos.',
          ])
        } else if (res.mailDelivered === true) {
          showSuccess(['Código enviado a tu correo.'])
        }
        setStep('reset')
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo iniciar la recuperación.'
      showErrors({ email: msg }, ['email'])
    } finally {
      setBusy(false)
    }
  }

  async function handleTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!challengeToken || !totpCode.trim()) {
      showErrors({ totp: 'Ingresa el código del autenticador.' }, ['totp'])
      return
    }
    clear()
    setBusy(true)
    try {
      const res = await resetPasswordTotp(
        challengeToken,
        normalizeOtpCode(totpCode, 8),
      )
      setEmail(res.email)
      setCooldown(res.retryAfterSec ?? 30)
      if (res.mailDelivered === false) {
        showWarning([
          res.message ||
            'No pudimos enviar el correo ahora. Revisa spam o reenvía en unos segundos.',
        ])
      } else {
        showSuccess([res.message || 'Código enviado a tu correo.'])
      }
      setStep('reset')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Código del autenticador incorrecto.'
      showErrors({ totp: msg }, ['totp'])
    } finally {
      setBusy(false)
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (!code.trim()) next.code = 'Ingresa el código que te enviamos.'
    if (!password) next.password = 'Crea una contraseña nueva.'
    else if (!passwordMeetsRules(password)) {
      next.password = 'La contraseña no cumple los requisitos de seguridad.'
    }
    if (password !== passwordConfirm) {
      next.passwordConfirm = 'Las contraseñas no coinciden.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['code', 'password', 'passwordConfirm'])
      return
    }
    clear()
    setBusy(true)
    try {
      await resetPassword(email.trim(), normalizeOtpCode(code, 6), password)
      showSuccess(['Contraseña actualizada. Sesión iniciada.'])
      navigate('/cuenta', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No se pudo restablecer la contraseña.'
      showErrors({ code: msg }, ['code'])
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resendBusy) return
    setResendBusy(true)
    try {
      clear()
      const res = await resendOtp(email, 'reset_password')
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
    <main className="hide-scrollbar flex h-full min-h-0 items-center justify-center overflow-y-auto overscroll-y-contain px-5 py-10 sm:px-6 sm:py-12">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl [@media(max-height:700px)]:text-3xl">
          Recuperar contraseña
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-rosver-muted">
          {step === 'email'
            ? 'Ingresa tu correo. Si tienes autenticador, te lo pediremos primero; luego un OTP al correo.'
            : step === 'totp'
              ? 'Confirma con Google Authenticator o Microsoft Authenticator.'
              : `Te enviamos un código a ${email}.`}
        </p>

        {step === 'email' ? (
          <form
            noValidate
            onSubmit={handleRequestCode}
            className="mt-8 flex flex-col gap-3.5"
          >
            <label className="sr-only" htmlFor="reset-email">
              Correo
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="Correo"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              className={cnField(pillInputClass, Boolean(errors.email))}
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Continuando…' : 'Continuar'}
            </button>
          </form>
        ) : step === 'totp' ? (
          <form
            noValidate
            onSubmit={handleTotp}
            className="mt-8 flex flex-col gap-3.5"
          >
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(normalizeOtpCode(e.target.value, 8))}
              onPaste={(e) => {
                e.preventDefault()
                setTotpCode(normalizeOtpCode(e.clipboardData.getData('text'), 8))
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Código autenticador"
              className={cnField(
                `${pillInputClass} text-center tracking-[0.35em]`,
                Boolean(errors.totp),
              )}
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Validando…' : 'Confirmar autenticador'}
            </button>
          </form>
        ) : (
          <form
            noValidate
            onSubmit={handleReset}
            className="mt-8 flex flex-col gap-3.5"
          >
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Código de 6 dígitos"
              value={code}
              aria-invalid={Boolean(errors.code)}
              onChange={(e) => {
                setCode(normalizeOtpCode(e.target.value, 6))
                setErrors((prev) => ({ ...prev, code: undefined }))
              }}
              onPaste={(e) => {
                e.preventDefault()
                setCode(normalizeOtpCode(e.clipboardData.getData('text'), 6))
                setErrors((prev) => ({ ...prev, code: undefined }))
              }}
              className={cnField(
                `${pillInputClass} text-center tracking-[0.35em]`,
                Boolean(errors.code),
              )}
            />
            <div>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nueva contraseña"
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                className={cnField(pillInputClass, Boolean(errors.password))}
              />
              {password ? (
                <>
                  <ul className="mt-2 space-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password)
                      return (
                        <li
                          key={rule.id}
                          className={cn(
                            'flex items-center gap-1.5 text-xs',
                            ok ? 'text-rosver-success' : 'text-rosver-muted',
                          )}
                        >
                          <Check size={14} color="currentColor" strokeWidth={2} />
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                  <p
                    className={cn(
                      'mt-2 text-xs font-bold',
                      PASSWORD_STRENGTH_UI[passwordStrength ?? 'baja'].text,
                    )}
                  >
                    Seguridad:{' '}
                    {PASSWORD_STRENGTH_UI[passwordStrength ?? 'baja'].label}
                  </p>
                </>
              ) : null}
            </div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirmar contraseña"
              value={passwordConfirm}
              aria-invalid={Boolean(errors.passwordConfirm)}
              onChange={(e) => {
                setPasswordConfirm(e.target.value)
                setErrors((prev) => ({ ...prev, passwordConfirm: undefined }))
              }}
              className={cnField(pillInputClass, Boolean(errors.passwordConfirm))}
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : 'Restablecer contraseña'}
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || resendBusy}
              onClick={() => void handleResend()}
              className="text-center text-sm font-semibold text-rosver-red disabled:text-rosver-muted disabled:opacity-70"
            >
              {resendBusy
                ? 'Enviando…'
                : cooldown > 0
                  ? `Reenviar código (${cooldown}s)`
                  : 'Reenviar código'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-rosver-muted">
          <Link
            to="/login"
            className="font-bold text-rosver-red hover:text-rosver-red-dark"
          >
            Volver a ingresar
          </Link>
        </p>
      </div>
    </main>
  )
}
