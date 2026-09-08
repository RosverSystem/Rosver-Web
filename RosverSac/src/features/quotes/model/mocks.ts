export type QuoteStatus =
  | 'borrador'
  | 'enviada'
  | 'en revisión'
  | 'respondida'
  | 'cerrada'

export const QUOTE_STATUS_TONE: Record<
  QuoteStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  borrador: 'neutral',
  enviada: 'info',
  'en revisión': 'warning',
  respondida: 'success',
  cerrada: 'neutral',
}

export type Quote = {
  id: string
  customerName: string
  date: string
  itemsSummary: string
  status: QuoteStatus
}

export const QUOTES: Quote[] = [
  {
    id: 'COT-1042',
    customerName: 'Ferretería El Sol',
    date: '2026-08-20',
    itemsSummary: 'Taladro percutor 20V x2, Amoladora angular x1',
    status: 'en revisión',
  },
  {
    id: 'COT-1039',
    customerName: 'Comercial Vega SAC',
    date: '2026-08-18',
    itemsSummary: 'Set de llaves 40 pzs x12 (caja)',
    status: 'respondida',
  },
  {
    id: 'COT-1031',
    customerName: 'Julia Ramírez',
    date: '2026-08-12',
    itemsSummary: 'Parlante Bluetooth x6',
    status: 'cerrada',
  },
]
