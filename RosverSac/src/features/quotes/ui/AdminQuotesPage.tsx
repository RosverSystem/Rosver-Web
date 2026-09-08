import { QUOTES, QUOTE_STATUS_TONE } from '@/features/quotes/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'

export function AdminQuotesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        Cotizaciones
      </h1>

      <WireBlock label="Inbox — lead o cliente → cotización">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-rosver-line text-xs text-rosver-muted uppercase">
                <th className="pb-2 font-semibold">ID</th>
                <th className="pb-2 font-semibold">Cliente</th>
                <th className="pb-2 font-semibold">Fecha</th>
                <th className="pb-2 font-semibold">Ítems</th>
                <th className="pb-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-rosver-line">
              {QUOTES.map((quote) => (
                <tr key={quote.id}>
                  <td className="py-2.5 font-semibold text-rosver-ink">
                    {quote.id}
                  </td>
                  <td className="py-2.5">{quote.customerName}</td>
                  <td className="py-2.5 text-rosver-muted">{quote.date}</td>
                  <td className="py-2.5 text-rosver-muted">
                    {quote.itemsSummary}
                  </td>
                  <td className="py-2.5">
                    <Badge tone={QUOTE_STATUS_TONE[quote.status]}>
                      {quote.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WireBlock>
    </div>
  )
}
