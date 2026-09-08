import { useAuth } from '@/features/auth'
import { OtpVerifyPanel } from '@/features/auth/ui/OtpVerifyPanel'
import { isValidEmail, isValidPhone, cnField } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import {
  PASSWORD_RULES,
  PASSWORD_STRENGTH_UI,
  getPasswordStrength,
  passwordMeetsRules,
  type PasswordStrength,
} from '@/shared/lib/password-rules'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { cn } from '@/shared/lib/cn'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconFacebook } from '@/shared/ui/icons'
import { Check } from 'cssvg-icons'
import { motion } from 'motion/react'
import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type FieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'passwordConfirm'
  | 'terms'

type FieldErrors = Partial<Record<FieldKey, string>>

/** Tras dejar de teclear, se ocultan los requisitos y queda la barra. */
const PASSWORD_IDLE_MS = 900

/**
 * Registro full-bleed: validación propia, requisitos de contraseña y confirmación de teléfono.
 */
export function RegisterPage() {
  const navigate = useNavigate()
  const reduce = prefersReducedMotion()
  const formId = useId()
  const { register, googleStartUrl } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null)
  const [registerBusy, setRegisterBusy] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [showPasswordRules, setShowPasswordRules] = useState(false)
  const { toasts, showErrors, dismiss, clear } = useFormToasts()

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const passwordConfirmRef = useRef<HTMLInputElement>(null)
  const termsRef = useRef<HTMLInputElement>(null)
  const passwordIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const passwordRuleStatus = PASSWORD_RULES.map((rule) => ({
    ...rule,
    ok: rule.test(password),
  }))
  const passwordStrength = getPasswordStrength(password)
  const rulesExpanded =
    Boolean(password) &&
    (showPasswordRules || Boolean(errors.password && submitted))

  useEffect(() => {
    return () => {
      if (passwordIdleTimer.current) clearTimeout(passwordIdleTimer.current)
    }
  }, [])

  function bumpPasswordTyping() {
    setShowPasswordRules(true)
    if (passwordIdleTimer.current) clearTimeout(passwordIdleTimer.current)
    passwordIdleTimer.current = setTimeout(() => {
      setShowPasswordRules(false)
    }, PASSWORD_IDLE_MS)
  }

  function validate(values = { name, email, phone, password, passwordConfirm, terms }): FieldErrors {
    const next: FieldErrors = {}

    if (!values.name.trim()) {
      next.name = 'Completa tu nombre completo.'
    }

    if (!values.email.trim()) {
      next.email = 'Ingresa tu correo.'
    } else if (!isValidEmail(values.email.trim())) {
      next.email = 'El correo no es válido.'
    }

    if (!values.phone.trim()) {
      next.phone = 'El teléfono o WhatsApp es obligatorio.'
    } else if (!isValidPhone(values.phone)) {
      next.phone = 'Ingresa un número válido (mínimo 9 dígitos).'
    }

    if (!values.password) {
      next.password = 'Crea una contraseña.'
    } else if (!passwordMeetsRules(values.password)) {
      next.password = 'La contraseña no cumple los requisitos de seguridad.'
    }

    if (!values.passwordConfirm) {
      next.passwordConfirm = 'Confirma tu contraseña.'
    } else if (values.passwordConfirm !== values.password) {
      next.passwordConfirm = 'Las contraseñas no coinciden.'
    }

    if (!values.terms) {
      next.terms = 'Debes aceptar el contacto comercial para continuar.'
    }

    return next
  }

  function focusFirstError(next: FieldErrors) {
    const order: FieldKey[] = [
      'name',
      'email',
      'phone',
      'password',
      'passwordConfirm',
      'terms',
    ]
    const first = order.find((key) => next[key])
    const map = {
      name: nameRef,
      email: emailRef,
      phone: phoneRef,
      password: passwordRef,
      passwordConfirm: passwordConfirmRef,
      terms: termsRef,
    } as const
    if (first) map[first].current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, [
        'name',
        'email',
        'phone',
        'password',
        'passwordConfirm',
        'terms',
      ])
      focusFirstError(next)
      return
    }
    clear()
    setPhoneModalOpen(true)
  }

  function clearFieldError(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  async function handleConfirmPhone() {
    setPhoneModalOpen(false)
    setRegisterBusy(true)
    try {
      const result = await register({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      })
      setPendingVerifyEmail(result.email)
      clear()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.'
      showErrors({ email: msg }, ['email'])
    } finally {
      setRegisterBusy(false)
    }
  }

  function handleEditPhone() {
    setPhoneModalOpen(false)
    requestAnimationFrame(() => phoneRef.current?.focus())
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
            src="/register-hero-rosver.webp"
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
            Tu proyecto, nuestra herramienta.
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
            {pendingVerifyEmail ? 'Verifica tu correo' : 'Crear cuenta'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-rosver-muted sm:text-base">
            {pendingVerifyEmail
              ? 'Ingresa el código OTP para activar tu cuenta.'
              : 'Regístrate en minutos y gestiona pedidos, cotizaciones y perfil.'}
          </p>

          {pendingVerifyEmail ? (
            <div className="mt-8">
              <OtpVerifyPanel
                email={pendingVerifyEmail}
                onVerified={(u) =>
                  navigate(u?.roleCode === 'admin' ? '/admin' : '/cuenta', {
                    replace: true,
                  })
                }
              />
            </div>
          ) : (
            <>
          <ul className="mt-5 space-y-2">
            {[
              'Historial de pedidos y cotizaciones',
              'Datos de entrega guardados',
              'También puedes cotizar sin cuenta',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-rosver-muted"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rosver-success/15 text-rosver-success">
                  <Check size={12} color="currentColor" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3.5"
          >
            <FieldBlock id="reg-name" label="Nombre completo">
              <input
                ref={nameRef}
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Nombre completo"
                value={name}
                aria-invalid={Boolean(errors.name)}
                onChange={(e) => {
                  setName(e.target.value)
                  clearFieldError('name')
                }}
                className={fieldInputClass(Boolean(errors.name))}
              />
            </FieldBlock>

            <FieldBlock id="reg-email" label="Correo">
              <input
                ref={emailRef}
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Correo"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearFieldError('email')
                }}
                className={fieldInputClass(Boolean(errors.email))}
              />
            </FieldBlock>

            <FieldBlock id="reg-phone" label="Teléfono o WhatsApp">
              <input
                ref={phoneRef}
                id="reg-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Teléfono o WhatsApp"
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(e) => {
                  setPhone(e.target.value)
                  clearFieldError('phone')
                }}
                className={fieldInputClass(Boolean(errors.phone))}
              />
            </FieldBlock>

            <FieldBlock id="reg-password" label="Contraseña">
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Contraseña"
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={`${formId}-password-feedback`}
                  onChange={(e) => {
                    const value = e.target.value
                    setPassword(value)
                    clearFieldError('password')
                    if (passwordConfirm && value === passwordConfirm) {
                      clearFieldError('passwordConfirm')
                    }
                    if (value) bumpPasswordTyping()
                    else {
                      setShowPasswordRules(false)
                      if (passwordIdleTimer.current) {
                        clearTimeout(passwordIdleTimer.current)
                      }
                    }
                  }}
                  onFocus={() => {
                    if (password) bumpPasswordTyping()
                  }}
                  className={cn(fieldInputClass(Boolean(errors.password)), 'pr-16')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-5 -translate-y-1/2 text-xs font-bold text-rosver-muted hover:text-rosver-ink"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </FieldBlock>

            <div
              id={`${formId}-password-feedback`}
              className="min-h-0"
              aria-live="polite"
            >
              {password ? (
                rulesExpanded ? (
                  <motion.ul
                    key="rules"
                    id={`${formId}-password-rules`}
                    className="grid gap-1.5 overflow-hidden rounded-2xl bg-rosver-soft/80 px-4 py-3"
                    aria-label="Requisitos de la contraseña"
                    initial={reduce ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    {passwordRuleStatus.map((rule) => (
                      <li
                        key={rule.id}
                        className={cn(
                          'flex items-center gap-2 text-xs transition-colors',
                          rule.ok ? 'text-rosver-success' : 'text-rosver-muted',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded-full',
                            rule.ok
                              ? 'bg-rosver-success/15'
                              : 'bg-rosver-line/70',
                          )}
                          aria-hidden
                        >
                          {rule.ok ? (
                            <Check
                              size={10}
                              color="currentColor"
                              strokeWidth={3}
                            />
                          ) : (
                            <span className="size-1 rounded-full bg-rosver-muted" />
                          )}
                        </span>
                        <span>
                          {rule.label}
                          <span className="sr-only">
                            {rule.ok ? ' — cumplido' : ' — pendiente'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </motion.ul>
                ) : passwordStrength ? (
                  <PasswordStrengthBar
                    strength={passwordStrength}
                    reduceMotion={reduce}
                  />
                ) : null
              ) : null}
            </div>

            <FieldBlock id="reg-password2" label="Confirmar contraseña">
              <div className="relative">
                <input
                  ref={passwordConfirmRef}
                  id="reg-password2"
                  name="passwordConfirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirmar contraseña"
                  value={passwordConfirm}
                  aria-invalid={Boolean(errors.passwordConfirm)}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value)
                    clearFieldError('passwordConfirm')
                  }}
                  className={cn(
                    fieldInputClass(Boolean(errors.passwordConfirm)),
                    'pr-16',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute top-1/2 right-5 -translate-y-1/2 text-xs font-bold text-rosver-muted hover:text-rosver-ink"
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </FieldBlock>

            <label
              className={cn(
                'mt-1 flex items-start gap-2 rounded-xl px-1 py-1 text-xs text-rosver-muted',
                errors.terms && 'ring-2 ring-rosver-red/30',
              )}
            >
              <input
                ref={termsRef}
                type="checkbox"
                name="terms"
                checked={terms}
                aria-invalid={Boolean(errors.terms)}
                onChange={(e) => {
                  setTerms(e.target.checked)
                  clearFieldError('terms')
                }}
                className="mt-0.5 size-4 rounded border-rosver-line accent-rosver-red"
              />
              <span>
                Acepto ser contactado por comercial Rosver sobre mi cuenta y
                pedidos.
              </span>
            </label>

            <button
              type="submit"
              disabled={registerBusy}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rosver-red px-6 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {registerBusy ? 'Creando…' : 'Crear cuenta'}
            </button>
          </form>

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

          <p className="mt-8 text-center text-sm text-rosver-muted">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-bold text-rosver-red hover:text-rosver-red-dark"
            >
              Ingresar
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-rosver-muted">
            ¿Prefieres no registrarte?{' '}
            <Link
              to="/cotizar"
              className="font-semibold text-rosver-blue hover:text-rosver-red"
            >
              Cotiza sin cuenta
            </Link>
          </p>
            </>
          )}
        </motion.div>
      </section>

      {phoneModalOpen ? (
        <PhoneConfirmModal
          phone={phone.trim()}
          onConfirm={handleConfirmPhone}
          onEdit={handleEditPhone}
          reduceMotion={reduce}
        />
      ) : null}
    </main>
  )
}

function PasswordStrengthBar({
  strength,
  reduceMotion,
}: {
  strength: PasswordStrength
  reduceMotion: boolean
}) {
  const ui = PASSWORD_STRENGTH_UI[strength]

  return (
    <motion.div
      key="strength"
      className="rounded-2xl bg-rosver-soft/80 px-4 py-3"
      role="status"
      aria-label={`Seguridad de la contraseña: ${ui.label}`}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
          Seguridad
        </span>
        <span className={cn('text-xs font-bold', ui.text)}>{ui.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-rosver-line/80">
        <motion.div
          className={cn('h-full rounded-full', ui.bar)}
          initial={false}
          animate={{ width: ui.width }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 280, damping: 28 }
          }
        />
      </div>
    </motion.div>
  )
}

function FieldBlock({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

function PhoneConfirmModal({
  phone,
  onConfirm,
  onEdit,
  reduceMotion,
}: {
  phone: string
  onConfirm: () => void
  onEdit: () => void
  reduceMotion: boolean
}) {
  const titleId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onEdit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onEdit])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-rosver-ink/50 backdrop-blur-[2px]"
        onClick={onEdit}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border border-rosver-line bg-white p-6 shadow-xl sm:p-8"
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-muted uppercase">
          Confirmar contacto
        </p>
        <h2
          id={titleId}
          className="mt-2 font-display text-2xl font-bold tracking-tight text-rosver-ink"
        >
          ¿Tu número es correcto?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-rosver-muted">
          Lo usaremos para WhatsApp y seguimiento comercial. Revisa que no tenga
          un dígito de más o de menos.
        </p>
        <p className="mt-5 rounded-2xl bg-rosver-soft px-4 py-3 text-center font-display text-xl font-bold tracking-wide text-rosver-ink">
          {phone}
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-rosver-red px-5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
          >
            Sí, es correcto
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-rosver-line bg-white px-5 text-sm font-bold text-rosver-ink transition hover:border-rosver-red/40 hover:bg-rosver-soft"
          >
            Editar número
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function fieldInputClass(hasError: boolean) {
  return cnField(
    'min-h-12 w-full rounded-full border bg-rosver-soft px-5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:bg-white border-transparent focus:ring-2 focus:ring-rosver-red/20',
    hasError,
  )
}

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
