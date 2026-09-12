import { useAuth } from '@/features/auth'
import {
  cartLinesToOrderItems,
  createLocalOrderFromCart,
  saveLocalOrder,
} from '@/features/account/model/local-orders'
import { useCatalog } from '@/features/catalog'
import { useCart } from '@/features/cart'
import type { QuotePdfLine } from '@/features/cart/lib/quote-pdf'
import {
  cartLineToApiItem,
  unitPriceOfLine,
} from '@/features/cart/model/cart-line'
import { isComboLine } from '@/features/cart/model/mocks'
import { QuoteShareModal } from '@/features/quotes'
import { api, ApiError } from '@/shared/lib/api'
import { cn, cnField, isValidPhone } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconWhatsApp } from '@/shared/ui/icons'
import { PeruAddressSuggest } from '@/shared/ui/peru-address-suggest'
import {
  emptyUbigeo,
  type UbigeoValue,
} from '@/shared/ui/peru-ubigeo-fields'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

type ShareMeta = {
  code: string
  shareUrl: string
  businessName: string
  fileName: string
  linkDays: number
  linkExpiresAt: string
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

/**
 * Continuar pedido (carrito): destino + agencia + PDF + link 15 días.
 * Distinto de `/cotizar` (cotización).
 */
export function ContinueOrderModal({ open, onClose }: Props) {
  const { products } = useCatalog()
  const { lines } = useCart()
  const { user } = useAuth()
  const { toasts, showSuccess, showErrors, dismiss, clear } = useFormToasts()

  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [phone, setPhone] = useState('')
  const [shipAddress, setShipAddress] = useState('')
  const [ship, setShip] = useState<UbigeoValue>(() => emptyUbigeo())
  const [agencyName, setAgencyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePdfUrl, setSharePdfUrl] = useState<string | null>(null)
  const [shareMeta, setShareMeta] = useState<ShareMeta | null>(null)
  const [invalid, setInvalid] = useState<{
    name?: boolean
    phone?: boolean
    shipAddress?: boolean
    shipUbigeo?: boolean
    agencyName?: boolean
  }>({})

  useEffect(() => {
    if (!open) return
    const prev = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !shareOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, shareOpen])

  useEffect(() => {
    if (!open) return
    if (!user) return
    setName((prev) => prev || user.companyName || user.fullName || '')
    setTaxId((prev) => prev || user.documentNumber || '')
    setPhone((prev) => prev || user.phone || '')
  }, [open, user])

  useEffect(() => {
    return () => {
      if (sharePdfUrl) URL.revokeObjectURL(sharePdfUrl)
    }
  }, [sharePdfUrl])

  const resolved = useMemo(() => {
    return lines
      .map((line) => {
        if (isComboLine(line)) {
          return { line, product: null as null }
        }
        const product = products.find((p) => p.slug === line.productSlug)
        if (!product) return null
        return { line, product }
      })
      .filter(
        (
          x,
        ): x is {
          line: (typeof lines)[0]
          product: (typeof products)[0] | null
        } => Boolean(x),
      )
  }, [lines, products])

  const pdfLines: QuotePdfLine[] = useMemo(
    () =>
      resolved.map(({ line, product }) => {
        if (isComboLine(line)) {
          const detail = (line.comboItems ?? [])
            .map((n) => `${n.quantity}× ${n.productName}`)
            .join('; ')
          return {
            quantity: line.quantity,
            unit: 'COMBO',
            description: detail
              ? `${line.comboName || 'Combo'} (${detail})`
              : line.comboName || 'Combo',
            sku: line.comboSku || line.productSlug,
            unitPrice: unitPriceOfLine(line),
          }
        }
        return {
          quantity: line.quantity,
          unit: line.packagingLabel?.slice(0, 12) || 'UND',
          description: product!.name,
          sku: product!.sku,
          unitPrice: unitPriceOfLine(line, product),
        }
      }),
    [resolved],
  )

  const total = useMemo(
    () =>
      pdfLines.reduce((sum, l) => {
        if (l.unitPrice == null) return sum
        return sum + l.unitPrice * l.quantity
      }, 0),
    [pdfLines],
  )

  function validate() {
    const errors: string[] = []
    const nextInvalid: typeof invalid = {}
    if (!name.trim()) {
      errors.push('Indica el nombre o razón social')
      nextInvalid.name = true
    }
    if (!phone.trim()) {
      errors.push('El teléfono o WhatsApp es obligatorio')
      nextInvalid.phone = true
    } else if (!isValidPhone(phone)) {
      errors.push('Ingresa un número válido (mínimo 9 dígitos)')
      nextInvalid.phone = true
    }
    if (!shipAddress.trim() || shipAddress.trim().length < 5) {
      errors.push('Escribe la dirección de destino (mín. 5 caracteres)')
      nextInvalid.shipAddress = true
    }
    if (
      !ship.departmentCode ||
      !ship.provinceCode ||
      !ship.districtCode
    ) {
      errors.push('Elige departamento, provincia y distrito')
      nextInvalid.shipUbigeo = true
    }
    if (!agencyName.trim()) {
      errors.push('Indica el nombre de la agencia de transporte')
      nextInvalid.agencyName = true
    }
    if (pdfLines.length === 0) {
      errors.push('El carrito no tiene productos válidos')
    }
    setInvalid(nextInvalid)
    if (errors.length) {
      showErrors(
        Object.fromEntries(errors.map((m, i) => [`e${i}`, m])),
        errors.map((_, i) => `e${i}`),
      )
      return false
    }
    return true
  }

  function persistLocalOrderIfLoggedIn(code: string) {
    if (!user) return
    const cityLabel = [ship.districtName, ship.provinceName, agencyName.trim()]
      .filter(Boolean)
      .join(' · ')
    const order = createLocalOrderFromCart({
      id: code,
      customerName: name.trim(),
      docNumber: taxId.trim(),
      phone: phone.trim(),
      city: cityLabel,
      total,
      items: cartLinesToOrderItems(
        resolved.map(({ line, product }) => ({
          line,
          name: isComboLine(line)
            ? line.comboName || 'Combo'
            : product!.name,
          unitPrice: unitPriceOfLine(line, product),
          imageUrl: isComboLine(line)
            ? line.comboImageUrl
            : product?.imageUrl,
        })),
      ),
    })
    saveLocalOrder(order)
  }

  async function submitOrder() {
    clear()
    if (!validate()) return
    setBusy(true)
    try {
      const items = resolved.map(({ line, product }) =>
        cartLineToApiItem(line, product),
      )

      const data = await api<{
        id: string
        code: string
        shareUrl: string
        linkDays: number
        linkExpiresAt: string
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          businessName: name.trim(),
          documentNumber: taxId.trim() || null,
          phone: phone.trim(),
          shipAddress: shipAddress.trim(),
          ship: {
            departmentCode: ship.departmentCode,
            provinceCode: ship.provinceCode,
            districtCode: ship.districtCode,
          },
          agencyName: agencyName.trim(),
          items,
          totalEstimated: total > 0 ? Number(total.toFixed(2)) : null,
        }),
      })

      const cityForPdf = [
        ship.districtName,
        ship.provinceName,
        ship.departmentName,
        agencyName.trim() ? `Ag. ${agencyName.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ')

      const { buildQuotePdf } = await import('@/features/cart/lib/quote-pdf')
      const pdf = await buildQuotePdf({
        customer: {
          name: name.trim(),
          document: taxId.trim(),
          phone: phone.trim(),
          city: cityForPdf,
        },
        lines: pdfLines,
        docNumber: data.code,
        shareUrl: data.shareUrl,
        kind: 'order',
      })

      await api(`/api/orders/${data.id}/pdf`, {
        method: 'PUT',
        body: JSON.stringify({ pdfBase64: await blobToBase64(pdf.blob) }),
      })

      persistLocalOrderIfLoggedIn(data.code)

      if (sharePdfUrl) URL.revokeObjectURL(sharePdfUrl)
      const url = URL.createObjectURL(pdf.blob)
      setSharePdfUrl(url)
      setShareMeta({
        code: data.code,
        shareUrl: data.shareUrl,
        businessName: name.trim(),
        fileName: pdf.fileName,
        linkDays: data.linkDays,
        linkExpiresAt: data.linkExpiresAt,
      })
      setShareOpen(true)
      showSuccess([`Pedido ${data.code} guardado.`])
    } catch (err) {
      showErrors(
        {
          order:
            err instanceof ApiError
              ? err.message
              : 'No se pudo guardar el pedido. Intenta de nuevo.',
        },
        ['order'],
      )
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const sessionName = user?.fullName || user?.email || null

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute inset-0 bg-rosver-ink/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="continue-order-title"
          className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-rosver-line bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl"
        >
          <FloatingToasts toasts={toasts} onDismiss={dismiss} />
          <header className="shrink-0 bg-rosver-ink px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="continue-order-title"
                  className="font-display text-sm font-bold tracking-wide text-white uppercase sm:text-base"
                >
                  Continuar pedido
                </h2>
                {sessionName ? (
                  <p className="mt-1 text-xs text-white/70">
                    Sesión: {sessionName}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <form
              noValidate
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-rosver-ink">
                  Nombre / razón social
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Comercial Los Andes S.A.C."
                  aria-invalid={Boolean(invalid.name)}
                  className={cnField(
                    'h-11 rounded-xl border border-rosver-line px-3 text-sm outline-none focus:border-rosver-red/45',
                    Boolean(invalid.name),
                  )}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-rosver-ink">
                  RUC o DNI
                </span>
                <input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="20609530902"
                  className="h-11 rounded-xl border border-rosver-line px-3 text-sm outline-none focus:border-rosver-red/45"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-rosver-ink">
                  Teléfono o WhatsApp
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  aria-invalid={Boolean(invalid.phone)}
                  className={cnField(
                    'h-11 rounded-xl border border-rosver-line px-3 text-sm outline-none focus:border-rosver-red/45',
                    Boolean(invalid.phone),
                  )}
                />
              </label>

              <div className="sm:col-span-2">
                <PeruAddressSuggest
                  id="order-ship-address"
                  address={shipAddress}
                  ubigeo={ship}
                  invalidAddress={Boolean(invalid.shipAddress)}
                  invalidUbigeo={Boolean(invalid.shipUbigeo)}
                  onAddressChange={(next) => {
                    setShipAddress(next)
                    setInvalid((v) => ({ ...v, shipAddress: false }))
                  }}
                  onUbigeoChange={(next) => {
                    setShip(next)
                    setInvalid((v) => ({ ...v, shipUbigeo: false }))
                  }}
                />
              </div>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-rosver-ink">
                  Agencia de transporte
                </span>
                <input
                  value={agencyName}
                  onChange={(e) => {
                    setAgencyName(e.target.value)
                    setInvalid((v) => ({ ...v, agencyName: false }))
                  }}
                  placeholder="Ej. Shalom, Marvisur, Olva…"
                  aria-invalid={Boolean(invalid.agencyName)}
                  className={cnField(
                    'h-11 rounded-xl border border-rosver-line px-3 text-sm outline-none focus:border-rosver-red/45',
                    Boolean(invalid.agencyName),
                  )}
                />
              </label>
            </form>

            <div className="rounded-xl border border-rosver-line">
              <p className="border-b border-rosver-line px-3 py-2 text-xs font-bold tracking-wide text-rosver-ink uppercase">
                {resolved.length} producto{resolved.length === 1 ? '' : 's'} del
                carrito
              </p>
              <ul className="max-h-32 divide-y divide-rosver-line overflow-y-auto">
                {resolved.map(({ line, product }) => {
                  const unit = unitPriceOfLine(line, product)
                  const label = isComboLine(line)
                    ? line.comboName || 'Combo'
                    : product!.name
                  const key = isComboLine(line)
                    ? `combo::${line.comboId}`
                    : `${line.productSlug}-${line.packagingId ?? 'x'}`
                  return (
                    <li
                      key={key}
                      className="flex justify-between gap-2 px-3 py-2 text-xs"
                    >
                      <span className="min-w-0 truncate font-medium text-rosver-ink">
                        {label}
                        <span className="text-rosver-muted">
                          {' '}
                          × {line.quantity}
                          {isComboLine(line)
                            ? ' (combo)'
                            : line.packagingLabel
                              ? ` (${line.packagingLabel})`
                              : ''}
                        </span>
                      </span>
                      <span className="shrink-0 font-bold text-rosver-red">
                        {unit != null
                          ? `S/ ${(unit * line.quantity).toFixed(2)}`
                          : 'Consultar'}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="flex items-center justify-between border-t border-rosver-line bg-rosver-soft/50 px-3 py-2.5">
                <span className="text-xs font-bold text-rosver-ink uppercase">
                  Total estimado
                </span>
                <span className="font-display text-lg font-bold text-rosver-ink">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 border-t border-rosver-line bg-rosver-soft/40 px-4 py-3 sm:px-5">
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitOrder()}
              className={cn(
                'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60',
              )}
            >
              <IconWhatsApp className="size-5" />
              {busy ? 'Guardando…' : 'Generar PDF y WhatsApp'}
            </button>
          </footer>
        </div>
      </div>

      {shareMeta ? (
        <QuoteShareModal
          open={shareOpen}
          onClose={() => {
            setShareOpen(false)
            onClose()
          }}
          pdfBlobUrl={sharePdfUrl}
          fileName={shareMeta.fileName}
          code={shareMeta.code}
          shareUrl={shareMeta.shareUrl}
          businessName={shareMeta.businessName}
          linkDays={shareMeta.linkDays}
          linkExpiresAt={shareMeta.linkExpiresAt}
          kind="order"
        />
      ) : null}
    </>
  )
}
