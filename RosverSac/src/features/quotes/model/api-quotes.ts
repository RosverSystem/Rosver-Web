import { api } from '@/shared/lib/api'
import { isQuotePipelineStatus } from '@/shared/lib/quote-pipeline'
import type { Quote, QuoteStatus } from '@/features/quotes/model/mocks'

export type AccountQuoteApi = {
  id: string
  code: string
  date: string
  status: string
  businessName?: string
  customerName?: string
  total?: number | null
  itemsSummary: string
  note?: string
  shareUrl?: string | null
  hasPdf?: boolean
  items: {
    name: string
    qty: number
    imageUrl: string
    unitPrice?: number
  }[]
}

function normalizeStatus(raw: string): QuoteStatus {
  if (isQuotePipelineStatus(raw)) return raw
  return 'recibida'
}

export function mapAccountQuoteApi(q: AccountQuoteApi): Quote {
  return {
    id: q.code,
    customerName: q.customerName || q.businessName || '—',
    date: q.date,
    itemsSummary: q.itemsSummary,
    items: q.items.map((i) => ({
      name: i.name,
      qty: i.qty,
      imageUrl: i.imageUrl || '',
    })),
    status: normalizeStatus(q.status),
    note: q.note,
  }
}

export async function fetchMyQuotes(): Promise<Quote[]> {
  const data = await api<{ items: AccountQuoteApi[] }>('/api/quotes/mine')
  return (data.items ?? []).map(mapAccountQuoteApi)
}
