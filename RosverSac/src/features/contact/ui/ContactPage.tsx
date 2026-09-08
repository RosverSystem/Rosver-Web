import { WHATSAPP_DISPLAY, WHATSAPP_LINK } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { cnField } from '@/shared/lib'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconWhatsApp } from '@/shared/ui/icons'
import { ArrowRight, Check, Compass, Message, Phone } from 'cssvg-icons'
import { motion } from 'motion/react'
import { type FormEvent, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type FieldKey = 'name' | 'channel' | 'message'
type FieldErrors = Partial<Record<FieldKey, string>>

/**
 * Contacto — hero de marca + panel ink / form (toasts flotantes).
 */
export function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const reduce = prefersReducedMotion()
  const { toasts, showErrors, dismiss, clear } = useFormToasts()

  const nameRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  function clearKey(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!name.trim()) next.name = 'Completa tu nombre o empresa.'
    if (!channel.trim()) next.channel = 'Indica teléfono o correo de contacto.'
    if (!message.trim()) next.message = 'Cuéntanos en qué te ayudamos.'
    return next
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['name', 'channel', 'message'])
      if (next.name) nameRef.current?.focus()
      else if (next.channel) channelRef.current?.focus()
      else messageRef.current?.focus()
      return
    }
    clear()
    setStatus('sent')
  }

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

              <BrandVisual />

              <ul className="mt-6 space-y-3">
                <AsideFact
                  icon={<Phone size={16} color="currentColor" strokeWidth={2} />}
                  label="WhatsApp"
                  value={WHATSAPP_DISPLAY}
                />
                <AsideFact
                  icon={<Message size={16} color="currentColor" strokeWidth={2} />}
                  label="Respuesta"
                  value="< 24 h hábiles"
                />
                <AsideFact
                  icon={<Compass size={16} color="currentColor" strokeWidth={2} />}
                  label="Cobertura"
                  value="Lima · envíos a todo el Perú"
                />
              </ul>

              <div className="mt-auto flex flex-col gap-2.5 pt-7">
                <a
                  href={WHATSAPP_LINK}
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
              <span className="hidden rounded-full bg-rosver-soft px-3 py-1 text-[11px] font-bold text-rosver-muted sm:inline">
                Sin cuenta
              </span>
            </div>
            <p className="mt-2 text-sm text-rosver-muted">
              Completa los datos — comercial te responde por el canal que
              indiques.
            </p>

            {status === 'sent' ? (
              <div className="mt-7 flex flex-col items-start gap-3 rounded-2xl border border-rosver-line bg-rosver-soft/70 px-5 py-6">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-rosver-success text-white">
                  <Check size={20} color="#ffffff" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-rosver-ink uppercase">
                    Mensaje enviado
                  </p>
                  <p className="mt-1 text-sm text-rosver-muted">
                    Gracias. Te contactamos pronto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-sm font-bold text-rosver-red underline-offset-2 hover:underline"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="mt-6 flex flex-col gap-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre" htmlFor="contact-name">
                    <input
                      ref={nameRef}
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Tu nombre o empresa"
                      value={name}
                      aria-invalid={Boolean(errors.name)}
                      onChange={(e) => {
                        setName(e.target.value)
                        clearKey('name')
                      }}
                      className={cnField(inputClass, Boolean(errors.name))}
                    />
                  </Field>
                  <Field label="Teléfono o correo" htmlFor="contact-channel">
                    <input
                      ref={channelRef}
                      id="contact-channel"
                      name="channel"
                      type="text"
                      autoComplete="email"
                      placeholder="+51 999 999 999 o correo@"
                      value={channel}
                      aria-invalid={Boolean(errors.channel)}
                      onChange={(e) => {
                        setChannel(e.target.value)
                        clearKey('channel')
                      }}
                      className={cnField(inputClass, Boolean(errors.channel))}
                    />
                  </Field>
                </div>
                <Field label="¿En qué te ayudamos?" htmlFor="contact-message">
                  <textarea
                    ref={messageRef}
                    id="contact-message"
                    name="message"
                    rows={6}
                    placeholder="Productos, cantidades, ciudad de entrega…"
                    value={message}
                    aria-invalid={Boolean(errors.message)}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      clearKey('message')
                    }}
                    className={cnField(
                      `${inputClass} min-h-36 resize-y`,
                      Boolean(errors.message),
                    )}
                  />
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
              </form>
            )}
          </section>
        </div>
      </motion.div>
    </main>
  )
}

const inputClass =
  'min-h-12 w-full rounded-xl border border-rosver-line bg-rosver-soft/50 px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted/80 focus:border-rosver-red/35 focus:bg-white focus:ring-2 focus:ring-rosver-red/10'

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

/** Bloque visual liviano (CSS) — “combo / pedido” sin bitmap. */
function BrandVisual() {
  return (
    <div
      className="mt-6 grid grid-cols-3 gap-2"
      aria-hidden
    >
      <div className="aspect-[4/3] rounded-lg border border-white/15 bg-white/10" />
      <div className="aspect-[4/3] rounded-lg border border-rosver-red/50 bg-rosver-red/80" />
      <div className="aspect-[4/3] rounded-lg border border-white/15 bg-white/5" />
      <div className="col-span-2 flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-2">
        <p className="text-[11px] font-bold tracking-wide text-white/80 uppercase">
          Importación · mayoreo · stock
        </p>
      </div>
      <div className="rounded-lg border border-white/15 bg-gradient-to-br from-rosver-red to-rosver-red-dark" />
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
  value: string
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
