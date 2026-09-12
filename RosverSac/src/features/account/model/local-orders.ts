import type { CartLine } from '@/features/cart'
import type { Order, OrderItem, OrderStatus } from '@/features/account/model/mocks'
import { isOrderPipelineStatus } from '@/shared/lib/order-pipeline'

export type LocalOrderDraft = {
  /** Si viene del API (PD-…), se usa como id visible. */
  id?: string
  customerName: string
  docNumber: string
  phone: string
  city: string
  total: number
  items: OrderItem[]
}

const KEY = 'rosver.local-orders.v1'

function normalizeStatus(raw: unknown): OrderStatus {
  if (typeof raw !== 'string') return 'confirmacion_pedido'
  if (isOrderPipelineStatus(raw)) return raw
  if (raw === 'pendiente') return 'confirmacion_pedido'
  if (raw === 'enproceso') return 'realizando_envio'
  if (raw === 'enviado' || raw === 'entregado') return raw
  return 'confirmacion_pedido'
}

export function readLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isOrderLike).map((o) => ({
      ...o,
      status: normalizeStatus(o.status),
    }))
  } catch {
    return []
  }
}

function isOrderLike(x: unknown): x is Order {
  if (!x || typeof x !== 'object') return false
  const o = x as Order
  return Boolean(o.id && o.date && Array.isArray(o.items))
}

export function saveLocalOrder(order: Order) {
  const prev = readLocalOrders().filter((o) => o.id !== order.id)
  localStorage.setItem(KEY, JSON.stringify([order, ...prev].slice(0, 40)))
}

export function buildLocalOrderId() {
  const d = new Date()
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rnd = String(Math.floor(Math.random() * 900) + 100)
  return `LOC-${stamp}-${rnd}`
}

export function createLocalOrderFromCart(draft: LocalOrderDraft): Order {
  const id = draft.id?.trim() || buildLocalOrderId()
  const date = new Date().toISOString().slice(0, 10)
  const status: OrderStatus = 'confirmacion_pedido'
  const itemsSummary = draft.items
    .map((i) => `${i.name} x${i.qty}`)
    .join(', ')
    .slice(0, 120)
  return {
    id,
    date,
    itemsSummary: itemsSummary || 'Pedido desde carrito',
    items: draft.items,
    total: draft.total,
    status,
    trackingHint: `Solicitud enviada · ${draft.customerName}${draft.docNumber ? ` · Doc ${draft.docNumber}` : ''}`,
  }
}

export function cartLinesToOrderItems(
  rows: {
    line: CartLine
    name: string
    unitPrice: number | null
    imageUrl?: string
  }[],
): OrderItem[] {
  return rows.map(({ line, name, unitPrice, imageUrl }) => ({
    name: line.packagingLabel ? `${name} (${line.packagingLabel})` : name,
    qty: line.quantity,
    imageUrl:
      imageUrl ||
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=240&h=240&q=60',
    unitPrice: unitPrice ?? 0,
  }))
}
