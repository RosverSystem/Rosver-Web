import { useAuth } from '@/features/auth'
import {
  cartLinesToOrderItems,
  createLocalOrderFromCart,
  saveLocalOrder,
} from '@/features/account/model/local-orders'
import { useCatalog, type Product } from '@/features/catalog'
import { useCart } from '@/features/cart'
import type { QuotePdfLine } from '@/features/cart/lib/quote-pdf'
import { unitPriceOfLine } from '@/features/cart/model/cart-line'
import { cn, cnField, isValidPhone, WHATSAPP_NUMBER } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { IconWhatsApp } from '@/shared/ui/icons'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Continuar pedido: datos negocio + PDF / WhatsApp.
 * Con sesión: prefill y guarda pedido local en /cuenta/pedidos (sin forzar login).
 */
export function ContinueOrderModal({ open, onClose }: Props) {
  const { products } = useCatalog()
  const { lines } = useCart()
  const { user } = useAuth()
  const { toasts, showMessages, dismiss, clear } = useFormToasts()

  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<{
    name?: boolean
    phone?: boolean
  }>({})

  useEffect(() => {
    if (!open) return
    const prev = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setSavedOrderId(null)
      return
    }
    if (!user) return
    setName((prev) => prev || user.companyName || user.fullName || '')
    setTaxId((prev) => prev || user.documentNumber || '')
    setPhone((prev) => prev || user.phone || '')
  }, [open, user])

  const resolved = useMemo(() => {
    return lines
      .map((line) => {
        const product = products.find((p) => p.slug === line.productSlug)
        if (!product) return null
        return { line, product }
      })
      .filter((x): x is { line: (typeof lines)[0]; product: Product } =>
        Boolean(x),
      )
  }, [lines, products])

  const pdfLines: QuotePdfLine[] = useMemo(
    () =>
      resolved.map(({ line, product }) => ({
        quantity: line.quantity,
        unit: line.packagingLabel?.slice(0, 12) || 'UND',
        description: product.name,
        sku: product.sku,
        unitPrice: unitPriceOfLine(line, product),
      })),
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
    const nextInvalid: { name?: boolean; phone?: boolean } = {}
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
    if (pdfLines.length === 0) {
      errors.push('El carrito no tiene productos válidos')
    }
    setInvalid(nextInvalid)
    if (errors.length) {
      showMessages(errors)
      return false
    }
    return true
  }

  function persistLocalOrderIfLoggedIn(docNumber: string) {
    if (!user) return null
    const order = createLocalOrderFromCart({
      customerName: name.trim(),
      docNumber,
      phone: phone.trim(),
      city: city.trim(),
      total,
      items: cartLinesToOrderItems(
        resolved.map(({ line, product }) => ({
          line,
          name: product.name,
          unitPrice: unitPriceOfLine(line, product),
          imageUrl: product.imageUrl,
        })),
      ),
    })
    saveLocalOrder(order)
    setSavedOrderId(order.id)
    return order.id
  }

  async function makePdf() {
    const { buildQuotePdf } = await import('@/features/cart/lib/quote-pdf')
    return buildQuotePdf({
      customer: {
        name: name.trim(),
        document: taxId.trim(),
        phone: phone.trim(),
        city: city.trim(),
      },
      lines: pdfLines,
    })
  }

  async function onDownloadPdf() {
    clear()
    if (!validate()) return
    setBusy(true)
    try {
      const pdf = await makePdf()
      const { downloadBlob } = await import('@/features/cart/lib/quote-pdf')
      downloadBlob(pdf.blob, pdf.fileName)
      const orderId = persistLocalOrderIfLoggedIn(pdf.docNumber)
      showMessages(
        orderId
          ? [
              'PDF descargado',
              `Pedido ${orderId} guardado en tu cuenta`,
            ]
          : ['PDF descargado — ábrelo o adjúntalo en WhatsApp'],
      )
    } catch {
      showMessages(['No se pudo generar el PDF'])
    } finally {
      setBusy(false)
    }
  }

  async function onWhatsApp() {
    clear()
    if (!validate()) return
    setBusy(true)
    try {
      const pdf = await makePdf()
      const { downloadBlob } = await import('@/features/cart/lib/quote-pdf')
      downloadBlob(pdf.blob, pdf.fileName)
      const orderId = persistLocalOrderIfLoggedIn(pdf.docNumber)

      const itemText = pdfLines
        .map((l) => {
          const price =
            l.unitPrice != null
              ? `S/ ${(l.unitPrice * l.quantity).toFixed(2)}`
              : 'Consultar'
          return `• ${l.description} — ${l.quantity} ${l.unit} — ${price}`
        })
        .join('\n')

      const sessionLine = user
        ? `Cuenta: ${user.fullName || user.email} (${user.email})`
        : null

      const msg = [
        'Hola Rosver, quiero continuar este pedido / cotización:',
        '',
        `N° ${pdf.docNumber}`,
        orderId ? `Ref. cuenta: ${orderId}` : null,
        sessionLine,
        `Empresa: ${name.trim()}`,
        `RUC/DNI: ${taxId.trim() || '—'}`,
        `Tel/WhatsApp: ${phone.trim()}`,
        `Ciudad/agencia: ${city.trim() || '—'}`,
        '',
        'Productos:',
        itemText,
        '',
        total > 0 ? `Total estimado: S/ ${total.toFixed(2)}` : null,
        '',
        'Adjunto el PDF de cotización descargado en mi dispositivo (WhatsApp no permite enviarlo automáticamente desde la web).',
      ]
        .filter(Boolean)
        .join('\n')

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener,noreferrer',
      )
      showMessages(
        orderId
          ? [
              'PDF descargado. En WhatsApp puedes adjuntar el archivo.',
              `Pedido ${orderId} en Mi cuenta → Pedidos`,
            ]
          : [
              'PDF descargado. En WhatsApp puedes adjuntar el archivo al chat.',
            ],
      )
    } catch {
      showMessages(['No se pudo preparar el envío'])
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const sessionName = user?.fullName || user?.email || null

  return (
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
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-rosver-line bg-white shadow-xl sm:rounded-2xl"
      >
        <FloatingToasts toasts={toasts} onDismiss={dismiss} />
        <header className="shrink-0 bg-rosver-ink px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="continue-order-title"
                className="font-display text-sm font-bold tracking-wide text-white uppercase sm:text-base"
              >
                Continuar pedido / cotización
              </h2>
              <p className="mt-1 text-xs text-white/70">
                {sessionName
                  ? `Sesión: ${sessionName} — no hace falta volver a entrar`
                  : 'Descarga el PDF o envía el resumen por WhatsApp'}
              </p>
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
          {user ? (
            <p className="rounded-xl border border-rosver-success/30 bg-rosver-success/10 px-3 py-2 text-xs text-rosver-ink">
              Ya iniciaste sesión. Al generar el PDF o WhatsApp, el pedido queda
              en{' '}
              <Link
                to="/cuenta/pedidos"
                className="font-bold text-rosver-red underline-offset-2 hover:underline"
                onClick={onClose}
              >
                Mi cuenta → Pedidos
              </Link>
              .
            </p>
          ) : (
            <p className="rounded-xl border border-rosver-line bg-rosver-soft/60 px-3 py-2 text-xs text-rosver-muted">
              Puedes continuar sin cuenta. Si quieres ver el pedido después,{' '}
              <Link
                to="/login"
                className="font-semibold text-rosver-red underline-offset-2 hover:underline"
                onClick={onClose}
              >
                inicia sesión
              </Link>{' '}
              primero (opcional).
            </p>
          )}

          <p className="rounded-xl border border-rosver-line bg-rosver-soft/60 px-3 py-2 text-xs text-rosver-muted">
            WhatsApp no permite adjuntar el PDF automáticamente desde la web.
            Al continuar se descarga el archivo para que lo adjuntes en el chat.
          </p>

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
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-semibold text-rosver-ink">
                Ciudad o agencia
              </span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Arequipa (Agencia Shalom)"
                className="h-11 rounded-xl border border-rosver-line px-3 text-sm outline-none focus:border-rosver-red/45"
              />
            </label>
          </form>

          <div className="rounded-xl border border-rosver-line">
            <p className="border-b border-rosver-line px-3 py-2 text-xs font-bold tracking-wide text-rosver-ink uppercase">
              {resolved.length} producto{resolved.length === 1 ? '' : 's'} del
              carrito
            </p>
            <ul className="max-h-40 divide-y divide-rosver-line overflow-y-auto">
              {resolved.map(({ line, product }) => {
                const unit = unitPriceOfLine(line, product)
                return (
                  <li
                    key={`${line.productSlug}-${line.packagingId ?? 'x'}`}
                    className="flex justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 truncate font-medium text-rosver-ink">
                      {product.name}
                      <span className="text-rosver-muted">
                        {' '}
                        × {line.quantity}
                        {line.packagingLabel
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

          {savedOrderId ? (
            <Link
              to={`/cuenta/pedidos/${savedOrderId}`}
              onClick={onClose}
              className="block rounded-xl border border-rosver-red/30 bg-rosver-red/5 px-3 py-2.5 text-center text-sm font-bold text-rosver-red"
            >
              Ver pedido {savedOrderId} en mi cuenta
            </Link>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-rosver-line bg-rosver-soft/40 px-4 py-3 sm:flex-row sm:px-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDownloadPdf()}
            className={cn(
              'inline-flex min-h-12 flex-1 items-center justify-center rounded-full border-2 border-rosver-red bg-white px-4 text-sm font-bold text-rosver-red transition hover:bg-rosver-red/5 disabled:opacity-60',
            )}
          >
            {busy ? 'Generando…' : 'Descargar PDF'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onWhatsApp()}
            className="inline-flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            <IconWhatsApp className="size-5" />
            {busy ? 'Preparando…' : 'Continuar por WhatsApp'}
          </button>
        </footer>
      </div>
    </div>
  )
}
