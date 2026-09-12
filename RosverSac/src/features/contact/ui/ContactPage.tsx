import { useAuth } from '@/features/auth'
import {
  asPeruDocType,
  buildFixedWhatsAppLink,
  cn,
  cnField,
  CONTACT_WHATSAPP_MESSAGE,
  digitsOnly,
  docNumberError,
  isDocReady,
  isValidEmail,
  isValidPhone,
  ROSVER_COMPANY,
  WHATSAPP_DISPLAY,
  WHATSAPP_LINES,
  type PeruDocType,
} from '@/shared/lib'
import { api, ApiError } from '@/shared/lib/api'
import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconWhatsApp } from '@/shared/ui/icons'
import { SelectCombobox } from '@/shared/ui/select-combobox'
import { ArrowRight, Check, Compass, Message, Phone, Search } from 'cssvg-icons'
import { AnimatePresence, motion } from 'motion/react'
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'

type DocType = PeruDocType
type FieldKey =
  | 'name'
  | 'phone'
  | 'email'
  | 'message'
  | 'docNumber'
  | 'businessName'
type FieldErrors = Partial<Record<FieldKey, string>>
type SubmitPhase = 'idle' | 'sending' | 'sent'

const DOC_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'RUC', label: 'RUC' },
]

const SENT_HOLD_MS = 2200

/**
 * Contacto — hero de marca + panel ink / form (toasts flotantes).
 */
export function ContactPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<SubmitPhase>('idle')
  const [receiptCode, setReceiptCode] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [docType, setDocType] = useState<DocType>('DNI')
  const [docNumber, setDocNumber] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [lookupBusy, setLookupBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false)
  const lastLookupRef = useRef<string>('')
  const reduce = prefersReducedMotion()
  const { toasts, showErrors, showSuccess, showInfo, showWarning, dismiss, clear } =
    useFormToasts()
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  const sessionLabel =
    user?.fullName?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    null

  useEffect(() => {
    if (!user || prefilledFromProfile) return
    const t = asPeruDocType(user.documentType)
    const digits = digitsOnly(user.documentNumber ?? '')
    if (t && digits && isDocReady(t, digits)) {
      setDocType(t)
      setDocNumber(digits)
      lastLookupRef.current = `${t}:${digits}`
    }
    if (user.companyName?.trim()) setBusinessName(user.companyName.trim())
    if (user.fullName?.trim()) setName(user.fullName.trim())
    else if (user.companyName?.trim()) setName(user.companyName.trim())
    if (user.phone?.trim()) setPhone(user.phone.trim())
    if (user.email?.trim()) setEmail(user.email.trim())
    setPrefilledFromProfile(true)
  }, [user, prefilledFromProfile])

  function clearKey(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function lookupDocument(
    rawNumber = docNumber,
    type = docType,
    opts?: { silentIncomplete?: boolean },
  ) {
    const digits = digitsOnly(rawNumber)
    const err = docNumberError(type, digits)
    if (err) {
      if (!opts?.silentIncomplete) {
        showErrors({ docNumber: err })
        setErrors((prev) => ({ ...prev, docNumber: err }))
      }
      return
    }
    const lookupKey = `${type}:${digits}`
    if (lookupBusy || lastLookupRef.current === lookupKey) return
    clear()
    clearKey('docNumber')
    setLookupBusy(true)
    try {
      const data = await api<{
        docType: DocType
        fullName?: string
        businessName?: string
      }>('/api/peru/lookup', {
        method: 'POST',
        body: JSON.stringify({ docType: type, docNumber: digits }),
      })
      lastLookupRef.current = lookupKey
      if (data.docType === 'DNI' && data.fullName) {
        setName(data.fullName)
        setBusinessName('')
        clearKey('name')
        showSuccess(['Nombre encontrado'])
      } else if (data.docType === 'RUC' && data.businessName) {
        setBusinessName(data.businessName)
        if (!name.trim()) setName(data.businessName)
        clearKey('businessName')
        clearKey('name')
        showSuccess(['Razón social encontrada'])
      } else {
        showInfo(['Consulta OK, pero sin nombre para completar.'])
      }
    } catch (err) {
      lastLookupRef.current = ''
      showErrors({
        docNumber:
          err instanceof ApiError
            ? err.message
            : 'No se pudo consultar el documento.',
      })
    } finally {
      setLookupBusy(false)
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const digits = digitsOnly(docNumber)
    if (digits.length > 0 || docType) {
      const docErr = docNumberError(docType, digits)
      // Solo exigir documento si el usuario empezó a llenarlo
      if (digits.length > 0 && docErr) next.docNumber = docErr
    }
    if (!name.trim()) next.name = 'Completa tu nombre o empresa.'
    if (!email.trim()) next.email = 'El correo es obligatorio para confirmarte.'
    else if (!isValidEmail(email)) next.email = 'El correo no es válido.'
    if (phone.trim() && !isValidPhone(phone)) {
      next.phone = 'El WhatsApp/teléfono no es válido.'
    }
    if (!message.trim()) {
      next.message = 'Escribe un mensaje de al menos 5 caracteres (máx. 1000).'
    } else if (message.trim().length < 5) {
      next.message = 'El mensaje debe tener al menos 5 caracteres (máx. 1000).'
    } else if (message.length > 1000) {
      next.message = 'El mensaje puede tener como máximo 1000 caracteres.'
    }
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      const onlyMessageHint =
        Object.keys(next).length === 1 && Boolean(next.message)
      if (onlyMessageHint) {
        showInfo([next.message!])
      } else {
        showErrors(next, [
          'docNumber',
          'name',
          'businessName',
          'phone',
          'email',
          'message',
        ])
      }
      if (next.docNumber) docRef.current?.focus()
      else if (next.name) nameRef.current?.focus()
      else if (next.email) emailRef.current?.focus()
      else if (next.phone) phoneRef.current?.focus()
      else messageRef.current?.focus()
      return
    }
    clear()
    setStatus('sending')
    setReceiptCode(null)
    try {
      const digits = digitsOnly(docNumber)
      const data = await api<{
        code: string
        confirmationSent: boolean
      }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          documentType: digits ? docType : null,
          documentNumber: digits || null,
          businessName: businessName.trim() || null,
          message: message.trim(),
        }),
      })
      setReceiptCode(data.code)
      setStatus('sent')
      setMessage('')
      showSuccess([
        `Mensaje enviado. Constancia ${data.code}.`,
        data.confirmationSent
          ? 'Te enviamos la confirmación a tu correo.'
          : 'Guardamos tu solicitud; la confirmación por correo se reintentará.',
      ])
      if (!data.confirmationSent) {
        showWarning([
          'No pudimos enviar el correo ahora. Tu mensaje sí quedó registrado.',
        ])
      }
    } catch (err) {
      setStatus('idle')
      showErrors({
        message:
          err instanceof ApiError
            ? err.message
            : 'No se pudo enviar el mensaje. Intenta de nuevo.',
      })
    }
  }

  useEffect(() => {
    if (status !== 'sent') return
    const hold = reduce ? 900 : SENT_HOLD_MS
    const t = window.setTimeout(() => {
      setStatus('idle')
      setReceiptCode(null)
    }, hold)
    return () => window.clearTimeout(t)
  }, [status, reduce])

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5 overflow-x-hidden px-4 pb-28 lg:px-6">
      <FloatingToasts
        toasts={toasts}
        onDismiss={dismiss}
        reduceMotion={reduce}
      />

      <div className="pt-4 sm:pt-6">
        <ContactHero reduce={reduce} />
      </div>

      <motion.div
        className="overflow-hidden rounded-2xl border border-rosver-line shadow-[0_18px_48px_-28px_rgba(17,17,17,0.45)]"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-stretch">
          {/* Panel marca */}
          <aside className="relative flex flex-col overflow-hidden bg-rosver-ink px-5 py-7 text-white sm:px-7 sm:py-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, #e30613 0, transparent 42%), radial-gradient(circle at 85% 70%, #fff 0, transparent 35%)',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-8 -bottom-10 size-44 rounded-full border-[16px] border-rosver-red/40"
              aria-hidden
            />

            <div className="relative z-[1] flex flex-1 flex-col">
              <p className="text-[11px] font-bold tracking-[0.18em] text-white/55 uppercase">
                Atención comercial
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight uppercase sm:text-3xl">
                Hablemos de tu{' '}
                <span className="text-rosver-red">pedido</span>
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
                Importación y mayoreo. Te respondemos por WhatsApp o por este
                formulario.
              </p>

              <AsideMap />

              <ul className="mt-6 space-y-3">
                <AsideFact
                  icon={<Phone size={16} color="currentColor" strokeWidth={2} />}
                  label="WhatsApp"
                  value={WHATSAPP_DISPLAY}
                />
                <AsideFact
                  icon={<Message size={16} color="currentColor" strokeWidth={2} />}
                  label="Correo"
                  value={ROSVER_COMPANY.email}
                />
                <AsideFact
                  icon={<Compass size={16} color="currentColor" strokeWidth={2} />}
                  label="Dirección"
                  value={
                    <a
                      href={ROSVER_COMPANY.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 hover:underline"
                    >
                      {ROSVER_COMPANY.localAddress}
                    </a>
                  }
                />
              </ul>

              <div className="mt-5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-xs leading-relaxed text-white/70">
                <p className="font-bold tracking-wide text-white/90 uppercase">
                  {ROSVER_COMPANY.legalName}
                </p>
                <p className="mt-1">RUC {ROSVER_COMPANY.ruc}</p>
              </div>

              <div className="mt-auto flex flex-col gap-2.5 pt-7">
                <a
                  href={buildFixedWhatsAppLink(
                    WHATSAPP_LINES[0].e164,
                    CONTACT_WHATSAPP_MESSAGE,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-white transition hover:bg-[#20bd5a]"
                >
                  <IconWhatsApp className="size-5" />
                  Escribir por WhatsApp
                </a>
                <Link
                  to="/cotizar"
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-5 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/10"
                >
                  Cotizar pedido por volumen
                  <ArrowRight size={14} color="#ffffff" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Formulario */}
          <section
            className="bg-white px-5 py-7 sm:px-7 sm:py-8"
            aria-labelledby="contacto-form-title"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-rosver-muted uppercase">
                  Formulario
                </p>
                <h2
                  id="contacto-form-title"
                  className="mt-1 font-display text-2xl font-bold tracking-tight text-rosver-ink uppercase"
                >
                  Envíanos un mensaje
                </h2>
              </div>
              {sessionLabel ? (
                <span className="hidden rounded-full bg-rosver-soft px-3 py-1 text-[11px] font-bold text-rosver-ink sm:inline">
                  Hola, {sessionLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-rosver-muted">
              Completa los datos — comercial te responde por el canal que
              indiques.
            </p>

            <div className="relative mt-6 min-h-[22rem]">
              <AnimatePresence mode="wait" initial={false}>
                {status === 'sending' ? (
                  <ContactSubmitStage
                    key="sending"
                    phase="sending"
                    reduce={reduce}
                  />
                ) : status === 'sent' ? (
                  <ContactSubmitStage
                    key="sent"
                    phase="sent"
                    reduce={reduce}
                    code={receiptCode}
                  />
                ) : (
                  <motion.form
                    key="form"
                    noValidate
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduce
                        ? { opacity: 0 }
                        : { opacity: 0, y: -8, filter: 'blur(2px)' }
                    }
                    transition={{
                      duration: reduce ? 0.15 : 0.28,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                <div className="grid gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-end">
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className="font-bold text-rosver-ink">Documento</span>
                    <SelectCombobox
                      id="contact-doc-type"
                      value={docType}
                      invalid={Boolean(errors.docNumber)}
                      onValueChange={(next) => {
                        const v = next as DocType
                        setDocType(v)
                        setDocNumber('')
                        setBusinessName('')
                        lastLookupRef.current = ''
                        clearKey('docNumber')
                        clearKey('businessName')
                      }}
                      options={DOC_OPTIONS}
                    />
                  </div>
                  <Field
                    label={docType === 'RUC' ? 'Nº RUC' : 'Nº DNI'}
                    htmlFor="contact-doc"
                  >
                    <input
                      ref={docRef}
                      id="contact-doc"
                      inputMode="numeric"
                      maxLength={docType === 'RUC' ? 11 : 8}
                      placeholder={
                        docType === 'RUC' ? '20123456789' : '12345678'
                      }
                      value={docNumber}
                      aria-invalid={Boolean(errors.docNumber)}
                      onChange={(e) => {
                        const v = digitsOnly(e.target.value).slice(
                          0,
                          docType === 'RUC' ? 11 : 8,
                        )
                        setDocNumber(v)
                        lastLookupRef.current = ''
                        clearKey('docNumber')
                      }}
                      onBlur={() => {
                        if (isDocReady(docType, digitsOnly(docNumber))) {
                          void lookupDocument(docNumber, docType, {
                            silentIncomplete: true,
                          })
                        }
                      }}
                      className={cnField(inputClass, Boolean(errors.docNumber))}
                    />
                  </Field>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={lookupBusy}
                      aria-label={lookupBusy ? 'Buscando' : 'Buscar documento'}
                      title="Buscar"
                      onClick={() => void lookupDocument()}
                      className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-rosver-line bg-white text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red disabled:opacity-60"
                    >
                      <Search
                        size={20}
                        color="currentColor"
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                </div>

                {docType === 'RUC' ? (
                  <Field
                    label="Razón social (opcional)"
                    htmlFor="contact-business"
                  >
                    <input
                      id="contact-business"
                      type="text"
                      placeholder="Se completa al buscar el RUC"
                      value={businessName}
                      aria-invalid={Boolean(errors.businessName)}
                      onChange={(e) => {
                        setBusinessName(e.target.value)
                        clearKey('businessName')
                      }}
                      className={cnField(
                        inputClass,
                        Boolean(errors.businessName),
                      )}
                    />
                  </Field>
                ) : null}

                <Field
                  label={
                    docType === 'DNI' ? 'Nombre y apellidos' : 'Nombre de contacto'
                  }
                  htmlFor="contact-name"
                >
                  <input
                    ref={nameRef}
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder={
                      docType === 'DNI'
                        ? 'Se completa al buscar el DNI'
                        : 'Tu nombre'
                    }
                    value={name}
                    aria-invalid={Boolean(errors.name)}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearKey('name')
                    }}
                    className={cnField(inputClass, Boolean(errors.name))}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="WhatsApp / teléfono" htmlFor="contact-phone">
                    <input
                      ref={phoneRef}
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+51 999 999 999"
                      value={phone}
                      aria-invalid={Boolean(errors.phone)}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        clearKey('phone')
                        clearKey('email')
                      }}
                      className={cnField(inputClass, Boolean(errors.phone))}
                    />
                  </Field>
                  <Field label="Correo" htmlFor="contact-email">
                    <input
                      ref={emailRef}
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@empresa.com *"
                      value={email}
                      aria-invalid={Boolean(errors.email)}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        clearKey('email')
                        clearKey('phone')
                      }}
                      className={cnField(inputClass, Boolean(errors.email))}
                    />
                  </Field>
                </div>
                <Field label="¿En qué te ayudamos?" htmlFor="contact-message">
                  <textarea
                    ref={messageRef}
                    id="contact-message"
                    name="message"
                    rows={6}
                    maxLength={1000}
                    placeholder="Productos, cantidades, ciudad de entrega…"
                    value={message}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby="contact-message-count"
                    onChange={(e) => {
                      setMessage(e.target.value.slice(0, 1000))
                      clearKey('message')
                    }}
                    className={cnField(
                      `${inputClass} min-h-36 resize-y`,
                      Boolean(errors.message),
                    )}
                  />
                  <div
                    id="contact-message-count"
                    className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-rosver-muted"
                  >
                    <span>Mínimo 5 caracteres</span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        message.trim().length > 0 &&
                          message.trim().length < 5 &&
                          'text-rosver-blue',
                        message.length >= 950 && 'text-rosver-ink',
                        message.length >= 1000 && 'text-rosver-red',
                      )}
                    >
                      {message.length} / 1000
                    </span>
                  </div>
                </Field>
                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rosver-red px-7 py-3 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
                  >
                    Enviar mensaje
                    <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
                  </button>
                  <p className="text-xs text-rosver-muted sm:text-right">
                    También puedes{' '}
                    <Link
                      to="/cotizar"
                      className="font-bold text-rosver-ink underline-offset-2 hover:text-rosver-red hover:underline"
                    >
                      armar una cotización
                    </Link>
                    .
                  </p>
                </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </motion.div>

      <ContactFaq reduce={reduce} />
    </main>
  )
}

const inputClass =
  'min-h-12 w-full rounded-xl border border-rosver-line bg-rosver-soft/50 px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted/80 focus:border-rosver-red/35 focus:bg-white focus:ring-2 focus:ring-rosver-red/10'

const CONTACT_FAQS: { q: string; a: string }[] = [
  {
    q: '¿Venden al por mayor y al detalle?',
    a: 'Sí. Atendemos ferreterías, distribuidores y compras por volumen. En la ficha de cada producto verás precio de lista y, cuando aplica, precio por mayor.',
  },
  {
    q: '¿Cómo cotizo un pedido?',
    a: 'Puedes armar el carrito y continuar el pedido, usar la página Cotizar, o escribirnos por WhatsApp con el SKU y la cantidad. Te respondemos con disponibilidad y precios.',
  },
  {
    q: '¿Hacen envíos a provincia?',
    a: 'Despachamos a nivel nacional desde Lima. El costo y el plazo dependen del destino y del volumen; te lo confirmamos al cotizar.',
  },
  {
    q: '¿Dónde están ubicados?',
    a: `Estamos en ${ROSVER_COMPANY.localAddress}. Puedes abrir la ubicación en Google Maps desde el panel de contacto o el pie de página.`,
  },
  {
    q: '¿Qué horarios de atención tienen?',
    a: 'Atendemos de 9:00 a. m. a 8:00 p. m. WhatsApp suele responder más rápido para consultas de stock y precios.',
  },
  {
    q: '¿Cómo presento un reclamo o queja?',
    a: 'Usa el Libro de reclamaciones digital desde el pie de la web. Recibirás un código de constancia y te responderemos según la normativa peruana.',
  },
]

function ContactSubmitStage({
  phase,
  reduce,
  code,
}: {
  phase: 'sending' | 'sent'
  reduce: boolean
  code?: string | null
}) {
  const sending = phase === 'sending'
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="absolute inset-0 flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-rosver-line bg-gradient-to-b from-rosver-soft/80 to-white px-6 py-10 text-center"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: reduce ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {sending ? (
        <>
          <motion.span
            className="relative mb-5 inline-flex size-16 items-center justify-center"
            aria-hidden
          >
            <span className="absolute inset-0 rounded-full border-2 border-rosver-red/15" />
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-rosver-red border-r-rosver-red/40"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={
                reduce
                  ? undefined
                  : { duration: 0.85, repeat: Infinity, ease: 'linear' }
              }
            />
            <Message size={22} color="#E30613" strokeWidth={2} />
          </motion.span>
          <p className="font-display text-sm font-bold tracking-wide text-rosver-ink uppercase">
            Enviando mensaje
          </p>
          <p className="mt-2 max-w-xs text-sm text-rosver-muted">
            Estamos registrando tu solicitud…
          </p>
          <motion.div
            className="mt-5 flex gap-1.5"
            aria-hidden
            initial="hidden"
            animate="show"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-rosver-red"
                animate={
                  reduce
                    ? { opacity: 0.45 }
                    : { opacity: [0.25, 1, 0.25], y: [0, -3, 0] }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: 0.9,
                        repeat: Infinity,
                        delay: i * 0.16,
                        ease: 'easeInOut',
                      }
                }
              />
            ))}
          </motion.div>
        </>
      ) : (
        <>
          <motion.span
            className="mb-5 inline-flex size-16 items-center justify-center rounded-full bg-rosver-success text-white shadow-[0_12px_28px_-12px_rgba(16,185,129,0.7)]"
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: 420, damping: 22 }
            }
          >
            <Check size={28} color="#ffffff" strokeWidth={2.5} />
          </motion.span>
          <p className="font-display text-sm font-bold tracking-wide text-rosver-ink uppercase">
            Mensaje recibido
          </p>
          <p className="mt-2 max-w-sm text-sm text-rosver-muted">
            Gracias. Revisamos tu solicitud y te respondemos pronto.
          </p>
          {code ? (
            <p className="mt-3 font-mono text-xs font-semibold tracking-wider text-rosver-ink">
              {code}
            </p>
          ) : null}
          <p className="mt-4 text-[11px] text-rosver-muted">
            Volviendo al formulario…
          </p>
        </>
      )}
    </motion.div>
  )
}

function ContactFaq({ reduce }: { reduce: boolean }) {
  const [open, setOpen] = useState<number | null>(0)
  const panelsRef = useRef<(HTMLDivElement | null)[]>([])
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    CONTACT_FAQS.forEach((_, i) => {
      const el = panelsRef.current[i]
      if (!el) return
      gsap.killTweensOf(el)
      const isOpen = open === i
      if (reduce) {
        gsap.set(el, {
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
        })
        return
      }
      if (isOpen) {
        gsap.fromTo(
          el,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
            overflow: 'hidden',
          },
        )
      } else {
        gsap.to(el, {
          height: 0,
          opacity: 0,
          duration: 0.28,
          ease: 'power2.in',
          overflow: 'hidden',
        })
      }
    })
  }, [open, reduce])

  useEffect(() => {
    if (reduce || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-faq-item]')
    gsap.fromTo(
      items,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'transform',
      },
    )
  }, [reduce])

  return (
    <section
      className="px-1 py-6 sm:px-2 sm:py-8"
      aria-labelledby="contacto-faq-title"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-[11px] font-bold tracking-[0.18em] text-rosver-muted uppercase">
          Ayuda
        </p>
        <h2
          id="contacto-faq-title"
          className="mt-2 text-center font-display text-2xl font-bold tracking-tight text-rosver-ink uppercase sm:text-3xl"
        >
          Preguntas frecuentes
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-rosver-muted sm:text-[15px]">
          Resolvemos tus dudas principales para que des el siguiente paso con
          confianza. Horario de atención: 9:00 a. m. a 8:00 p. m.
        </p>

        <ul ref={listRef} className="mt-8 space-y-2.5">
          {CONTACT_FAQS.map((item, i) => {
            const isOpen = open === i
            const num = String(i + 1).padStart(2, '0')
            return (
              <li
                key={item.q}
                data-faq-item
                className={cn(
                  'overflow-hidden rounded-xl border bg-rosver-soft/40 transition',
                  isOpen
                    ? 'border-rosver-red/35 bg-white shadow-sm'
                    : 'border-rosver-line hover:border-rosver-red/25',
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left sm:gap-3.5 sm:px-4"
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
                      isOpen
                        ? 'bg-rosver-red text-white'
                        : 'bg-white text-rosver-muted',
                    )}
                  >
                    {num}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 text-sm font-semibold sm:text-[15px]',
                      isOpen ? 'text-rosver-red' : 'text-rosver-ink',
                    )}
                  >
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-lg font-medium leading-none transition',
                      isOpen
                        ? 'bg-rosver-red text-white'
                        : 'bg-white text-rosver-ink',
                    )}
                    aria-hidden
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <div
                  ref={(el) => {
                    panelsRef.current[i] = el
                  }}
                  className="overflow-hidden"
                  style={{ height: i === 0 && open === 0 ? 'auto' : 0 }}
                >
                  <p className="border-t border-rosver-line px-3.5 pb-4 pt-3 text-sm leading-relaxed text-rosver-muted sm:px-4 sm:pl-[3.25rem]">
                    {item.a}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function ContactHero({ reduce }: { reduce: boolean }) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border-[3px] border-rosver-ink bg-white">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[12%] max-sm:w-7"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, var(--color-rosver-red) 0 9px, #fff 9px 18px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[12%] max-sm:w-7"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-rosver-ink) 0 9px, var(--color-rosver-soft) 9px 18px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(13,13,13,0.14) 1.1px, transparent 1.2px)',
          backgroundSize: '15px 15px',
        }}
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex max-w-2xl flex-col items-center px-10 py-8 text-center sm:px-14 sm:py-10">
        <nav
          className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-rosver-muted"
          aria-label="Ruta"
        >
          <Link to="/" className="hover:text-rosver-red">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="text-rosver-ink">Contacto</span>
        </nav>

        <motion.span
          className="mb-3 inline-flex rotate-[-2deg] border-[3px] border-rosver-ink bg-rosver-yellow px-3 py-1 text-[11px] font-black tracking-widest text-rosver-ink uppercase shadow-[3px_3px_0_0_#0d0d0d]"
          initial={reduce ? false : { opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          Estamos para ayudarte
        </motion.span>

        <motion.h1
          className="rotate-[-1deg] border-[3px] border-rosver-ink bg-white px-5 py-3 font-display text-3xl font-bold tracking-tight text-rosver-ink uppercase shadow-[5px_5px_0_0_#0d0d0d] sm:text-4xl lg:text-5xl"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.05 }}
        >
          Contacto <span className="text-rosver-red">Rosver</span>
        </motion.h1>

        <motion.p
          className="mt-4 max-w-md text-sm text-rosver-muted sm:text-base"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          Formulario o WhatsApp — ambos llegan al mismo equipo comercial.
        </motion.p>
      </div>
    </section>
  )
}

/** Mapa compacto en el panel (reemplaza los cuadritos decorativos). */
function AsideMap() {
  const co = ROSVER_COMPANY
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-white/15 bg-black/30">
      <iframe
        title={`Mapa — ${co.localAddress}`}
        src={co.mapsEmbedUrl}
        className="block h-40 w-full border-0 sm:h-44"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
        <p className="truncate text-[11px] font-semibold text-white/70">
          {co.localAddress}
        </p>
        <a
          href={co.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-bold text-rosver-red hover:underline"
        >
          Maps →
        </a>
      </div>
    </div>
  )
}

function AsideFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-white/50 uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </li>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5 text-sm">
      <span className="font-bold text-rosver-ink">{label}</span>
      {children}
    </label>
  )
}
