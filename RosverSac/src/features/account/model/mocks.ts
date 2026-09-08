export type OrderStatus = 'pendiente' | 'en proceso' | 'enviado' | 'entregado'

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pendiente',
  'en proceso',
  'enviado',
  'entregado',
]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  'en proceso': 'En proceso',
  enviado: 'Enviado',
  entregado: 'Entregado',
}

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  pendiente: 'neutral',
  'en proceso': 'warning',
  enviado: 'info',
  entregado: 'success',
}

export type OrderItem = {
  name: string
  qty: number
  imageUrl: string
  unitPrice: number
}

export type Order = {
  id: string
  date: string
  itemsSummary: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  trackingHint?: string
}

const IMG = {
  taladro:
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=240&h=240&q=70',
  destornilladores:
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=240&h=240&q=70',
  parlante:
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=240&h=240&q=70',
}

export const ORDERS: Order[] = [
  {
    id: 'PED-2201',
    date: '2026-08-15',
    itemsSummary: 'Taladro percutor 20V x1',
    items: [
      {
        name: 'Taladro percutor inalámbrico 20V',
        qty: 1,
        imageUrl: IMG.taladro,
        unitPrice: 249,
      },
    ],
    total: 249,
    status: 'en proceso',
    trackingHint: 'Preparando despacho en almacén Lima',
  },
  {
    id: 'PED-2188',
    date: '2026-07-30',
    itemsSummary: 'Kit destornilladores x2, Parlante Bluetooth x1',
    items: [
      {
        name: 'Kit destornilladores de precisión',
        qty: 2,
        imageUrl: IMG.destornilladores,
        unitPrice: 59,
      },
      {
        name: 'Parlante Bluetooth portátil',
        qty: 1,
        imageUrl: IMG.parlante,
        unitPrice: 89,
      },
    ],
    total: 207,
    status: 'entregado',
    trackingHint: 'Entregado el 2026-08-05',
  },
]
