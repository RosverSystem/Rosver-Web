import { ROSVER_COMPANY, cnField, isValidEmail } from '@/shared/lib'
import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { SelectCombobox } from '@/shared/ui/select-combobox'
import { type FormEvent, type ReactNode, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type ClaimKind = 'reclamo' | 'queja'
type GoodKind = 'producto' | 'servicio'
type DocType = 'DNI' | 'CE' | 'RUC' | 'PASAPORTE'

type FieldKey =
  | 'claimKind'
  | 'goodKind'
  | 'consumerName'
  | 'consumerDocType'
  | 'consumerDocNumber'
  | 'consumerAddress'
  | 'consumerPhone'
  | 'consumerEmail'
  | 'guardianName'
  | 'guardianDocNumber'
  | 'contractedDetail'
  | 'claimDetail'
  | 'consumerRequest'

type FieldErrors = Partial<Record<FieldKey, string>>

const inputClass =
  'min-h-11 w-full rounded-xl border border-rosver-line bg-rosver-soft/50 px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted/80 focus:border-rosver-red/35 focus:bg-white focus:ring-2 focus:ring-rosver-red/10'

/**
 * Libro de reclamaciones digital (Perú) — formulario público + guardado API.
 */
export function ComplaintsBookPage() {
  const { toasts, showErrors, showSuccess, dismiss, clear } = useFormToasts()
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [claimKind, setClaimKind] = useState<ClaimKind>('reclamo')
  const [goodKind, setGoodKind] = useState<GoodKind>('producto')
  const [consumerName, setConsumerName] = useState('')
  const [consumerDocType, setConsumerDocType] = useState<DocType>('DNI')
  const [consumerDocNumber, setConsumerDocNumber] = useState('')
  const [consumerAddress, setConsumerAddress] = useState('')
  const [consumerDistrict, setConsumerDistrict] = useState('')
  const [consumerProvince, setConsumerProvince] = useState('')
  const [consumerDepartment, setConsumerDepartment] = useState('Lima')
  const [consumerPhone, setConsumerPhone] = useState('')
  const [consumerEmail, setConsumerEmail] = useState('')
  const [consumerIsMinor, setConsumerIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianDocType, setGuardianDocType] = useState<DocType>('DNI')
  const [guardianDocNumber, setGuardianDocNumber] = useState('')
  const [contractedDetail, setContractedDetail] = useState('')
  const [amount, setAmount] = useState('')
  const [claimDetail, setClaimDetail] = useState('')
  const [consumerRequest, setConsumerRequest] = useState('')

  const nameRef = useRef<HTMLInputElement>(null)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!consumerName.trim()) next.consumerName = 'Escribe tu nombre completo.'
    if (!consumerDocNumber.trim())
      next.consumerDocNumber = 'Indica tu número de documento.'
    if (!consumerAddress.trim())
      next.consumerAddress = 'Indica tu dirección.'
    if (!consumerPhone.trim()) next.consumerPhone = 'Indica un teléfono.'
    if (!consumerEmail.trim() || !isValidEmail(consumerEmail))
      next.consumerEmail = 'Indica un correo válido.'
    if (consumerIsMinor) {
      if (!guardianName.trim())
        next.guardianName = 'Indica el nombre del apoderado.'
      if (!guardianDocNumber.trim())
        next.guardianDocNumber = 'Indica el documento del apoderado.'
    }
    if (!contractedDetail.trim())
      next.contractedDetail = 'Describe el producto o servicio.'
    if (claimDetail.trim().length < 10)
      next.claimDetail = 'Cuéntanos el detalle (mín. 10 caracteres).'
    if (!consumerRequest.trim())
      next.consumerRequest = 'Indica lo que solicitas.'
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, [
        'consumerName',
        'consumerDocNumber',
        'consumerAddress',
        'consumerPhone',
        'consumerEmail',
        'guardianName',
        'guardianDocNumber',
        'contractedDetail',
        'claimDetail',
        'consumerRequest',
      ])
      nameRef.current?.focus()
      return
    }
    clear()
    setBusy(true)
    try {
      const amt = amount.trim() === '' ? null : Number(amount)
      if (amt != null && (!Number.isFinite(amt) || amt < 0)) {
        showErrors({ claimDetail: 'El monto no es válido.' })
        setBusy(false)
        return
      }
      const res = await api<{
        complaint: { code: string }
        message?: string
      }>('/api/complaints', {
        method: 'POST',
        body: JSON.stringify({
          claimKind,
          goodKind,
          consumerName: consumerName.trim(),
          consumerDocType,
          consumerDocNumber: consumerDocNumber.trim(),
          consumerAddress: consumerAddress.trim(),
          consumerDistrict: consumerDistrict.trim() || null,
          consumerProvince: consumerProvince.trim() || null,
          consumerDepartment: consumerDepartment.trim() || null,
          consumerPhone: consumerPhone.trim(),
          consumerEmail: consumerEmail.trim(),
          consumerIsMinor,
          guardianName: consumerIsMinor ? guardianName.trim() : null,
          guardianDocType: consumerIsMinor ? guardianDocType : null,
          guardianDocNumber: consumerIsMinor
            ? guardianDocNumber.trim()
            : null,
          contractedDetail: contractedDetail.trim(),
          amount: amt,
          claimDetail: claimDetail.trim(),
          consumerRequest: consumerRequest.trim(),
        }),
      })
      setSentCode(res.complaint.code)
      showSuccess(['Hoja registrada. Guarda tu código.'])
    } catch (err) {
      showErrors({
        claimDetail:
          err instanceof ApiError
            ? err.message
            : 'No se pudo registrar. Intenta de nuevo.',
      })
    } finally {
      setBusy(false)
    }
  }

  const co = ROSVER_COMPANY

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-5 overflow-x-hidden px-4 pb-28 lg:px-6">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <nav
        className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-rosver-muted"
        aria-label="Ruta"
      >
        <Link to="/" className="hover:text-rosver-red">
          Inicio
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-rosver-ink">
          Libro de reclamaciones
        </span>
      </nav>

      <header className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-rosver-line bg-rosver-soft/40 px-5 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-7">
          <img
            src="/libro-reclamaciones.png"
            alt="Libro de reclamaciones digital"
            width={160}
            height={56}
            className="h-12 w-auto object-contain sm:h-14"
            decoding="async"
          />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-rosver-ink uppercase sm:text-3xl">
              Libro de reclamaciones
            </h1>
            <p className="mt-1 text-sm text-rosver-muted">
              Conforme al Código de Protección y Defensa del Consumidor
              (Perú).
            </p>
          </div>
        </div>
        <div className="grid gap-3 px-5 py-4 text-sm text-rosver-muted sm:grid-cols-2 sm:px-7">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-rosver-ink uppercase">
              Proveedor
            </p>
            <p className="mt-1 font-semibold text-rosver-ink">{co.legalName}</p>
            <p>RUC {co.ruc}</p>
            <p>{co.localAddress}</p>
          </div>
          <div className="rounded-xl border border-rosver-line bg-rosver-soft/50 p-3 text-xs leading-relaxed">
            <p>
              <strong className="text-rosver-ink">Reclamo:</strong> disconformidad
              relacionada a productos o servicios.
            </p>
            <p className="mt-1.5">
              <strong className="text-rosver-ink">Queja:</strong> malestar o
              disconformidad respecto a la atención al usuario (no necesariamente
              vinculada al producto).
            </p>
            <p className="mt-1.5 text-rosver-muted">
              Plazo de respuesta a un reclamo: hasta{' '}
              <strong className="text-rosver-ink">15 días calendario</strong>.
            </p>
          </div>
        </div>
      </header>

      {sentCode ? (
        <section className="rounded-2xl border border-rosver-line bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-bold tracking-wide text-rosver-success uppercase">
            Registrado
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-rosver-ink uppercase">
            Hoja generada
          </h2>
          <p className="mt-3 text-sm text-rosver-muted">
            Conserva este código. Es tu constancia de ingreso al libro de
            reclamaciones.
          </p>
          <p className="mt-4 rounded-xl border-2 border-rosver-red bg-rosver-red/5 px-4 py-3 font-display text-xl font-bold tracking-wide text-rosver-red sm:text-2xl">
            {sentCode}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSentCode(null)
                setClaimDetail('')
                setConsumerRequest('')
                setContractedDetail('')
                setAmount('')
              }}
              className="inline-flex min-h-11 items-center rounded-full border border-rosver-line bg-white px-5 text-sm font-bold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
            >
              Registrar otra hoja
            </button>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-full bg-rosver-red px-5 text-sm font-bold text-white hover:bg-rosver-red-dark"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      ) : (
        <form
          noValidate
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-rosver-line bg-white p-5 shadow-sm sm:p-7"
        >
          <Section title="1. Identificación de la reclamación">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo" htmlFor="claim-kind">
                <SelectCombobox
                  id="claim-kind"
                  value={claimKind}
                  onValueChange={(v) => setClaimKind(v as ClaimKind)}
                  options={[
                    { value: 'reclamo', label: 'Reclamo' },
                    { value: 'queja', label: 'Queja' },
                  ]}
                />
              </Field>
              <Field label="Bien contratado" htmlFor="good-kind">
                <SelectCombobox
                  id="good-kind"
                  value={goodKind}
                  onValueChange={(v) => setGoodKind(v as GoodKind)}
                  options={[
                    { value: 'producto', label: 'Producto' },
                    { value: 'servicio', label: 'Servicio' },
                  ]}
                />
              </Field>
            </div>
          </Section>

          <Section title="2. Datos del consumidor">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo" htmlFor="c-name" className="sm:col-span-2">
                <input
                  ref={nameRef}
                  id="c-name"
                  className={cnField(inputClass, Boolean(errors.consumerName))}
                  value={consumerName}
                  onChange={(e) => {
                    setConsumerName(e.target.value)
                    setErrors((p) => ({ ...p, consumerName: undefined }))
                  }}
                  aria-invalid={Boolean(errors.consumerName)}
                />
              </Field>
              <Field label="Tipo de documento" htmlFor="c-doc-type">
                <SelectCombobox
                  id="c-doc-type"
                  value={consumerDocType}
                  onValueChange={(v) => setConsumerDocType(v as DocType)}
                  options={[
                    { value: 'DNI', label: 'DNI' },
                    { value: 'CE', label: 'Carné de extranjería' },
                    { value: 'RUC', label: 'RUC' },
                    { value: 'PASAPORTE', label: 'Pasaporte' },
                  ]}
                />
              </Field>
              <Field label="Nº documento" htmlFor="c-doc">
                <input
                  id="c-doc"
                  className={cnField(
                    inputClass,
                    Boolean(errors.consumerDocNumber),
                  )}
                  value={consumerDocNumber}
                  onChange={(e) => {
                    setConsumerDocNumber(e.target.value)
                    setErrors((p) => ({ ...p, consumerDocNumber: undefined }))
                  }}
                  aria-invalid={Boolean(errors.consumerDocNumber)}
                />
              </Field>
              <Field label="Dirección" htmlFor="c-addr" className="sm:col-span-2">
                <input
                  id="c-addr"
                  className={cnField(
                    inputClass,
                    Boolean(errors.consumerAddress),
                  )}
                  value={consumerAddress}
                  onChange={(e) => {
                    setConsumerAddress(e.target.value)
                    setErrors((p) => ({ ...p, consumerAddress: undefined }))
                  }}
                  aria-invalid={Boolean(errors.consumerAddress)}
                />
              </Field>
              <Field label="Distrito" htmlFor="c-dist">
                <input
                  id="c-dist"
                  className={inputClass}
                  value={consumerDistrict}
                  onChange={(e) => setConsumerDistrict(e.target.value)}
                />
              </Field>
              <Field label="Provincia" htmlFor="c-prov">
                <input
                  id="c-prov"
                  className={inputClass}
                  value={consumerProvince}
                  onChange={(e) => setConsumerProvince(e.target.value)}
                />
              </Field>
              <Field label="Departamento" htmlFor="c-dep">
                <input
                  id="c-dep"
                  className={inputClass}
                  value={consumerDepartment}
                  onChange={(e) => setConsumerDepartment(e.target.value)}
                />
              </Field>
              <Field label="Teléfono" htmlFor="c-phone">
                <input
                  id="c-phone"
                  type="tel"
                  className={cnField(inputClass, Boolean(errors.consumerPhone))}
                  value={consumerPhone}
                  onChange={(e) => {
                    setConsumerPhone(e.target.value)
                    setErrors((p) => ({ ...p, consumerPhone: undefined }))
                  }}
                  aria-invalid={Boolean(errors.consumerPhone)}
                />
              </Field>
              <Field label="Correo" htmlFor="c-email" className="sm:col-span-2">
                <input
                  id="c-email"
                  type="email"
                  className={cnField(inputClass, Boolean(errors.consumerEmail))}
                  value={consumerEmail}
                  onChange={(e) => {
                    setConsumerEmail(e.target.value)
                    setErrors((p) => ({ ...p, consumerEmail: undefined }))
                  }}
                  aria-invalid={Boolean(errors.consumerEmail)}
                />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-rosver-ink">
              <input
                type="checkbox"
                checked={consumerIsMinor}
                onChange={(e) => setConsumerIsMinor(e.target.checked)}
                className="size-4 rounded border-rosver-line accent-rosver-red"
              />
              Soy menor de edad (completar datos del apoderado)
            </label>
            {consumerIsMinor ? (
              <div className="mt-3 grid gap-4 rounded-xl border border-rosver-line bg-rosver-soft/40 p-4 sm:grid-cols-2">
                <Field label="Nombre del apoderado" htmlFor="g-name" className="sm:col-span-2">
                  <input
                    id="g-name"
                    className={cnField(inputClass, Boolean(errors.guardianName))}
                    value={guardianName}
                    onChange={(e) => {
                      setGuardianName(e.target.value)
                      setErrors((p) => ({ ...p, guardianName: undefined }))
                    }}
                  />
                </Field>
                <Field label="Doc. apoderado" htmlFor="g-type">
                  <SelectCombobox
                    id="g-type"
                    value={guardianDocType}
                    onValueChange={(v) => setGuardianDocType(v as DocType)}
                    options={[
                      { value: 'DNI', label: 'DNI' },
                      { value: 'CE', label: 'CE' },
                      { value: 'RUC', label: 'RUC' },
                      { value: 'PASAPORTE', label: 'Pasaporte' },
                    ]}
                  />
                </Field>
                <Field label="Nº doc. apoderado" htmlFor="g-doc">
                  <input
                    id="g-doc"
                    className={cnField(
                      inputClass,
                      Boolean(errors.guardianDocNumber),
                    )}
                    value={guardianDocNumber}
                    onChange={(e) => {
                      setGuardianDocNumber(e.target.value)
                      setErrors((p) => ({
                        ...p,
                        guardianDocNumber: undefined,
                      }))
                    }}
                  />
                </Field>
              </div>
            ) : null}
          </Section>

          <Section title="3. Detalle del producto o servicio">
            <Field label="Descripción" htmlFor="contracted">
              <textarea
                id="contracted"
                rows={3}
                className={cnField(
                  `${inputClass} min-h-24 resize-y`,
                  Boolean(errors.contractedDetail),
                )}
                value={contractedDetail}
                onChange={(e) => {
                  setContractedDetail(e.target.value)
                  setErrors((p) => ({ ...p, contractedDetail: undefined }))
                }}
                placeholder="Ej. Lámpara LED RS-5402 comprada el …"
              />
            </Field>
            <Field label="Monto reclamado (S/) — opcional" htmlFor="amount" className="mt-4 max-w-xs">
              <input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Field>
          </Section>

          <Section title="4. Detalle de la reclamación">
            <Field label="Detalle" htmlFor="detail">
              <textarea
                id="detail"
                rows={4}
                className={cnField(
                  `${inputClass} min-h-28 resize-y`,
                  Boolean(errors.claimDetail),
                )}
                value={claimDetail}
                onChange={(e) => {
                  setClaimDetail(e.target.value)
                  setErrors((p) => ({ ...p, claimDetail: undefined }))
                }}
                placeholder="Describe lo ocurrido con claridad"
              />
            </Field>
            <Field
              label="Pedido del consumidor"
              htmlFor="request"
              className="mt-4"
            >
              <textarea
                id="request"
                rows={3}
                className={cnField(
                  `${inputClass} min-h-24 resize-y`,
                  Boolean(errors.consumerRequest),
                )}
                value={consumerRequest}
                onChange={(e) => {
                  setConsumerRequest(e.target.value)
                  setErrors((p) => ({ ...p, consumerRequest: undefined }))
                }}
                placeholder="Ej. Cambio, devolución, reparación, disculpas…"
              />
            </Field>
          </Section>

          <p className="text-xs leading-relaxed text-rosver-muted">
            Al enviar declaras que la información es verdadera. Esta hoja no
            impide el derecho a acudir a INDECOPI u otras vías legales. El
            proveedor responderá según la normativa aplicable.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-rosver-red px-6 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-rosver-red-dark disabled:opacity-60 sm:w-auto"
          >
            {busy ? 'Registrando…' : 'Registrar hoja'}
          </button>
        </form>
      )}
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-rosver-ink uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-rosver-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
