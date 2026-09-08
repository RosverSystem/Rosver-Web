import { QUOTES, QUOTE_STATUS_TONE } from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'

export function ClientQuotesPage() {
  return (
    <section className="rounded-2xl border border-rosver-line bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-rosver-line px-4 py-3 sm:px-5">
        <h2 className="font-display text-base font-bold text-rosver-ink">
          Mis cotizaciones
        </h2>
        <span className="rounded bg-rosver-yellow/80 px-1.5 py-0.5 text-[10px] font-bold text-rosver-ink">
          Demo
        </span>
      </div>
      <ul className="divide-y divide-rosver-line">
        {QUOTES.map((quote) => (
          <li
            key={quote.id}
            className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rosver-ink">
                {quote.id}
                <span className="ml-2 font-normal text-rosver-muted">
                  {quote.date}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-rosver-muted">
                {quote.itemsSummary}
              </p>
            </div>
            <Badge tone={QUOTE_STATUS_TONE[quote.status]}>{quote.status}</Badge>
          </li>
        ))}
      </ul>
    </section>
  )
}
