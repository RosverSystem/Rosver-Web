import { api } from '@/shared/lib/api'
import { isOrderPipelineStatus } from '@/shared/lib/order-pipeline'
import type { Order, OrderStatus } from '@/features/account/model/mocks'

export type AccountOrderApi = {
  id: string
  code: string
  date: string
  status: string
  businessName?: string
  total: number
  itemsSummary: string
  trackingHint?: string
  shareUrl?: string | null
  items: {
    name: string
    qty: number
    imageUrl: string
    unitPrice: number
  }[]
}

function normalizeStatus(raw: string): OrderStatus {
  if (isOrderPipelineStatus(raw)) return raw
  return 'confirmacion_pedido'
}

export function mapAccountOrderApi(o: AccountOrderApi): Order {
  return {
    id: o.code,
    date: o.date,
    itemsSummary: o.itemsSummary,
    items: o.items.map((i) => ({
      name: i.name,
      qty: i.qty,
      imageUrl: i.imageUrl || '',
      unitPrice: Number(i.unitPrice) || 0,
    })),
    total: Number(o.total) || 0,
    status: normalizeStatus(o.status),
    trackingHint: o.trackingHint,
  }
}

export async function fetchMyOrders(): Promise<Order[]> {
  const data = await api<{ items: AccountOrderApi[] }>('/api/orders/mine')
  return (data.items ?? []).map(mapAccountOrderApi)
}

export async function fetchMyOrder(code: string): Promise<Order | null> {
  try {
    const data = await api<{ order: AccountOrderApi }>(
      `/api/orders/mine/${encodeURIComponent(code)}`,
    )
    return data.order ? mapAccountOrderApi(data.order) : null
  } catch {
    return null
  }
}
