import { useAuth } from '@/features/auth'
import { AuthSplitShell } from '@/features/auth/ui/AuthSplitShell'
import { OtpVerifyPanel } from '@/features/auth/ui/OtpVerifyPanel'
import { VerificationRequiredModal } from '@/features/auth/ui/VerificationRequiredModal'
import { isValidEmail, cnField, normalizeOtpCode } from '@/shared/lib'
import { BRAND_KEYS, brandMediaPath } from '@/shared/lib/brand-assets'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { cn } from '@/shared/lib/cn'
import { ApiError } from '@/shared/lib/api'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

type FieldKey = 'email' | 'password' | 'totp' | 'otp'
type FieldErrors = Partial<Record<FieldKey, string>>

type Step =
  | 'form'
  | 'totp'
  | 'email_otp'
  | 'verify_modal'

/**
 * Login: email+password; botón celular (junto a Google) = sin contraseña.
 * Sin Facebook. Cuenta no verificada → modal obligatorio.
 */
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_state: 'La sesión de Google expiró o fue interrumpida. Intenta de nuevo.',
  google_token: 'No se pudo obtener el token de Google. Intenta de nuevo.',
  google_not_configured: 'El inicio de sesión con Google no está configurado aún.',
  google_denied: 'Cancelaste el inicio de sesión con Google.',
  google_profile: 'No se pudo obtener el perfil de Google.',
  google_email: 'Google no devolvió un correo válido.',
  disabled: 'Tu cuenta está deshabilitada. Contacta a soporte.',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const reduce = prefersReducedMotion()
  const { login, loginTotp, googleStartUrl } = useAuth()
  const { toasts, showErrors, showWarning, showSuccess, dismiss, clear } = useFormToasts()

  // Leer ?error= del callback de Google y mostrar toast
  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (!errorCode) return
    // Limpia el param de la URL sin navegar
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('error')
      return next
    }, { replace: true })
    const msg = GOOGLE_ERROR_MESSAGES[errorCode] ??
      `Error al continuar con Google (${errorCode}). Intenta de nuevo.`
    // google_not_configured y disabled → warning; el resto → error
    const isWarning = errorCode === 'google_not_configured' || errorCode === 'disabled'
    if (isWarning) {
      showWarning([msg])
    } else {
      showErrors({ google: msg }, ['google'])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [otpMeta, setOtpMeta] = useState<{
    mailDelivered?: boolean
    retryAfterSec?: number
  }>({})
  const [totpChallenge, setTotpChallenge] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function goAfterLogin(admin: boolean) {
    showSuccess(['Sesión iniciada.'])
    navigate(admin ? '/admin' : '/cuenta', { replace: true })
  }

  async function applyLoginResult(result: Awaited<ReturnType<typeof login>>) {
    if (result.ok) {
      goAfterLogin(result.user.roleCode === 'admin')
      return
    }
    if (result.requiresEmailVerification && result.email) {
      setPendingEmail(result.email)
      setOtpMeta({
        mailDelivered: result.mailDelivered,
        retryAfterSec: result.retryAfterSec,
      })
      setStep('verify_modal')
      return
    }
    if (result.requiresTotp && result.challengeToken) {
      setTotpChallenge(result.challengeToken)
      setPendingEmail(result.email ?? email.trim())
      setStep('totp')
      return
    }
    if (result.requiresEmailOtp && result.email) {
      setPendingEmail(result.email)
      setOtpMeta({
        mailDelivered: result.mailDelivered,
        retryAfterSec: result.retryAfterSec,
      })
      setStep('email_otp')
      return
    }
    showErrors({ email: result.message || 'No se pudo iniciar sesión.' }, ['email'])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (!email.trim()) next.email = 'Ingresa tu correo.'
    else if (!isValidEmail(email)) next.email = 'El correo no es válido.'
    if (!password) next.password = 'Ingresa tu contraseña.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['email', 'password'])
      if (next.email) emailRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }
    clear()
    setBusy(true)
    try {
      const result = await login(email.trim(), password)
      await applyLoginResult(result)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al iniciar sesión.'
      showErrors({ password: msg }, ['password'])
    } finally {
      setBusy(false)
    }
  }

  async function handlePasswordless() {
    if (!email.trim() || !isValidEmail(email)) {
      setErrors({ email: 'Ingresa tu correo para entrar con código.' })
      showErrors({ email: 'Ingresa tu correo para entrar con código.' }, ['email'])
      emailRef.current?.focus()
      return
    }
    clear()
    setBusy(true)
    try {
      const result = await login(email.trim(), undefined, { passwordless: true })
      await applyLoginResult(result)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al iniciar sesión.'
      showErrors({ email: msg }, ['email'])
    } finally {
      setBusy(false)
    }
  }

  async function handleTotp(event: FormEvent) {
    event.preventDefault()
    if (!totpChallenge || !totpCode.trim()) {
      showErrors({ totp: 'Ingresa el código del autenticador.' }, ['totp'])
      return
    }
    setBusy(true)
    try {
      const user = await loginTotp(totpChallenge, normalizeOtpCode(totpCode, 8))
      goAfterLogin(user.roleCode === 'admin')
    } catch (err) {
      showErrors(
        { totp: err instanceof Error ? err.message : 'Código inválido' },
        ['totp'],
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthSplitShell
      heroSrc={brandMediaPath(BRAND_KEYS.loginHero)}
      heroCaption="Herramientas y soluciones para profesionales."
      floating={
        <>
          <FloatingToasts
            toasts={toasts}
            onDismiss={dismiss}
            reduceMotion={reduce}
          />
          {step === 'verify_modal' && pendingEmail ? (
            <VerificationRequiredModal
              email={pendingEmail}
              initialRetryAfterSec={otpMeta.retryAfterSec ?? 30}
              initialMailDelivered={otpMeta.mailDelivered}
              onVerified={(u) => goAfterLogin(u?.roleCode === 'admin')}
              onClose={() => {
                setStep('form')
                setPendingEmail(null)
              }}
            />
          ) : null}
        </>
      }
    >
      <p className="mb-3 text-[11px] font-bold tracking-[0.2em] text-rosver-muted uppercase lg:hidden">
        ROS<span className="text-rosver-red">VER</span>
      </p>

      <h1 className="font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl xl:text-5xl [@media(max-height:700px)]:text-3xl">
        Ingresar
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-rosver-muted sm:mt-3 sm:text-base">
        Entra a tu cuenta para ver pedidos, cotizaciones y perfil.
      </p>

      {step === 'totp' && totpChallenge ? (
        <form
          noValidate
          onSubmit={handleTotp}
          className="mt-7 flex flex-col gap-3 sm:mt-9"
        >
          <p className="text-sm text-rosver-muted">
            Abre Google Authenticator o Microsoft Authenticator e ingresa el
            código de 6 dígitos.
          </p>
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
            className={cnField(`${pillInputClass} text-center tracking-[0.35em]`, Boolean(errors.totp))}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Validando…' : 'Confirmar autenticador'}
          </button>
          <button
            type="button"
            className="text-center text-sm font-semibold text-rosver-muted"
            onClick={() => {
              setStep('form')
              setTotpChallenge(null)
              setTotpCode('')
            }}
          >
            Volver
          </button>
        </form>
      ) : step === 'email_otp' && pendingEmail ? (
        <div className="mt-7 sm:mt-9">
          <OtpVerifyPanel
            email={pendingEmail}
            purpose="login"
            initialRetryAfterSec={otpMeta.retryAfterSec ?? 30}
            initialMailDelivered={otpMeta.mailDelivered}
            onVerified={(u) => goAfterLogin(u?.roleCode === 'admin')}
          />
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-rosver-muted"
            onClick={() => {
              setStep('form')
              setPendingEmail(null)
            }}
          >
            Volver
          </button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-7 flex flex-col gap-3 sm:mt-9 sm:gap-3.5"
        >
          <label className="sr-only" htmlFor="login-email">
            Correo
          </label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Correo"
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => {
                const { email: _, ...rest } = prev
                return rest
              })
            }}
            className={cnField(pillInputClass, Boolean(errors.email))}
          />

          <div className="relative">
            <label className="sr-only" htmlFor="login-password">
              Contraseña
            </label>
            <input
              ref={passwordRef}
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              aria-invalid={Boolean(errors.password)}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => {
                  const { password: _, ...rest } = prev
                  return rest
                })
              }}
              className={cn(
                cnField(pillInputClass, Boolean(errors.password)),
                'pr-16',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-5 -translate-y-1/2 text-xs font-bold text-rosver-muted hover:text-rosver-ink"
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>

          <div className="flex items-center justify-end px-1 text-sm">
            <Link
              to="/recuperar"
              className="font-semibold text-rosver-blue hover:text-rosver-red"
            >
              ¿Olvidaste tu clave?
            </Link>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Entrando…' : 'Empezar'}
          </button>
        </form>
      )}

      {step === 'form' ? (
        <>
          <div
            className="mt-6 flex items-center gap-3 sm:mt-7"
            aria-hidden={false}
          >
            <span className="h-px flex-1 bg-rosver-line" />
            <span className="text-xs font-bold tracking-wide text-rosver-muted uppercase">
              o
            </span>
            <span className="h-px flex-1 bg-rosver-line" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handlePasswordless()}
              aria-label="Entrar con código OTP (sin contraseña)"
              title="Entrar con código al correo"
              className="inline-flex size-11 items-center justify-center rounded-full border border-rosver-line bg-white text-rosver-red transition hover:border-rosver-red/40 hover:bg-rosver-soft disabled:opacity-60"
            >
              <KeyMark />
            </button>
            <a
              href={googleStartUrl}
              aria-label="Continuar con Google"
              title="Continuar con Google"
              className="inline-flex size-11 items-center justify-center rounded-full border border-rosver-line bg-white transition hover:border-rosver-red/30 hover:bg-rosver-soft"
            >
              <GoogleMark />
            </a>
          </div>
          <p className="mt-6 text-center text-sm text-rosver-muted sm:mt-8">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-bold text-rosver-red hover:text-rosver-red-dark"
            >
              Regístrate
            </Link>
          </p>
        </>
      ) : null}
    </AuthSplitShell>
  )
}

const pillInputClass =
  'min-h-12 w-full rounded-full border bg-rosver-soft px-5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:bg-white border-transparent focus:ring-2 focus:ring-rosver-red/20'

function KeyMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="15" r="4" />
      <path d="M12 15h9v-2.5a1.5 1.5 0 0 0-1.5-1.5H16" />
      <path d="M17.5 11V9" />
      <path d="M19.5 11V9" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l.1.1 6.2 5.2C39.2 37.3 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  )
}
