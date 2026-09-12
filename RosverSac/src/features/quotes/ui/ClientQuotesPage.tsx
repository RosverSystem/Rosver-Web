import { fetchMyQuotes } from '@/features/quotes/model/api-quotes'
import { useAuth } from '@/features/auth'
import {
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_STEPS,
  QUOTE_STATUS_TONE,
  type Quote,
  type QuoteStatus,
} from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { AdminModuleBanner } from '@/shared/ui/admin-module-banner'
import { StatusStepper } from '@/shared/ui/status-stepper'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function quoteStepIndex(status: QuoteStatus) {
  const i = QUOTE_STATUS_STEPS.indexOf(status)
  return i < 0 ? 0 : i
}

function QuoteCard({ quote }: { quote: Quote }) {
  const stepIndex = quoteStepIndex(quote.status)

  return (
    <article className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rosver-line bg-rosver-soft/50 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-bold text-rosver-ink">
            Cotización {quote.id}
          </p>
          <p className="text-xs text-rosver-muted">Solicitada el {quote.date}</p>
        </div>
        <Badge tone={QUOTE_STATUS_TONE[quote.status]}>
          {QUOTE_STATUS_LABEL[quote.status]}
        </Badge>
      </div>

      <div className="px-4 py-4 sm:px-5">
        {stepIndex >= 0 ? (
          <StatusStepper
            currentIndex={stepIndex}
            steps={QUOTE_STATUS_STEPS.map((key) => ({
              key,
              label: QUOTE_STATUS_LABEL[key],
            }))}
          />
        ) : null}
        {quote.note ? (
          <p className="mt-3 text-xs font-medium text-rosver-blue">{quote.note}</p>
        ) : null}

        <ul className="mt-4 flex flex-col gap-3">
          {quote.items.map((item) => (
            <li key={`${quote.id}-${item.name}`} className="flex gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-rosver-line"
                />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-rosver-soft text-[9px] font-bold text-rosver-muted ring-1 ring-rosver-line">
                  N/A
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-rosver-ink">
                  {item.name}
                </p>
                <p className="text-xs text-rosver-muted">Cant. {item.qty}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export function ClientQuotesPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      if (!user) {
        setQuotes([])
        setLoading(false)
        return
      }
      try {
        const remote = await fetchMyQuotes()
        if (!cancelled) setQuotes(remote)
      } catch {
        if (!cancelled) {
          setQuotes([])
          setError('No se pudieron cargar las cotizaciones.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    function reload() {
      void load()
    }
    window.addEventListener('focus', reload)
    return () => {
      cancelled = true
      window.removeEventListener('focus', reload)
    }
  }, [user])

  const quoteStats = useMemo(() => {
    const open = quotes.filter(
      (q) => q.status !== 'aceptada' && q.status !== 'cerrada',
    ).length
    const done = quotes.filter(
      (q) => q.status === 'aceptada' || q.status === 'cerrada',
    ).length
    return { total: quotes.length, open, done }
  }, [quotes])

  return (
    <div className="flex flex-col gap-4">
      <AdminModuleBanner
        eyebrow="Cuenta"
        title="Mis cotizaciones"
        description="Estado de revisión y productos solicitados."
        stats={[
          { label: 'Total', value: quoteStats.total },
          { label: 'En curso', value: quoteStats.open, tone: 'warning' },
          { label: 'Cerradas', value: quoteStats.done, tone: 'success' },
        ]}
        actions={
          <Link
            to="/cotizar"
            className="rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white uppercase shadow-sm shadow-rosver-red/30 hover:bg-rosver-red-dark"
          >
            Nueva cotización
          </Link>
        }
      />

      {error ? (
        <p className="rounded-xl border border-rosver-yellow/50 bg-rosver-yellow/15 px-3 py-2 text-xs font-medium text-rosver-ink">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-rosver-line bg-white px-4 py-10 text-center text-sm text-rosver-muted">
          Cargando cotizaciones…
        </p>
      ) : quotes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rosver-line bg-white px-4 py-10 text-center text-sm text-rosver-muted">
          Aún no tienes cotizaciones. Solicita una desde Cotizar.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  )
}
