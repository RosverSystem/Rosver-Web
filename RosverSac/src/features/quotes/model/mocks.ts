import {
  QUOTE_PIPELINE_LABEL,
  QUOTE_PIPELINE_STATUSES,
  type QuotePipelineStatus,
} from '@/shared/lib/quote-pipeline'

export type QuoteStatus = QuotePipelineStatus

/** Pasos visibles tipo tracker. */
export const QUOTE_STATUS_STEPS: QuoteStatus[] = [...QUOTE_PIPELINE_STATUSES]

export const QUOTE_STATUS_LABEL = QUOTE_PIPELINE_LABEL

export const QUOTE_STATUS_TONE: Record<
  QuoteStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  recibida: 'info',
  en_revision: 'warning',
  respondida: 'success',
  aceptada: 'success',
  cerrada: 'neutral',
}

export type QuoteItem = {
  name: string
  qty: number
  imageUrl: string
}

export type Quote = {
  id: string
  customerName: string
  date: string
  itemsSummary: string
  items: QuoteItem[]
  status: QuoteStatus
  note?: string
}

const IMG = {
  taladro:
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=240&h=240&q=70',
  amoladora:
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=240&h=240&q=70',
  llaves:
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=240&h=240&q=70',
  parlante:
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=240&h=240&q=70',
}

export const QUOTES: Quote[] = [
  {
    id: 'COT-1042',
    customerName: 'Ferretería El Sol',
    date: '2026-08-20',
    itemsSummary: 'Taladro percutor 20V x2, Amoladora angular x1',
    items: [
      { name: 'Taladro percutor 20V', qty: 2, imageUrl: IMG.taladro },
      { name: 'Amoladora angular 115mm', qty: 1, imageUrl: IMG.amoladora },
    ],
    status: 'en_revision',
    note: 'Comercial revisando stock y precios mayoristas',
  },
  {
    id: 'COT-1039',
    customerName: 'Comercial Vega SAC',
    date: '2026-08-18',
    itemsSummary: 'Set de llaves 40 pzs x12 (caja)',
    items: [
      { name: 'Set de llaves combinadas 40 pzs', qty: 12, imageUrl: IMG.llaves },
    ],
    status: 'respondida',
    note: 'Cotización enviada por correo · válida 7 días',
  },
  {
    id: 'COT-1031',
    customerName: 'Julia Ramírez',
    date: '2026-08-12',
    itemsSummary: 'Parlante Bluetooth x6',
    items: [
      { name: 'Parlante Bluetooth portátil', qty: 6, imageUrl: IMG.parlante },
    ],
    status: 'cerrada',
    note: 'Cerrada sin conversión',
  },
]
