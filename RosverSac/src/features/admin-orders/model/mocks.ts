import type { OrderPipelineStatus } from '@/shared/lib/order-pipeline'

export type OrderStatus = OrderPipelineStatus

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  confirmacion_pedido: 'neutral',
  confirmacion_pago: 'warning',
  realizando_envio: 'info',
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
    status: 'realizando_envio',
  },
  {
    id: 'PED-2199',
    customerName: 'Ferretería El Sol',
    date: '2026-08-14',
    total: 1180,
    status: 'confirmacion_pedido',
  },
  {
    id: 'PED-2188',
    customerName: 'Julia Ramírez',
    date: '2026-07-30',
    total: 207,
    status: 'entregado',
  },
]
