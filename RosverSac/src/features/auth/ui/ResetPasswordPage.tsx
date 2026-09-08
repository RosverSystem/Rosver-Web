import { useAuth } from '@/features/auth'
import { isValidEmail } from '@/shared/lib'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib/cn'
import { cnField } from '@/shared/lib'
import {
  PASSWORD_RULES,
  PASSWORD_STRENGTH_UI,
  getPasswordStrength,
  passwordMeetsRules,
} from '@/shared/lib/password-rules'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Check } from 'cssvg-icons'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Step = 'email' | 'reset'
type FieldKey = 'email' | 'code' | 'password' | 'passwordConfirm'
type FieldErrors = Partial<Record<FieldKey, string>>

const pillInputClass =
  'min-h-12 w-full rounded-full border bg-rosver-soft px-5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:bg-white border-transparent focus:ring-2 focus:ring-rosver-red/20'

/**
 * Recuperación de contraseña: pide correo → envía OTP (purpose reset_password)
 * → confirma código + contraseña nueva. Al reponer, revoca sesiones viejas
 * en el servidor y deja al usuario logueado (mismo patrón que verify-email).
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { resendOtp, resetPassword } = useAuth()
  const { toasts, showErrors, dismiss, clear } = useFormToasts()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)

  const passwordStrength = getPasswordStrength(password)

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !isValidEmail(email)) {
      showErrors({ email: 'Ingresa un correo válido.' }, ['email'])
      return
    }
    clear()
    setBusy(true)
    try {
      await resendOtp(email.trim(), 'reset_password')
      setStep('reset')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar el código.'
      showErrors({ email: msg }, ['email'])
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
      await resetPassword(email.trim(), code.trim(), password)
      navigate('/cuenta', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña.'
      showErrors({ code: msg }, ['code'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl">
          Recuperar contraseña
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-rosver-muted">
          {step === 'email'
            ? 'Ingresa tu correo y te enviamos un código para restablecer tu contraseña.'
            : `Te enviamos un código a ${email}. Ingresa el código y tu nueva contraseña.`}
        </p>

        {step === 'email' ? (
          <form noValidate onSubmit={handleRequestCode} className="mt-8 flex flex-col gap-3.5">
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
              {busy ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form noValidate onSubmit={handleReset} className="mt-8 flex flex-col gap-3.5">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Código de 6 dígitos"
              value={code}
              aria-invalid={Boolean(errors.code)}
              onChange={(e) => {
                setCode(e.target.value)
                setErrors((prev) => ({ ...prev, code: undefined }))
              }}
              className={cnField(
                'rounded-lg border border-rosver-line bg-rosver-soft px-3 py-2.5 text-sm tracking-widest outline-none focus:border-rosver-red/50',
                Boolean(errors.code),
              )}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Contraseña nueva"
              value={password}
              aria-invalid={Boolean(errors.password)}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              className={cnField(pillInputClass, Boolean(errors.password))}
            />
            {password ? (
              <div className="rounded-2xl bg-rosver-soft/80 px-4 py-3">
                <div className="grid gap-1.5">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password)
                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          ok ? 'text-rosver-success' : 'text-rosver-muted',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded-full',
                            ok ? 'bg-rosver-success/15' : 'bg-rosver-line/70',
                          )}
                          aria-hidden
                        >
                          {ok ? (
                            <Check size={10} color="currentColor" strokeWidth={3} />
                          ) : (
                            <span className="size-1 rounded-full bg-rosver-muted" />
                          )}
                        </span>
                        {rule.label}
                      </div>
                    )
                  })}
                </div>
                {passwordStrength ? (
                  <p
                    className={cn(
                      'mt-2 text-xs font-bold',
                      PASSWORD_STRENGTH_UI[passwordStrength].text,
                    )}
                  >
                    Seguridad: {PASSWORD_STRENGTH_UI[passwordStrength].label}
                  </p>
                ) : null}
              </div>
            ) : null}
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
              onClick={() => void resendOtp(email, 'reset_password')}
              className="text-sm font-semibold text-rosver-red"
            >
              Reenviar código
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-rosver-muted">
          <Link to="/login" className="font-bold text-rosver-red hover:text-rosver-red-dark">
            Volver a ingresar
          </Link>
        </p>
      </div>
    </main>
  )
}
