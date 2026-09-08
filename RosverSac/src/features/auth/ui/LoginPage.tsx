import { useAuth } from '@/features/auth'
import { OtpVerifyPanel } from '@/features/auth/ui/OtpVerifyPanel'
import { isValidEmail } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { cn } from '@/shared/lib/cn'
import { cnField } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconFacebook } from '@/shared/ui/icons'
import { motion } from 'motion/react'
import { type FormEvent, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type FieldKey = 'email' | 'password' | 'totp'
type FieldErrors = Partial<Record<FieldKey, string>>

/**
 * Login full-bleed: validación con toasts flotantes (sin bubbles nativos).
 */
export function LoginPage() {
  const navigate = useNavigate()
  const reduce = prefersReducedMotion()
  const { login, loginTotp, googleStartUrl } = useAuth()
  const { toasts, showErrors, dismiss, clear } = useFormToasts()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [pendingEmailVerify, setPendingEmailVerify] = useState<string | null>(null)
  const [totpChallenge, setTotpChallenge] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function goAfterLogin(admin: boolean) {
    navigate(admin ? '/admin' : '/cuenta', { replace: true })
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!email.trim()) next.email = 'Ingresa tu correo.'
    else if (!isValidEmail(email)) next.email = 'El correo no es válido.'
    if (!password) next.password = 'Ingresa tu contraseña.'
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validate()
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
      if (result.ok) {
        goAfterLogin(result.user.roleCode === 'admin')
        return
      }
      if (result.requiresEmailVerification && result.email) {
        setPendingEmailVerify(result.email)
        return
      }
      if (result.requiresTotp && result.challengeToken) {
        setTotpChallenge(result.challengeToken)
        return
      }
      showErrors({ email: result.message || 'No se pudo iniciar sesión.' }, ['email'])
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al iniciar sesión.'
      showErrors({ password: msg }, ['password'])
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
      const user = await loginTotp(totpChallenge, totpCode.trim())
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
    <main className="grid min-h-dvh w-full grid-cols-1 lg:grid-cols-2">
      <FloatingToasts
        toasts={toasts}
        onDismiss={dismiss}
        reduceMotion={reduce}
      />

      <aside className="relative hidden overflow-hidden bg-rosver-soft lg:block">
        <div
          className="absolute inset-y-0 left-0 z-10 w-2 bg-rosver-red sm:w-2.5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-rosver-red/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-10 left-16 size-56 rounded-full bg-rosver-blue/15 blur-3xl"
          aria-hidden
        />

        <div className="relative z-[1] flex h-full min-h-dvh flex-col justify-end px-8 pb-10 pt-20 xl:px-12">
          <motion.img
            src="/login-hero-rosver.webp"
            alt=""
            width={720}
            height={960}
            decoding="async"
            fetchPriority="high"
            className="mx-auto h-auto w-full max-w-md object-contain drop-shadow-[0_28px_48px_rgba(13,13,13,0.18)] xl:max-w-lg"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
          <p className="mx-auto mt-6 max-w-sm text-center text-sm font-medium text-rosver-muted">
            Herramientas y soluciones para profesionales.
          </p>
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col justify-center bg-white px-6 py-16 sm:px-12 lg:px-16 xl:px-24">
        <motion.div
          className="mx-auto w-full max-w-md"
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <p className="mb-3 text-[11px] font-bold tracking-[0.2em] text-rosver-muted uppercase lg:hidden">
            ROS<span className="text-rosver-red">VER</span>
          </p>

          <h1 className="font-display text-4xl font-bold tracking-tight text-rosver-ink sm:text-5xl">
            Ingresar
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-rosver-muted sm:text-base">
            Entra a tu cuenta para ver pedidos, cotizaciones y perfil.
          </p>

          {pendingEmailVerify ? (
            <div className="mt-9">
              <OtpVerifyPanel
                email={pendingEmailVerify}
                onVerified={(u) => goAfterLogin(u?.roleCode === 'admin')}
              />
            </div>
          ) : totpChallenge ? (
            <form noValidate onSubmit={handleTotp} className="mt-9 flex flex-col gap-3">
              <p className="text-sm text-rosver-muted">
                Abre tu app autenticadora e ingresa el código de 6 dígitos.
              </p>
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                inputMode="numeric"
                placeholder="Código 2FA"
                className={cnField(pillInputClass, Boolean(errors.totp))}
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
              >
                {busy ? 'Validando…' : 'Confirmar 2FA'}
              </button>
            </form>
          ) : (
          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-9 flex flex-col gap-3.5"
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

            <div className="flex items-center justify-between px-1 text-sm">
              <label className="inline-flex items-center gap-2 text-rosver-muted">
                <input
                  type="checkbox"
                  name="remember"
                  className="size-4 rounded border-rosver-line accent-rosver-red"
                />
                Recordarme
              </label>
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

          {!pendingEmailVerify && !totpChallenge ? (
          <div className="mt-7 flex items-center justify-center gap-3">
            <SocialButton label="Facebook (próximamente)">
              <IconFacebook className="size-4 text-[#1877F2]" />
            </SocialButton>
            <a
              href={googleStartUrl}
              aria-label="Continuar con Google"
              title="Continuar con Google"
              className="inline-flex size-11 items-center justify-center rounded-full border border-rosver-line bg-white transition hover:border-rosver-red/30 hover:bg-rosver-soft"
            >
              <GoogleMark />
            </a>
          </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-rosver-muted">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-bold text-rosver-red hover:text-rosver-red-dark"
            >
              Regístrate
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  )
}

const pillInputClass =
  'min-h-12 w-full rounded-full border bg-rosver-soft px-5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:bg-white border-transparent focus:ring-2 focus:ring-rosver-red/20'

function SocialButton({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-11 items-center justify-center rounded-full border border-rosver-line bg-white transition hover:border-rosver-red/30 hover:bg-rosver-soft"
    >
      {children}
    </button>
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
