/** Estados del libro de reclamaciones (admin). */
export const COMPLAINT_PIPELINE_STATUSES = [
  'recibido',
  'en_revision',
  'respondido',
  'archivado',
] as const

export type ComplaintPipelineStatus =
  (typeof COMPLAINT_PIPELINE_STATUSES)[number]

export const COMPLAINT_PIPELINE_LABEL: Record<ComplaintPipelineStatus, string> =
  {
    recibido: 'Recibido',
    en_revision: 'En revisión',
    respondido: 'Respondido',
    archivado: 'Archivado',
  }

export const COMPLAINT_PIPELINE_BADGE: Record<ComplaintPipelineStatus, string> =
  {
    recibido: 'bg-rosver-blue text-white',
    en_revision: 'bg-rosver-yellow text-rosver-ink',
    respondido: 'bg-rosver-success text-white',
    archivado: 'bg-rosver-soft text-rosver-ink ring-1 ring-rosver-line',
  }

export const CLAIM_KIND_LABEL: Record<string, string> = {
  reclamo: 'Reclamo',
  queja: 'Queja',
}

export const GOOD_KIND_LABEL: Record<string, string> = {
  producto: 'Producto',
  servicio: 'Servicio',
}

export function isComplaintPipelineStatus(
  v: string,
): v is ComplaintPipelineStatus {
  return (COMPLAINT_PIPELINE_STATUSES as readonly string[]).includes(v)
}
