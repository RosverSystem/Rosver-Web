import { useAuth } from '@/features/auth'
import { useCart, isComboLine, type CartLine } from '@/features/cart'
import { useCatalog, type Product } from '@/features/catalog'
import { cnField, isValidPhone } from '@/shared/lib'
import { api, ApiError } from '@/shared/lib/api'
import { attachNestedScrollWheel } from '@/shared/lib/nested-scroll-wheel'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { SelectCombobox } from '@/shared/ui/select-combobox'
import {
  emptyUbigeo,
  type UbigeoValue,
} from '@/shared/ui/peru-ubigeo-fields'
import { PeruAddressSuggest } from '@/shared/ui/peru-address-suggest'
import { IconWhatsApp } from '@/shared/ui/icons'
import { QuoteShareModal } from './QuoteShareModal'
import {
  ArrowRight,
  Check,
  Clock,
  Message,
  Phone,
  Search,
  Trash,
} from 'cssvg-icons'
import { motion } from 'motion/react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

/** TC referencial mock (fase visual). */
const TC_REFERENCIAL = 3.75

const PRESENTATIONS = [
  { id: 'und', label: 'UND' },
  { id: 'docena', label: 'DOCENA (12)' },
  { id: 'cajon', label: 'CAJÓN / FARDO' },
] as const

type PresentationId = (typeof PRESENTATIONS)[number]['id']

type QuoteLine = {
  id: string
  productSlug: string | null
  presentation: PresentationId
  quantity: number
  lineKind?: 'product' | 'combo'
  comboId?: string
  comboName?: string
  comboSku?: string
  comboImageUrl?: string
  unitPrice?: number | null
  comboSnapshot?: CartLine['comboSnapshot']
  comboItems?: CartLine['comboItems']
}

type BusinessForm = {
  name: string
  document: string
  phone: string
  shipAddress: string
  ship: UbigeoValue
  agencyName: string
}

type FieldKey =
  | 'name'
  | 'phone'
  | 'items'
  | 'shipAddress'
  | 'shipUbigeo'
  | 'agencyName'

const BENEFITS = [
  {
    icon: Clock,
    title: 'Respuesta en 24 h',
    body: 'Comercial revisa tu pedido y te responde en horario hábil.',
  },
  {
    icon: Message,
    title: 'Sin cuenta obligatoria',
    body: 'Cotiza como visitante; luego puedes registrarte si quieres.',
  },
  {
    icon: Phone,
    title: 'Asesoría técnica',
    body: 'Te ayudamos a elegir el producto correcto para tu rubro.',
  },
] as const

function newLineId() {
  return `ql-${Math.random().toString(36).slice(2, 10)}`
}

function linesFromCart(cartLines: CartLine[]): QuoteLine[] {
  if (cartLines.length === 0) return []
  return cartLines.map((line) => {
    if (isComboLine(line)) {
      return {
        id: newLineId(),
        productSlug: line.productSlug,
        presentation: 'und' as const,
        quantity: line.quantity,
        lineKind: 'combo',
        comboId: line.comboId,
        comboName: line.comboName,
        comboSku: line.comboSku,
        comboImageUrl: line.comboImageUrl,
        unitPrice: line.unitPrice,
        comboSnapshot: line.comboSnapshot,
        comboItems: line.comboItems,
      }
    }
    return {
      id: newLineId(),
      productSlug: line.productSlug,
      presentation: 'und' as const,
      quantity: line.quantity,
      lineKind: 'product',
      unitPrice: line.unitPrice,
    }
  })
}

/**
 * Cotización estilo marketplace: datos negocio + ítems (carrito o buscador) + CTAs.
 */
export function QuoteRequestPage() {
  const reduce = prefersReducedMotion()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const quoteRef = searchParams.get('ref')?.trim() || null
  const { user } = useAuth()
  const { lines: cartLines, replaceAll, itemCount } = useCart()
  const { products } = useCatalog()

  const [business, setBusiness] = useState<BusinessForm>({
    name: '',
    document: '',
    phone: '',
    shipAddress: '',
    ship: emptyUbigeo(),
    agencyName: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  )
  const [submitBusy, setSubmitBusy] = useState(false)
  const { toasts, showErrors, showSuccess, dismiss, clear } = useFormToasts()
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>(() =>
    linesFromCart(cartLines),
  )
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePdfUrl, setSharePdfUrl] = useState<string | null>(null)
  const [shareMeta, setShareMeta] = useState<{
    code: string
    shareUrl: string
    businessName: string
    fileName: string
    linkDays: number
    linkExpiresAt: string | null
  } | null>(null)

  useEffect(() => {
    return () => {
      if (sharePdfUrl) URL.revokeObjectURL(sharePdfUrl)
    }
  }, [sharePdfUrl])

  useEffect(() => {
    if (!user) return
    setBusiness((prev) => ({
      ...prev,
      name:
        prev.name ||
        user.companyName ||
        user.fullName ||
        '',
      document: prev.document || user.documentNumber || '',
      phone: prev.phone || user.phone || '',
    }))
  }, [user])

  const resolved = useMemo(
    () =>
      quoteLines.map((line) => {
        if (line.lineKind === 'combo') {
          return { ...line, product: null as Product | null }
        }
        const product = line.productSlug
          ? products.find((p) => p.slug === line.productSlug) ?? null
          : null
        return { ...line, product }
      }),
    [quoteLines, products],
  )

  const total = useMemo(
    () =>
      resolved.reduce((sum, line) => {
        if (line.lineKind === 'combo') {
          const u = line.unitPrice
          if (u == null) return sum
          return sum + u * line.quantity
        }
        if (!line.product?.price && line.unitPrice == null) return sum
        const u = line.unitPrice ?? line.product?.price ?? 0
        return sum + u * line.quantity
      }, 0),
    [resolved],
  )

  const catalogCount = quoteLines.filter(
    (l) => l.lineKind === 'combo' || l.productSlug,
  ).length

  function clearField(key: FieldKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function updateLine(id: string, patch: Partial<QuoteLine>) {
    setQuoteLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    )
  }

  function removeLine(id: string) {
    setQuoteLines((prev) => prev.filter((line) => line.id !== id))
  }

  function addProduct(product: Product) {
    setQuoteLines((prev) => {
      const existing = prev.find(
        (l) =>
          l.lineKind !== 'combo' && l.productSlug === product.slug,
      )
      if (existing) {
        return prev.map((l) =>
          l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      const empty = prev.find((l) => !l.productSlug && l.lineKind !== 'combo')
      if (empty) {
        return prev.map((l) =>
          l.id === empty.id
            ? {
                ...l,
                productSlug: product.slug,
                lineKind: 'product',
              }
            : l,
        )
      }
      return [
        ...prev,
        {
          id: newLineId(),
          productSlug: product.slug,
          presentation: 'und',
          quantity: 1,
          lineKind: 'product',
        },
      ]
    })
  }

  function pushToCart() {
    const next: CartLine[] = []
    for (const l of quoteLines) {
      if (l.lineKind === 'combo' && l.comboId) {
        next.push({
          lineKind: 'combo',
          productSlug: l.productSlug || l.comboId,
          quantity: Math.max(1, l.quantity),
          unitPrice: l.unitPrice,
          comboId: l.comboId,
          comboName: l.comboName,
          comboSku: l.comboSku,
          comboImageUrl: l.comboImageUrl,
          comboItems: l.comboItems,
          comboSnapshot: l.comboSnapshot,
        })
        continue
      }
      if (!l.productSlug) continue
      next.push({
        lineKind: 'product',
        productSlug: l.productSlug,
        quantity: Math.max(1, l.quantity),
        unitPrice: l.unitPrice,
      })
    }
    replaceAll(next)
    navigate('/carrito')
  }

  function validate(): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {}
    if (!business.name.trim()) {
      next.name = 'Indica el nombre o razón social.'
    }
    if (!business.phone.trim()) {
      next.phone = 'El teléfono o WhatsApp es obligatorio.'
    } else if (!isValidPhone(business.phone)) {
      next.phone = 'Ingresa un número válido (mínimo 9 dígitos).'
    }
    if (
      !business.ship.departmentCode ||
      !business.ship.provinceCode ||
      !business.ship.districtCode
    ) {
      next.shipUbigeo = 'Elige departamento, provincia y distrito de entrega.'
    }
    if (!business.shipAddress.trim() || business.shipAddress.trim().length < 5) {
      next.shipAddress = 'Escribe la dirección completa (mín. 5 caracteres).'
    }
    if (!business.agencyName.trim()) {
      next.agencyName = 'Indica el nombre de la agencia de transporte.'
    }
    if (catalogCount === 0) {
      next.items = 'Agrega al menos un producto del catálogo.'
    }
    return next
  }

  async function handleSendWhatsApp() {
    const next = validate()
    setFieldErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, [
        'name',
        'phone',
        'shipUbigeo',
        'shipAddress',
        'agencyName',
        'items',
      ])
      return
    }
    clear()
    setSubmitBusy(true)
    try {
      const items = resolved
        .filter((l) => l.lineKind === 'combo' || l.product)
        .map((l) => {
          if (l.lineKind === 'combo') {
            return {
              lineKind: 'combo' as const,
              productSlug: l.productSlug || l.comboId || 'combo',
              productName: l.comboName || 'Combo',
              presentation: 'Combo',
              quantity: l.quantity,
              unitPrice: l.unitPrice ?? null,
              comboId: l.comboId,
              comboSnapshot: l.comboSnapshot,
            }
          }
          return {
            lineKind: 'product' as const,
            productSlug: l.product!.slug,
            productName: l.product!.name,
            presentation:
              PRESENTATIONS.find((p) => p.id === l.presentation)?.label ??
              'UND',
            quantity: l.quantity,
            unitPrice: l.unitPrice ?? l.product!.price ?? null,
          }
        })

      const data = await api<{
        id: string
        code: string
        shareUrl: string
        publicSlug: string
        linkDays: number
        linkExpiresAt: string
      }>('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          businessName: business.name.trim(),
          documentNumber: business.document.trim() || null,
          phone: business.phone.trim(),
          shipAddress: business.shipAddress.trim(),
          ship: {
            departmentCode: business.ship.departmentCode,
            provinceCode: business.ship.provinceCode,
            districtCode: business.ship.districtCode,
          },
          agencyName: business.agencyName.trim(),
          items,
          totalEstimated: total > 0 ? Number(total.toFixed(2)) : null,
        }),
      })

      const { buildQuotePdf } = await import('@/features/cart/lib/quote-pdf')
      const pdf = await buildQuotePdf({
        customer: {
          name: business.name.trim(),
          document: business.document.trim(),
          phone: business.phone.trim(),
          city: [
            business.ship.districtName,
            business.ship.provinceName,
            business.ship.departmentName,
          ]
            .filter(Boolean)
            .join(', '),
        },
        lines: items.map((it) => ({
          quantity: it.quantity,
          unit: it.presentation,
          description: it.productName,
          sku: it.productSlug,
          unitPrice: it.unitPrice ?? null,
        })),
        docNumber: data.code,
        shareUrl: data.shareUrl,
        kind: 'quote',
      })

      const buf = await pdf.blob.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
      const pdfBase64 = btoa(binary)

      await api(`/api/quotes/${data.id}/pdf`, {
        method: 'PUT',
        body: JSON.stringify({ pdfBase64 }),
      })

      if (sharePdfUrl) URL.revokeObjectURL(sharePdfUrl)
      const url = URL.createObjectURL(pdf.blob)
      setSharePdfUrl(url)
      setShareMeta({
        code: data.code,
        shareUrl: data.shareUrl,
        businessName: business.name.trim(),
        fileName: pdf.fileName,
        linkDays: data.linkDays,
        linkExpiresAt: data.linkExpiresAt,
      })
      setShareOpen(true)
      setStatus('sent')
      showSuccess([
        `Cotización ${data.code} guardada.`,
        `Link temporal ${data.linkDays} días listo.`,
      ])
    } catch (err) {
      showErrors({
        items:
          err instanceof ApiError
            ? err.message
            : 'No se pudo guardar la cotización. Intenta de nuevo.',
      })
    } finally {
      setSubmitBusy(false)
    }
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-6 overflow-x-hidden px-4 pb-28 lg:px-6">
      <FloatingToasts
        toasts={toasts}
        onDismiss={dismiss}
        reduceMotion={reduce}
      />

      <div className="pt-4 sm:pt-6">
        <QuoteBanner reduce={reduce} fromCart={itemCount > 0} />
      </div>

      {quoteRef ? (
        <p className="rounded-xl border border-rosver-red/25 bg-rosver-red/5 px-4 py-3 text-sm text-rosver-ink">
          Abriste el QR de la cotización{' '}
          <span className="font-bold text-rosver-red">{quoteRef}</span>. Completa
          o actualiza tu lista aquí y escríbenos con esa referencia.
        </p>
      ) : null}

      {status === 'sent' ? (
        <motion.div
          className="flex flex-col items-start gap-3 rounded-2xl border border-rosver-success/30 bg-rosver-success/10 px-5 py-6"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-rosver-success text-white">
            <Check size={20} color="#ffffff" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-rosver-ink uppercase">
              Solicitud lista
            </p>
            <p className="mt-1 text-sm text-rosver-muted">
              Si abriste WhatsApp, comercial ya puede atenderte. También puedes
              ajustar la lista y volver a enviar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-sm font-bold text-rosver-ink underline-offset-2 hover:underline"
          >
            Seguir editando
          </button>
        </motion.div>
      ) : null}

      {/* Datos de negocio */}
      <section className="rounded-2xl border border-rosver-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(17,17,17,0.4)] sm:p-6">
        <h2 className="font-display text-sm font-bold tracking-wide text-rosver-ink uppercase sm:text-base">
          Datos de tu negocio o razón social
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre / Razón social *" htmlFor="q-name">
            <input
              id="q-name"
              value={business.name}
              onChange={(e) => {
                setBusiness((b) => ({ ...b, name: e.target.value }))
                clearField('name')
              }}
              placeholder="Tu empresa"
              className={cnField(inputClass, Boolean(fieldErrors.name))}
              autoComplete="organization"
              aria-invalid={Boolean(fieldErrors.name)}
            />
          </Field>
          <Field label="RUC o DNI" htmlFor="q-doc">
            <input
              id="q-doc"
              value={business.document}
              onChange={(e) =>
                setBusiness((b) => ({ ...b, document: e.target.value }))
              }
              placeholder="20123456789"
              className={inputClass}
            />
          </Field>
          <Field label="Teléfono o WhatsApp *" htmlFor="q-phone">
            <input
              id="q-phone"
              type="tel"
              value={business.phone}
              onChange={(e) => {
                setBusiness((b) => ({ ...b, phone: e.target.value }))
                clearField('phone')
              }}
              placeholder="+51 999 999 999"
              className={cnField(inputClass, Boolean(fieldErrors.phone))}
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-rosver-line pt-5">
          <PeruAddressSuggest
            id="q-ship-address"
            address={business.shipAddress}
            ubigeo={business.ship}
            invalidAddress={Boolean(fieldErrors.shipAddress)}
            invalidUbigeo={Boolean(fieldErrors.shipUbigeo)}
            onAddressChange={(shipAddress) => {
              setBusiness((b) => ({ ...b, shipAddress }))
              clearField('shipAddress')
            }}
            onUbigeoChange={(ship) => {
              setBusiness((b) => ({ ...b, ship }))
              clearField('shipUbigeo')
            }}
          />
        </div>

        <div className="mt-6 border-t border-rosver-line pt-5">
          <Field label="Agencia de transporte *" htmlFor="q-agency-name">
            <input
              id="q-agency-name"
              value={business.agencyName}
              onChange={(e) => {
                setBusiness((b) => ({ ...b, agencyName: e.target.value }))
                clearField('agencyName')
              }}
              placeholder="Ej. Shalom, Marvisur, Olva…"
              className={cnField(
                inputClass,
                Boolean(fieldErrors.agencyName),
              )}
              aria-invalid={Boolean(fieldErrors.agencyName)}
            />
          </Field>
        </div>
      </section>

      {/* Productos */}
      <section className="rounded-2xl border border-rosver-line bg-white shadow-[0_12px_32px_-24px_rgba(17,17,17,0.4)]">
        <div className="border-b border-rosver-line px-4 py-3.5 sm:px-5">
          <h2 className="font-display text-sm font-bold tracking-wide text-rosver-ink uppercase sm:text-base">
            Productos del catálogo
            {catalogCount > 0 ? ` (${catalogCount})` : ''}
          </h2>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            {itemCount > 0 && catalogCount > 0 ? (
              <p className="rounded-xl bg-rosver-soft/80 px-3 py-2 text-xs font-medium text-rosver-muted">
                Trajimos {catalogCount} ítem
                {catalogCount === 1 ? '' : 's'} de tu carrito. Puedes editar,
                quitar o agregar más.
              </p>
            ) : null}

            <ProductSearcher onPick={addProduct} />

            {quoteLines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rosver-line px-4 py-8 text-center">
                <p className="text-sm font-semibold text-rosver-ink">
                  Carrito vacío
                </p>
                <p className="mt-1 text-sm text-rosver-muted">
                  Busca arriba y agrega productos a tu cotización.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {resolved.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-col gap-2 rounded-xl border border-rosver-line bg-rosver-soft/30 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-rosver-ink">
                        {line.lineKind === 'combo'
                          ? `Combo · ${line.comboName || 'Pack'}`
                          : line.product
                            ? `[ROSVER] ${line.product.name}`
                            : 'Producto sin seleccionar'}
                      </p>
                      {line.lineKind === 'combo' ? (
                        <p className="text-xs text-rosver-muted">
                          {line.unitPrice != null
                            ? `S/ ${line.unitPrice.toFixed(2)} c/u · pack`
                            : 'Consultar'}
                          {line.comboItems?.length
                            ? ` · ${line.comboItems.map((n) => `${n.quantity}× ${n.productName}`).join(', ')}`
                            : ''}
                        </p>
                      ) : line.product?.price != null ||
                        line.unitPrice != null ? (
                        <p className="text-xs text-rosver-muted">
                          S/{' '}
                          {(
                            line.unitPrice ??
                            line.product?.price ??
                            0
                          ).toFixed(2)}{' '}
                          c/u
                        </p>
                      ) : line.product ? (
                        <p className="text-xs text-rosver-muted">Consultar</p>
                      ) : null}
                    </div>

                    {line.lineKind === 'combo' ? (
                      <span className="rounded-lg bg-rosver-yellow px-2 py-1 text-[10px] font-black text-rosver-ink uppercase sm:min-w-[10.5rem] sm:text-center">
                        Combo
                      </span>
                    ) : (
                      <>
                        <label className="sr-only" htmlFor={`pres-${line.id}`}>
                          Presentación
                        </label>
                        <SelectCombobox
                          id={`pres-${line.id}`}
                          size="sm"
                          className="sm:min-w-[10.5rem] sm:max-w-[12rem]"
                          value={line.presentation}
                          options={PRESENTATIONS.map((p) => ({
                            value: p.id,
                            label: p.label,
                          }))}
                          onValueChange={(v) =>
                            updateLine(line.id, {
                              presentation: v as PresentationId,
                            })
                          }
                          aria-label="Presentación"
                        />
                      </>
                    )}

                    <label className="sr-only" htmlFor={`qty-${line.id}`}>
                      Cantidad
                    </label>
                    <input
                      id={`qty-${line.id}`}
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity: Math.max(
                            1,
                            Number.parseInt(e.target.value, 10) || 1,
                          ),
                        })
                      }
                      className="min-h-10 w-20 rounded-lg border border-rosver-line bg-white px-2 text-center text-sm font-semibold text-rosver-ink"
                    />

                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-rosver-muted transition hover:bg-white hover:text-rosver-red"
                      aria-label="Quitar producto"
                    >
                      <Trash size={18} color="currentColor" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rosver-line bg-rosver-soft/70 px-4 py-3 sm:px-5">
          <div>
            <p className="font-display text-xs font-bold tracking-wide text-rosver-ink uppercase sm:text-sm">
              Monto total estimado
            </p>
            <p className="text-[11px] text-rosver-muted">
              TC ref. {TC_REFERENCIAL.toFixed(2)} · precios sujetos a
              confirmación
            </p>
          </div>
          <p className="font-display text-xl font-bold text-rosver-ink sm:text-2xl">
            S/ {total.toFixed(2)}
          </p>
        </div>
      </section>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void handleSendWhatsApp()}
          disabled={submitBusy}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-[#20bd5a] disabled:opacity-60"
        >
          <IconWhatsApp className="size-5" />
          {submitBusy ? 'Preparando PDF…' : 'Enviar cotización a WhatsApp'}
        </button>
        <button
          type="button"
          onClick={pushToCart}
          disabled={catalogCount === 0}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-rosver-ink px-5 py-3 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-rosver-red disabled:cursor-not-allowed disabled:opacity-40"
        >
          Pasar lista a carrito
          <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
        </button>
      </div>

      {/* Beneficios abajo */}
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_28px_-22px_rgba(17,17,17,0.4)]"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rosver-red/10 text-rosver-red">
                <Icon size={20} color="currentColor" strokeWidth={2} />
              </span>
              <div>
                <p className="font-display text-xs font-bold tracking-wide text-rosver-ink uppercase sm:text-sm">
                  {title}
                </p>
                <p className="mt-1 text-sm text-rosver-muted">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-[3px] border-rosver-ink bg-rosver-soft p-5 shadow-[4px_4px_0_0_var(--color-rosver-red)]">
        <p className="font-display text-sm font-bold text-rosver-ink uppercase">
          ¿Ya tienes el carrito armado?
        </p>
        <p className="mt-1.5 text-sm text-rosver-muted">
          Revisa tu carrito y pide cotización con los ítems listos. Respuesta en
          24 h · TC referencial {TC_REFERENCIAL.toFixed(2)}.
        </p>
        <Link
          to="/carrito"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rosver-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-rosver-red"
        >
          Ir al carrito
          <ArrowRight size={14} color="#ffffff" strokeWidth={2} />
        </Link>
      </div>

      <QuoteShareModal
        open={shareOpen && Boolean(shareMeta)}
        onClose={() => setShareOpen(false)}
        pdfBlobUrl={sharePdfUrl}
        fileName={shareMeta?.fileName ?? 'cotizacion.pdf'}
        code={shareMeta?.code ?? ''}
        shareUrl={shareMeta?.shareUrl ?? ''}
        businessName={shareMeta?.businessName ?? ''}
        linkDays={shareMeta?.linkDays ?? 15}
        linkExpiresAt={shareMeta?.linkExpiresAt}
        kind="quote"
      />
    </main>
  )
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-rosver-line bg-rosver-soft/40 px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition focus:border-rosver-red/45 focus:bg-white'

function ProductSearcher({ onPick }: { onPick: (p: Product) => void }) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const { products } = useCatalog()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return products.slice(0, 6)
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.vendor?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 8)
  }, [query, products])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    return attachNestedScrollWheel(el)
  }, [open, results.length])

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={listId} className="sr-only">
        Buscar producto del catálogo
      </label>
      <div className="flex overflow-hidden rounded-xl border border-rosver-line bg-white focus-within:border-rosver-red/45">
        <span className="flex items-center pl-3 text-rosver-muted">
          <Search size={18} color="currentColor" strokeWidth={2} />
        </span>
        <input
          id={listId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar producto (nombre, SKU, marca)…"
          className="min-h-11 w-full bg-transparent px-3 py-2.5 text-sm outline-none"
          autoComplete="off"
        />
      </div>
      {open ? (
        <ul
          ref={listRef}
          data-lenis-prevent
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-xl border border-rosver-line bg-white py-1 shadow-[0_16px_40px_-20px_rgba(17,17,17,0.35)]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-rosver-muted">
              Sin coincidencias
            </li>
          ) : (
            results.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-rosver-soft"
                  onClick={() => {
                    onPick(p)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-rosver-ink">
                      {p.name}
                    </span>
                    <span className="block text-xs text-rosver-muted">
                      {p.sku} · {p.vendor}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-rosver-red">
                    {p.price != null ? `S/ ${p.price.toFixed(0)}` : 'Consultar'}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

function QuoteBanner({
  reduce,
  fromCart,
}: {
  reduce: boolean
  fromCart: boolean
}) {
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
            'radial-gradient(circle, rgba(17,17,17,0.14) 1.1px, transparent 1.2px)',
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
          <span className="text-rosver-ink">Cotizar</span>
        </nav>

        <motion.h1
          className="rotate-[-1deg] border-[3px] border-rosver-ink bg-white px-5 py-3 font-display text-3xl font-bold tracking-tight text-rosver-ink uppercase shadow-[5px_5px_0_0_#111] sm:text-4xl"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          Solicitar{' '}
          <span className="text-rosver-red">cotización</span>
        </motion.h1>

        <p className="mt-4 max-w-md text-sm text-rosver-muted">
          {fromCart
            ? 'Tienes productos en el carrito — ya los cargamos en la lista.'
            : 'Busca en el catálogo o pega tu lista. Sin cuenta obligatoria.'}
        </p>
      </div>
    </section>
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
