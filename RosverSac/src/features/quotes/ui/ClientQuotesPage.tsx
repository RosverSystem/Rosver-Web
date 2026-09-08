import {
  QUOTES,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_STEPS,
  QUOTE_STATUS_TONE,
  type Quote,
  type QuoteStatus,
} from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { StatusStepper } from '@/shared/ui/status-stepper'

function quoteStepIndex(status: QuoteStatus) {
  if (status === 'borrador') return -1
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
              <img
                src={item.imageUrl}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-rosver-line"
              />
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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-rosver-ink">
            Mis cotizaciones
          </h2>
          <p className="text-sm text-rosver-muted">
            Estado de revisión y productos solicitados
          </p>
        </div>
        <span className="rounded-full bg-rosver-yellow px-2.5 py-1 text-[10px] font-bold text-rosver-ink">
          Demo
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {QUOTES.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  )
}
