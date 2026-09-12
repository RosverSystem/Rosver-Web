/** Fases del pipeline comercial de cotizaciones (admin + cuenta). */
export const QUOTE_PIPELINE_STATUSES = [
  'recibida',
  'en_revision',
  'respondida',
  'aceptada',
  'cerrada',
] as const

export type QuotePipelineStatus = (typeof QUOTE_PIPELINE_STATUSES)[number]

export const QUOTE_PIPELINE_LABEL: Record<QuotePipelineStatus, string> = {
  recibida: 'Recibida',
  en_revision: 'En revisión',
  respondida: 'Respondida',
  aceptada: 'Aceptada',
  cerrada: 'Cerrada',
}

export const QUOTE_PIPELINE_SHORT: Record<QuotePipelineStatus, string> = {
  recibida: 'Recibida',
  en_revision: 'Revisión',
  respondida: 'Respondida',
  aceptada: 'Aceptada',
  cerrada: 'Cerrada',
}

export const QUOTE_PIPELINE_BADGE: Record<QuotePipelineStatus, string> = {
  recibida: 'bg-rosver-blue text-white',
  en_revision: 'bg-rosver-yellow text-rosver-ink',
  respondida: 'bg-rosver-ink text-white',
  aceptada: 'bg-rosver-success text-white',
  cerrada: 'bg-rosver-soft text-rosver-ink ring-1 ring-rosver-line',
}

export function isQuotePipelineStatus(v: string): v is QuotePipelineStatus {
  return (QUOTE_PIPELINE_STATUSES as readonly string[]).includes(v)
}

export function nextQuotePipelineStatus(
  current: QuotePipelineStatus,
): QuotePipelineStatus | null {
  const i = QUOTE_PIPELINE_STATUSES.indexOf(current)
  if (i < 0 || i >= QUOTE_PIPELINE_STATUSES.length - 1) return null
  return QUOTE_PIPELINE_STATUSES[i + 1]
}
