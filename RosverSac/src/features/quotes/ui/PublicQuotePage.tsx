import { api, ApiError } from '@/shared/lib/api'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type PublicQuote = {
  code: string
  businessName: string
  documentNumber: string | null
  phone: string
  shipAddress: string
  shipDepartment: string
  shipProvince: string
  shipDistrict: string
  agencyName: string
  items: Array<{
    productName: string
    presentation: string
    quantity: number
    unitPrice?: number | null
  }>
  totalEstimated: number | null
  shareUrl: string
  linkExpiresAt: string
  hasPdf: boolean
  pdfUrl: string | null
}

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/**
 * Vista pública del link temporal `/c/:slug` (nombre + n° cotización).
 */
export function PublicQuotePage() {
  const { slug = '' } = useParams()
  const { toasts, dismiss } = useFormToasts()
  const [data, setData] = useState<PublicQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const q = await api<PublicQuote>(
          `/api/quotes/public/${encodeURIComponent(slug)}`,
        )
        if (!cancelled) setData(q)
      } catch (e) {
        if (!cancelled) {
          setData(null)
          setError(
            e instanceof ApiError
              ? e.message
              : 'No se pudo abrir esta cotización.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (slug) void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <p className="text-xs font-semibold tracking-wide text-rosver-muted uppercase">
        Cotización Rosver SAC
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-rosver-muted">Cargando…</p>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rosver-line bg-white p-6 shadow-sm">
          <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
            Link no disponible
          </h1>
          <p className="mt-2 text-sm text-rosver-muted">{error}</p>
          <Link
            to="/cotizar"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-rosver-red px-5 text-sm font-bold text-white hover:bg-rosver-red-dark"
          >
            Ir a cotizar
          </Link>
        </div>
      ) : data ? (
        <div className="mt-4 space-y-5">
          <header className="rounded-2xl border border-rosver-line bg-white p-5 shadow-sm sm:p-6">
            <h1 className="font-display text-xl font-bold text-rosver-ink uppercase sm:text-2xl">
              {data.code}
            </h1>
            <p className="mt-1 text-sm text-rosver-muted">
              Vigente hasta {DATE_FMT.format(new Date(data.linkExpiresAt))}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-rosver-muted uppercase">
                  Cliente
                </dt>
                <dd className="font-semibold text-rosver-ink">
                  {data.businessName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-rosver-muted uppercase">
                  WhatsApp
                </dt>
                <dd className="font-semibold text-rosver-ink">{data.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-rosver-muted uppercase">
                  Dirección
                </dt>
                <dd className="font-semibold text-rosver-ink">
                  {data.shipAddress}
                </dd>
                <dd className="text-xs text-rosver-muted">
                  {data.shipDistrict} · Prov. {data.shipProvince} ·{' '}
                  {data.shipDepartment}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-rosver-muted uppercase">
                  Agencia
                </dt>
                <dd className="font-semibold text-rosver-ink">
                  {data.agencyName}
                </dd>
              </div>
              {data.totalEstimated != null ? (
                <div>
                  <dt className="text-xs font-semibold text-rosver-muted uppercase">
                    Total estimado
                  </dt>
                  <dd className="font-semibold text-rosver-ink">
                    S/ {data.totalEstimated.toFixed(2)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </header>

          <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
            <div className="border-b border-rosver-line px-4 py-3">
              <h2 className="text-sm font-bold text-rosver-ink">Productos</h2>
            </div>
            <ul className="divide-y divide-rosver-line">
              {data.items.map((item, i) => (
                <li
                  key={`${item.productName}-${i}`}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-rosver-ink">
                      {item.productName}
                    </p>
                    <p className="text-xs text-rosver-muted">
                      {item.quantity} × {item.presentation}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-rosver-red">
                    {item.unitPrice != null
                      ? `S/ ${(item.unitPrice * item.quantity).toFixed(2)}`
                      : 'Consultar'}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {data.hasPdf && data.pdfUrl ? (
            <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-rosver-line px-4 py-3">
                <h2 className="text-sm font-bold text-rosver-ink">PDF</h2>
                <a
                  href={data.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-rosver-red hover:underline"
                >
                  Abrir / descargar
                </a>
              </div>
              <iframe
                title={`PDF ${data.code}`}
                src={data.pdfUrl}
                className="h-[min(70dvh,40rem)] w-full bg-rosver-soft"
              />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
