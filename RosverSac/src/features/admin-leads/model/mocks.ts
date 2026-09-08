export type Lead = {
  id: string
  name: string
  contact: string
  message: string
  date: string
  channel: 'formulario' | 'whatsapp'
}

export const LEADS: Lead[] = [
  {
    id: 'LEAD-501',
    name: 'Carlos Medina',
    contact: '+51 988 111 222',
    message: '¿Tienen compresores de 50L disponibles?',
    date: '2026-08-25',
    channel: 'whatsapp',
  },
  {
    id: 'LEAD-498',
    name: 'Distribuidora Norte',
    contact: 'compras@distnorte.pe',
    message: 'Interesados en volumen de herramientas eléctricas.',
    date: '2026-08-24',
    channel: 'formulario',
  },
  {
    id: 'LEAD-492',
    name: 'Rosa Salazar',
    contact: '+51 966 333 444',
    message: 'Consulta por garantía de taladro comprado el mes pasado.',
    date: '2026-08-21',
    channel: 'formulario',
  },
]
