/** Fases del pipeline CRM de pedidos (admin + cuenta). */
export const ORDER_PIPELINE_STATUSES = [
  'confirmacion_pedido',
  'confirmacion_pago',
  'realizando_envio',
  'enviado',
  'entregado',
] as const

export type OrderPipelineStatus = (typeof ORDER_PIPELINE_STATUSES)[number]

export const ORDER_PIPELINE_LABEL: Record<OrderPipelineStatus, string> = {
  confirmacion_pedido: 'Confirmación de pedido',
  confirmacion_pago: 'Confirmación de pago',
  realizando_envio: 'Realizando envío',
  enviado: 'Enviado',
  entregado: 'Entregado',
}

/** Etiqueta corta para cabeceras de columna (móvil). */
export const ORDER_PIPELINE_SHORT: Record<OrderPipelineStatus, string> = {
  confirmacion_pedido: 'Pedido',
  confirmacion_pago: 'Pago',
  realizando_envio: 'Envío',
  enviado: 'Enviado',
  entregado: 'Entregado',
}

/**
 * Colores sólidos por fase (tokens Rosver).
 * Usar en badges de tabla / Kanban / cuenta.
 */
export const ORDER_PIPELINE_BADGE: Record<OrderPipelineStatus, string> = {
  confirmacion_pedido: 'bg-rosver-blue text-white',
  confirmacion_pago: 'bg-rosver-yellow text-rosver-ink',
  realizando_envio: 'bg-rosver-ink text-white',
  enviado: 'bg-rosver-red text-white',
  entregado: 'bg-rosver-success text-white',
}

export function isOrderPipelineStatus(v: string): v is OrderPipelineStatus {
  return (ORDER_PIPELINE_STATUSES as readonly string[]).includes(v)
}

export function nextPipelineStatus(
  current: OrderPipelineStatus,
): OrderPipelineStatus | null {
  const i = ORDER_PIPELINE_STATUSES.indexOf(current)
  if (i < 0 || i >= ORDER_PIPELINE_STATUSES.length - 1) return null
  return ORDER_PIPELINE_STATUSES[i + 1]
}
