import {
  QUOTE_PIPELINE_BADGE,
  QUOTE_PIPELINE_LABEL,
  QUOTE_PIPELINE_SHORT,
  QUOTE_PIPELINE_STATUSES,
  isQuotePipelineStatus,
  nextQuotePipelineStatus,
  type QuotePipelineStatus,
} from '@/shared/lib/quote-pipeline'
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

type QuoteItem = {
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

type QuoteEvidence = {
  revisionNote: string | null
  responseProofUrl: string | null
  responseNote: string | null
  acceptanceProofUrl: string | null
  acceptanceNote: string | null
  closeNote: string | null
}

type QuoteDetail = {
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
  items: QuoteItem[]
  totalEstimated: number | null
  publicSlug: string | null
  shareUrl: string | null
  createdAt: string
  hasPdf: boolean
  evidence: QuoteEvidence
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

function normalizeStatus(raw: string): QuotePipelineStatus {
  return isQuotePipelineStatus(raw) ? raw : 'recibida'
}

function formatMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return MONEY_FMT.format(n)
}

function EvidenceFileButton({
  label,
  kind,
  quoteId,
  currentUrl,
  disabled,
  onUploaded,
  onError,
}: {
  label: string
  kind: 'response' | 'acceptance'
  quoteId: string
  currentUrl: string | null
  disabled?: boolean
  onUploaded: (quote: QuoteDetail) => void
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
            const data = await api<{ quote: QuoteDetail }>(
              `/api/admin/quotes/${quoteId}/evidence`,
              { method: 'POST', body: fd },
            )
            onUploaded(data.quote)
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
            Obligatorio o nota
          </span>
        )}
      </div>
    </div>
  )
}

export function AdminQuoteWorkspacePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const codigo = params.get('codigo-cotizacion') ?? ''

  const { toasts, showSuccess, showErrors, dismiss, clear } = useFormToasts()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [advanceTo, setAdvanceTo] = useState<QuotePipelineStatus | null>(null)

  const [revisionNote, setRevisionNote] = useState('')
  const [responseNote, setResponseNote] = useState('')
  const [acceptanceNote, setAcceptanceNote] = useState('')
  const [closeNote, setCloseNote] = useState('')

  function applyQuote(next: QuoteDetail) {
    setQuote(next)
    setRevisionNote(next.evidence.revisionNote ?? '')
    setResponseNote(next.evidence.responseNote ?? '')
    setAcceptanceNote(next.evidence.acceptanceNote ?? '')
    setCloseNote(next.evidence.closeNote ?? '')
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!codigo.trim()) {
        setError('Falta el código de cotización en la URL.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await api<{ quote: QuoteDetail }>(
          `/api/admin/quotes?code=${encodeURIComponent(codigo)}`,
        )
        if (!cancelled) applyQuote(data.quote)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : 'No se pudo cargar la cotización.',
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
  }, [codigo])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/admin/cotizaciones')
  }

  function openAdvanceModal(target: QuotePipelineStatus) {
    if (!quote) return
    if (normalizeStatus(quote.status) === target) return
    if (target === 'recibida') {
      void confirmAdvance(target)
      return
    }
    setAdvanceTo(target)
  }

  async function confirmAdvance(target: QuotePipelineStatus) {
    if (!quote) return
    clear()
    setSaving(true)
    try {
      const data = await api<{ quote: QuoteDetail }>(
        `/api/admin/quotes/${quote.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            revisionNote: revisionNote.trim() || null,
            responseNote: responseNote.trim() || null,
            acceptanceNote: acceptanceNote.trim() || null,
            closeNote: closeNote.trim() || null,
            status: target,
          }),
        },
      )
      applyQuote(data.quote)
      setAdvanceTo(null)
      showSuccess([`Fase actualizada: ${QUOTE_PIPELINE_LABEL[target]}`])
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

  const status = quote ? normalizeStatus(quote.status) : 'recibida'
  const stepIndex = QUOTE_PIPELINE_STATUSES.indexOf(status)
  const next = nextQuotePipelineStatus(status)

  return (
    <div className="relative min-h-dvh w-full bg-rosver-soft">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <header>
          <p className="text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Pipeline de cotización
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-rosver-ink sm:text-3xl">
            {codigo || 'Cotización'}
          </h1>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-rosver-line bg-white p-8 text-center text-sm text-rosver-muted shadow-sm">
            Cargando…
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
        ) : quote ? (
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-rosver-line bg-gradient-to-br from-rosver-ink via-rosver-blue to-rosver-ink p-5 text-white shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-white/60 uppercase">
                    Cliente
                  </p>
                  <p className="mt-1 text-lg font-bold leading-snug sm:text-xl">
                    {quote.businessName}
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    Tel. {quote.phone}
                    {quote.documentNumber
                      ? ` · Doc. ${quote.documentNumber}`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold">
                    {quote.code}
                  </span>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-rosver-yellow sm:text-3xl">
                    {formatMoney(quote.totalEstimated)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-bold',
                    QUOTE_PIPELINE_BADGE[status],
                  )}
                >
                  {QUOTE_PIPELINE_LABEL[status]}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/85">
                  {DATE_FMT.format(new Date(quote.createdAt))}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/85">
                  {quote.itemCount} ítem{quote.itemCount === 1 ? '' : 's'}
                </span>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
              <div className="border-b border-rosver-line bg-rosver-ink px-4 py-3">
                <p className="text-sm font-bold text-white">
                  Productos cotizados
                </p>
                <p className="text-xs text-white/70">SKU, nombre y detalle</p>
              </div>
              {quote.items.length === 0 ? (
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
                    {quote.items.map((it, idx) => (
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
                  Fases de la cotización
                </h2>
                <p className="text-xs text-rosver-muted">
                  Al avanzar se abre un modal para completar datos
                </p>
              </div>

              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-2">
                {QUOTE_PIPELINE_STATUSES.map((s, i) => {
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
                              ? QUOTE_PIPELINE_BADGE[s]
                              : 'bg-rosver-soft text-rosver-muted',
                          )}
                        >
                          {done ? (current ? i + 1 : '✓') : i + 1}
                        </span>
                        <span className="text-[10px] font-bold leading-tight text-rosver-ink sm:text-[11px]">
                          {QUOTE_PIPELINE_SHORT[s]}
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
                    {QUOTE_PIPELINE_LABEL[status]}
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
                      Avanzar a {QUOTE_PIPELINE_SHORT[next]}
                      <ArrowRight
                        size={16}
                        color="currentColor"
                        strokeWidth={2}
                      />
                    </>
                  ) : (
                    'Cotización cerrada'
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
                  {quote.shipAddress || '—'}
                </p>
                <p className="mt-1 text-xs text-rosver-muted">
                  {[quote.shipDistrict, quote.shipProvince, quote.shipDepartment]
                    .filter(Boolean)
                    .join(' · ') || 'Sin ubigeo'}
                </p>
                {quote.agencyName ? (
                  <p className="mt-2 text-xs font-semibold text-rosver-blue">
                    Agencia: {quote.agencyName}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                  Link público
                </p>
                {quote.shareUrl ? (
                  <a
                    href={quote.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm font-semibold text-rosver-red hover:underline"
                  >
                    {quote.publicSlug}
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
        open={Boolean(advanceTo && quote)}
        onClose={() => setAdvanceTo(null)}
        size="lg"
        title={
          advanceTo
            ? `Completar · ${QUOTE_PIPELINE_LABEL[advanceTo]}`
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
        {quote && advanceTo ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-rosver-muted">
              Completá lo pedido para pasar a{' '}
              <span className="font-bold text-rosver-ink">
                {QUOTE_PIPELINE_LABEL[advanceTo]}
              </span>
              .
            </p>

            {advanceTo === 'en_revision' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-rosver-muted">
                  Nota de revisión
                </span>
                <AdminInput
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Stock, precios, observaciones…"
                />
              </label>
            ) : null}

            {advanceTo === 'respondida' ? (
              <div className="flex flex-col gap-3">
                <EvidenceFileButton
                  label="Subir respuesta / PDF"
                  kind="response"
                  quoteId={quote.id}
                  currentUrl={quote.evidence.responseProofUrl}
                  disabled={saving}
                  onUploaded={(q) => {
                    applyQuote(q)
                    showSuccess(['Respuesta subida'])
                  }}
                  onError={(m) => showErrors([m])}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Nota
                  </span>
                  <AdminInput
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    placeholder="Enviado por correo / WhatsApp…"
                  />
                </label>
              </div>
            ) : null}

            {advanceTo === 'aceptada' ? (
              <div className="flex flex-col gap-3">
                <EvidenceFileButton
                  label="Subir prueba de aceptación"
                  kind="acceptance"
                  quoteId={quote.id}
                  currentUrl={quote.evidence.acceptanceProofUrl}
                  disabled={saving}
                  onUploaded={(q) => {
                    applyQuote(q)
                    showSuccess(['Prueba subida'])
                  }}
                  onError={(m) => showErrors([m])}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-rosver-muted">
                    Nota
                  </span>
                  <AdminInput
                    value={acceptanceNote}
                    onChange={(e) => setAcceptanceNote(e.target.value)}
                    placeholder="Cliente aceptó condiciones…"
                  />
                </label>
              </div>
            ) : null}

            {advanceTo === 'cerrada' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-rosver-muted">
                  Motivo de cierre
                </span>
                <AdminInput
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="Convertida a pedido / sin respuesta / otro…"
                />
              </label>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <button
        type="button"
        onClick={goBack}
        title="Volver"
        aria-label="Volver"
        className="fixed right-4 bottom-4 z-50 inline-flex size-14 items-center justify-center rounded-full bg-rosver-red text-white shadow-lg shadow-rosver-red/35 transition hover:scale-105 hover:bg-rosver-red-dark active:scale-95 sm:right-6 sm:bottom-6"
      >
        <Undo size={22} color="currentColor" strokeWidth={2} />
      </button>
    </div>
  )
}
