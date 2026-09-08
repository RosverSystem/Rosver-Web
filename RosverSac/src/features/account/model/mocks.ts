export type OrderStatus = 'pendiente' | 'en proceso' | 'enviado' | 'entregado'

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  pendiente: 'neutral',
  'en proceso': 'warning',
  enviado: 'info',
  entregado: 'success',
}

export type Order = {
  id: string
  date: string
  itemsSummary: string
  total: number
  status: OrderStatus
}

export const ORDERS: Order[] = [
  {
    id: 'PED-2201',
    date: '2026-08-15',
    itemsSummary: 'Taladro percutor 20V x1',
    total: 249,
    status: 'en proceso',
  },
  {
    id: 'PED-2188',
    date: '2026-07-30',
    itemsSummary: 'Kit destornilladores x2, Parlante Bluetooth x1',
    total: 207,
    status: 'entregado',
  },
]
