import { QUOTES, QUOTE_STATUS_TONE } from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'

export function ClientQuotesPage() {
  return (
    <WireBlock label="Mis cotizaciones">
      <div className="flex flex-col divide-y divide-dashed divide-rosver-line">
        {QUOTES.map((quote) => (
          <div
            key={quote.id}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-rosver-ink">
                {quote.id} · {quote.date}
              </p>
              <p className="text-xs text-rosver-muted">{quote.itemsSummary}</p>
            </div>
            <Badge tone={QUOTE_STATUS_TONE[quote.status]}>
              {quote.status}
            </Badge>
          </div>
        ))}
      </div>
    </WireBlock>
  )
}
