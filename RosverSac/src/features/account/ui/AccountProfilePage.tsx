import { cnField, isValidEmail, isValidPhone } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { WireBlock } from '@/shared/ui/wireframe'
import { type FormEvent, useState } from 'react'

type FieldKey = 'name' | 'email' | 'phone'
type FieldErrors = Partial<Record<FieldKey, string>>

const inputClass =
  'rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50'

export function AccountProfilePage() {
  const { toasts, showErrors, dismiss, clear } = useFormToasts()
  const [name, setName] = useState('Julia Ramírez')
  const [email, setEmail] = useState('julia.ramirez@correo.com')
  const [phone, setPhone] = useState('+51 987 654 321')
  const [ruc, setRuc] = useState('RUC 20456789012 (opcional)')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (!name.trim()) next.name = 'El nombre es obligatorio.'
    if (!email.trim()) next.email = 'El correo es obligatorio.'
    else if (!isValidEmail(email)) next.email = 'El correo no es válido.'
    if (!phone.trim()) next.phone = 'El teléfono es obligatorio.'
    else if (!isValidPhone(phone)) {
      next.phone = 'Ingresa un número válido (mínimo 9 dígitos).'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['name', 'email', 'phone'])
      setSaved(false)
      return
    }
    clear()
    setSaved(true)
  }

  return (
    <WireBlock label="Datos de la cuenta">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <form
        noValidate
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-2"
      >
        <input
          type="text"
          value={name}
          aria-invalid={Boolean(errors.name)}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((p) => {
              const { name: _, ...r } = p
              return r
            })
          }}
          className={cnField(inputClass, Boolean(errors.name))}
        />
        <input
          type="email"
          value={email}
          aria-invalid={Boolean(errors.email)}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrors((p) => {
              const { email: _, ...r } = p
              return r
            })
          }}
          className={cnField(inputClass, Boolean(errors.email))}
        />
        <input
          type="tel"
          value={phone}
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
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          className="self-start rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white sm:col-span-2 sm:w-fit"
        >
          Guardar cambios
        </button>
        {saved ? (
          <p className="text-sm font-medium text-rosver-success sm:col-span-2">
            Cambios guardados (mock).
          </p>
        ) : null}
      </form>
    </WireBlock>
  )
}
