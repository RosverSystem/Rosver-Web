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
  customerName: string
  date: string
  total: number
  status: OrderStatus
}

export const ORDERS: Order[] = [
  {
    id: 'PED-2201',
    customerName: 'Julia Ramírez',
    date: '2026-08-15',
    total: 249,
    status: 'en proceso',
  },
  {
    id: 'PED-2199',
    customerName: 'Ferretería El Sol',
    date: '2026-08-14',
    total: 1180,
    status: 'pendiente',
  },
  {
    id: 'PED-2188',
    customerName: 'Julia Ramírez',
    date: '2026-07-30',
    total: 207,
    status: 'entregado',
  },
]
