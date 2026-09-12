import {
  ORDER_PIPELINE_BADGE,
  ORDER_PIPELINE_LABEL,
  ORDER_PIPELINE_SHORT,
  ORDER_PIPELINE_STATUSES,
  isOrderPipelineStatus,
  nextPipelineStatus,
  type OrderPipelineStatus,
} from '@/features/admin-orders/model/order-pipeline'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { api, ApiError } from '@/shared/lib/api'
import { formatInternalCode } from '@/shared/lib/internal-code'
import { cn } from '@/shared/lib'
import { AdminInput } from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { BootstrapTable } from '@/shared/ui/bootstrap-table'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { ArrowRight, Undo, Upload } from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

type OrderItem = {
  lineKind?: 'product' | 'combo'
  productSlug: string
  productSku: string | null
  productCode: number | null
  productName: string
  presentation: string
  quantity: number
  unitPrice: number | null
  lineTotal: number | null
  imageUrl: string | null
  comboId?: string | null
  comboSnapshot?: {
    kind?: string | null
    items?: Array<{
      productName?: string
      quantity?: number
      productSku?: string
    }>
  } | null
}

type OrderEvidence = {
  paymentProofUrl: string | null
  paymentNote: string | null
  shipCarrier: string | null
  shipDataNote: string | null
  trackingNumber: string | null
  shippingVoucherUrl: string | null
  deliveryProofUrl: string | null
  deliveryNote: string | null
}

type OrderDetail = {
  id: string
  code: string
  businessName: string
  documentNumber: string | null
  phone: string
  status: string
  shipAddress: string | null
  shipDistrict: string | null
  shipProvince: string | null
  shipDepartment: string | null
  agencyName: string | null
  itemCount: number
  items: OrderItem[]
  totalEstimated: number | null
  publicSlug: string | null
  shareUrl: string | null
  createdAt: string
  evidence: OrderEvidence
}

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const MONEY_FMT = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

function normalizeStatus(raw: string): OrderPipelineStatus {
  return isOrderPipelineStatus(raw) ? raw : 'confirmacion_pedido'
}

function formatMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return MONEY_FMT.format(n)
}

function EvidenceFileButton({
  label,
  kind,
  orderId,
  currentUrl,
  disabled,
  onUploaded,
  onError,
}: {
  label: string
  kind: 'payment' | 'voucher' | 'delivery'
  orderId: string
  currentUrl: string | null
  disabled?: boolean
  onUploaded: (order: OrderDetail) => void
  onError: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setBusy(true)
          try {
            const fd = new FormData()
            fd.append('kind', kind)
            fd.append('file', file)
            const data = await api<{ order: OrderDetail }>(
              `/api/admin/orders/${orderId}/evidence`,
              { method: 'POST', body: fd },
            )
            onUploaded(data.order)
          } catch (err) {
            onError(
              err instanceof ApiError
                ? err.message
                : 'No se pudo subir el archivo.',
            )
          } finally {
            setBusy(false)
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-rosver-blue px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Upload size={14} color="currentColor" strokeWidth={2} />
          {busy ? 'Subiendo…' : label}
        </button>
        {currentUrl ? (
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-rosver-red hover:underline"
          >
            Ver archivo
          </a>
        ) : (
          <span className="text-xs font-medium text-rosver-red">
            Obligatorio
          </span>
        )}
      </div>
      {currentUrl && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(currentUrl) ? (
        <img
          src={currentUrl}
          alt=""
          width={160}
          height={120}
          className="mt-1 max-h-28 max-w-[10rem] rounded-lg border border-rosver-line object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </div>
  )
}

export function AdminOrderWorkspacePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const codigoPedido = params.get('codigo-pedido') ?? ''

  const { toasts, showSuccess, showErrors, dismiss, clear } = useFormToasts()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [advanceTo, setAdvanceTo] = useState<OrderPipelineStatus | null>(null)

  const [paymentNote, setPaymentNote] = useState('')
  const [shipCarrier, setShipCarrier] = useState('')
  const [shipDataNote, setShipDataNote] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')

  function applyOrder(next: OrderDetail) {
    setOrder(next)
    setPaymentNote(next.evidence.paymentNote ?? '')
    setShipCarrier(next.evidence.shipCarrier ?? '')
    setShipDataNote(next.evidence.shipDataNote ?? '')
    setTrackingNumber(next.evidence.trackingNumber ?? '')
    setDeliveryNote(next.evidence.deliveryNote ?? '')
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!codigoPedido.trim()) {
        setError('Falta el código de pedido en la URL.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await api<{ order: OrderDetail }>(
          `/api/admin/orders?code=${encodeURIComponent(codigoPedido)}`,
        )
        if (!cancelled) applyOrder(data.order)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : 'No se pudo cargar el pedido.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [codigoPedido])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/admin/pedidos')
  }

  function openAdvanceModal(target: OrderPipelineStatus) {
    if (!order) return
    if (normalizeStatus(order.status) === target) return
    if (target === 'confirmacion_pedido') {
      void confirmAdvance(target)
      return
    }
    setAdvanceTo(target)
  }

  async function confirmAdvance(target: OrderPipelineStatus) {
    if (!order) return
    clear()
    setSaving(true)
    try {
      const data = await api<{ order: OrderDetail }>(
        `/api/admin/orders/${order.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            paymentNote: paymentNote.trim() || null,
            shipCarrier: shipCarrier.trim() || null,
            shipDataNote: shipDataNote.trim() || null,
            trackingNumber: trackingNumber.trim() || null,
            deliveryNote: deliveryNote.trim() || null,
            status: target,
          }),
        },
      )
      applyOrder(data.order)
      setAdvanceTo(null)
      showSuccess([`Fase actualizada: ${ORDER_PIPELINE_LABEL[target]}`])
    } catch (e) {
      showErrors([
        e instanceof ApiError
          ? e.message
          : 'No se pudo avanzar de fase.',
      ])
    } finally {
      setSaving(false)
    }
  }

  const status = order ? normalizeStatus(order.status) : 'confirmacion_pedido'
  const stepIndex = ORDER_PIPELINE_STATUSES.indexOf(status)
  const next = nextPipelineStatus(status)

  return (
    <div className="relative min-h-dvh w-full bg-rosver-soft">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <header>
          <p className="text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Pipeline del pedido
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-rosver-ink sm:text-3xl">
            {codigoPedido || 'Pedido'}
          </h1>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-rosver-line bg-white p-8 text-center text-sm text-rosver-muted shadow-sm">
            Cargando pedido…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rosver-red/30 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-rosver-red">{error}</p>
            <button
              type="button"
              onClick={goBack}
              className="mt-4 rounded-xl bg-rosver-ink px-4 py-2.5 text-sm font-bold text-white"
            >
              Volver
            </button>
          </div>
        ) : order ? (
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-rosver-line bg-gradient-to-br from-rosver-ink via-rosver-blue to-rosver-ink p-5 text-white shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-white/60 uppercase">
                    Cliente
                  </p>
                  <p className="mt-1 text-lg font-bold leading-snug sm:text-xl">
                    {order.businessName}
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    Tel. {order.phone}
                    {order.documentNumber
                      ? ` · Doc. ${order.documentNumber}`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold">
                    {order.code}
                  </span>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-rosver-yellow sm:text-3xl">
                    {formatMoney(order.totalEstimated)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-bold',
                    ORDER_PIPELINE_BADGE[status],
                  )}
                >
                  {ORDER_PIPELINE_LABEL[status]}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/85">
                  {DATE_FMT.format(new Date(order.createdAt))}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/85">
                  {order.itemCount} ítem{order.itemCount === 1 ? '' : 's'}
                </span>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
              <div className="border-b border-rosver-line bg-rosver-ink px-4 py-3">
                <p className="text-sm font-bold text-white">
                  Productos del pedido
                </p>
                <p className="text-xs text-white/70">
                  SKU, nombre y detalle de lo pedido
                </p>
              </div>
              {order.items.length === 0 ? (
                <p className="p-4 text-sm text-rosver-muted">Sin ítems.</p>
              ) : (
                <BootstrapTable className="min-w-[720px]" size="sm" striped hover>
                  <thead>
                    <tr>
                      <th>SKU / Producto</th>
                      <th>Presentación</th>
                      <th>Cant.</th>
                      <th>P. unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it, idx) => (
                      <tr key={`${it.productSlug}-${idx}`}>
                        <td>
                          <div className="flex items-center gap-3">
                            {it.imageUrl ? (
                              <img
                                src={it.imageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="size-10 rounded-lg object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span className="flex size-10 items-center justify-center rounded-lg bg-rosver-soft text-[9px] font-bold text-rosver-muted">
                                N/A
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-rosver-ink">
                                {it.productName}
                                {it.lineKind === 'combo' ? (
                                  <span className="ml-2 rounded bg-rosver-yellow px-1.5 py-0.5 text-[10px] font-black text-rosver-ink uppercase">
                                    Combo
                                  </span>
                                ) : null}
                              </p>
                              <p className="mt-0.5 flex flex-wrap gap-1.5 text-[11px]">
                                {it.productSku ? (
                                  <span className="rounded bg-rosver-red/10 px-1.5 py-0.5 font-bold text-rosver-red">
                                    SKU {it.productSku}
                                  </span>
                                ) : null}
                                {it.productCode != null ? (
                                  <span className="rounded bg-rosver-soft px-1.5 py-0.5 font-bold text-rosver-muted">
                                    Cód. {formatInternalCode(it.productCode)}
                                  </span>
                                ) : null}
                              </p>
                              {it.lineKind === 'combo' &&
                              Array.isArray(it.comboSnapshot?.items) &&
                              it.comboSnapshot!.items!.length > 0 ? (
                                <p className="mt-1 text-[11px] text-rosver-muted">
                                  {it.comboSnapshot!.items!
                                    .map(
                                      (n) =>
                                        `${n.quantity ?? 1}× ${n.productName ?? 'Ítem'}`,
                                    )
                                    .join(' · ')}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="text-sm">{it.presentation}</td>
                        <td className="font-semibold">{it.quantity}</td>
                        <td className="whitespace-nowrap text-sm">
                          {formatMoney(it.unitPrice)}
                        </td>
                        <td className="whitespace-nowrap font-bold">
                          {formatMoney(it.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </BootstrapTable>
              )}
            </section>

            <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold tracking-wide text-rosver-ink uppercase">
                  Fases del pedido
                </h2>
                <p className="text-xs text-rosver-muted">
                  Al avanzar se abre un modal para completar datos
                </p>
              </div>

              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-2">
                {ORDER_PIPELINE_STATUSES.map((s, i) => {
                  const done = i <= stepIndex
                  const current = i === stepIndex
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => openAdvanceModal(s)}
                        className={cn(
                          'flex h-full w-full flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition disabled:opacity-50',
                          current
                            ? 'border-rosver-red bg-rosver-red/5 shadow-sm ring-2 ring-rosver-red/30'
                            : done
                              ? 'border-rosver-line bg-rosver-soft/60 hover:border-rosver-blue'
                              : 'border-dashed border-rosver-line bg-white hover:border-rosver-muted',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-8 items-center justify-center rounded-full text-xs font-bold',
                            done
                              ? ORDER_PIPELINE_BADGE[s]
                              : 'bg-rosver-soft text-rosver-muted',
                          )}
                        >
                          {done ? (current ? i + 1 : '✓') : i + 1}
                        </span>
                        <span className="text-[10px] font-bold leading-tight text-rosver-ink sm:text-[11px]">
                          {ORDER_PIPELINE_SHORT[s]}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rosver-line pt-5">
                <p className="text-sm text-rosver-muted">
                  Fase actual:{' '}
                  <span className="font-bold text-rosver-ink">
                    {ORDER_PIPELINE_LABEL[status]}
                  </span>
                </p>
                <button
                  type="button"
                  disabled={saving || !next}
                  onClick={() => {
                    if (next) openAdvanceModal(next)
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rosver-ink px-5 py-3 text-sm font-bold text-white hover:bg-rosver-red disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {next ? (
                    <>
                      Avanzar a {ORDER_PIPELINE_SHORT[next]}
                      <ArrowRight
                        size={16}
                        color="currentColor"
                        strokeWidth={2}
                      />
                    </>
                  ) : (
                    'Pedido entregado'
                  )}
                </button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                  Destino
                </p>
                <p className="mt-2 text-sm font-semibold text-rosver-ink">
                  {order.shipAddress || '—'}
                </p>
                <p className="mt-1 text-xs text-rosver-muted">
                  {[order.shipDistrict, order.shipProvince, order.shipDepartment]
                    .filter(Boolean)
                    .join(' · ') || 'Sin ubigeo'}
                </p>
                {order.agencyName ? (
                  <p className="mt-2 text-xs font-semibold text-rosver-blue">
                    Agencia: {order.agencyName}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                  Link público
                </p>
                {order.shareUrl ? (
                  <a
                    href={order.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm font-semibold text-rosver-red hover:underline"
                  >
                    {order.publicSlug}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-rosver-muted">Sin link</p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <AdminModal
        open={Boolean(advanceTo && order)}
        onClose={() => setAdvanceTo(null)}
        size="lg"
        title={
          advanceTo
            ? `Completar · ${ORDER_PIPELINE_LABEL[advanceTo]}`
            : 'Completar fase'
        }
        footer={
          advanceTo ? (
            <>
              <button
                type="button"
                onClick={() => setAdvanceTo(null)}
                className="rounded-xl border border-rosver-line px-4 py-2.5 text-sm font-bold text-rosver-ink hover:bg-rosver-soft"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirmAdvance(advanceTo)}
                className="rounded-xl bg-rosver-red px-4 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-50"
              >
                Guardar y avanzar
              </button>
            </>
          ) : null
        }
      >
        {order && advanceTo ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-rosver-muted">
              Completá lo pedido para pasar a{' '}
              <span className="font-bold text-rosver-ink">
                {ORDER_PIPELINE_LABEL[advanceTo]}
              </span>
              .
            </p>

            {advanceTo === 'confirmacion_pago' ? (
              <div className="flex flex-col gap-3">
                <EvidenceFileButton
                  label="Subir captura de pago"
                  kind="payment"
                  orderId={order.id}
                  currentUrl={order.evidence.paymentProofUrl}
                  disabled={saving}
                  onUploaded={(o) => {
                    applyOrder(o)
                    showSuccess(['Captura de pago subida'])
                  }}
                  onError={(m) => showErrors([m])}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Nota (opcional)
                  </span>
                  <AdminInput
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ej. Yape · ref 123"
                  />
                </label>
              </div>
            ) : null}

            {advanceTo === 'realizando_envio' ? (
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Agencia o courier
                  </span>
                  <AdminInput
                    value={shipCarrier}
                    onChange={(e) => setShipCarrier(e.target.value)}
                    placeholder="Ej. Shalom, Olva"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Nota de envío
                  </span>
                  <AdminInput
                    value={shipDataNote}
                    onChange={(e) => setShipDataNote(e.target.value)}
                    placeholder="Horario, contacto, embalaje…"
                  />
                </label>
              </div>
            ) : null}

            {advanceTo === 'enviado' ? (
              <div className="flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Número de envío / guía
                  </span>
                  <AdminInput
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ej. 123456789PE"
                  />
                </label>
                <EvidenceFileButton
                  label="Subir voucher de envío"
                  kind="voucher"
                  orderId={order.id}
                  currentUrl={order.evidence.shippingVoucherUrl}
                  disabled={saving}
                  onUploaded={(o) => {
                    applyOrder(o)
                    showSuccess(['Voucher subido'])
                  }}
                  onError={(m) => showErrors([m])}
                />
              </div>
            ) : null}

            {advanceTo === 'entregado' ? (
              <div className="flex flex-col gap-3">
                <EvidenceFileButton
                  label="Subir prueba de entrega"
                  kind="delivery"
                  orderId={order.id}
                  currentUrl={order.evidence.deliveryProofUrl}
                  disabled={saving}
                  onUploaded={(o) => {
                    applyOrder(o)
                    showSuccess(['Prueba de entrega subida'])
                  }}
                  onError={(m) => showErrors([m])}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Nota (opcional)
                  </span>
                  <AdminInput
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Quién recibió, hora…"
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <button
        type="button"
        onClick={goBack}
        title="Volver"
        aria-label="Volver a donde estaba"
        className="fixed right-4 bottom-4 z-50 inline-flex size-14 items-center justify-center rounded-full bg-rosver-red text-white shadow-lg shadow-rosver-red/35 transition hover:scale-105 hover:bg-rosver-red-dark active:scale-95 sm:right-6 sm:bottom-6"
      >
        <Undo size={22} color="currentColor" strokeWidth={2} />
      </button>
    </div>
  )
}
