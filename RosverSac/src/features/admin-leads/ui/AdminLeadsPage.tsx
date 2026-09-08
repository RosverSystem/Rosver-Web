import { LEADS } from '@/features/admin-leads/model/mocks'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'
import { useState } from 'react'

export function AdminLeadsPage() {
  const [selectedId, setSelectedId] = useState(LEADS[0]?.id)
  const selected = LEADS.find((l) => l.id === selectedId) ?? LEADS[0]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        Leads
      </h1>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <WireBlock label="Bandeja de contactos y solicitudes">
          <div className="flex flex-col divide-y divide-dashed divide-rosver-line">
            {LEADS.map((lead) => (
              <button
                type="button"
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className={`flex w-full flex-col gap-1 py-2.5 text-left ${
                  lead.id === selected?.id ? 'text-rosver-red' : 'text-rosver-ink'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{lead.name}</span>
                  <Badge tone={lead.channel === 'whatsapp' ? 'success' : 'info'}>
                    {lead.channel}
                  </Badge>
                </div>
                <span className="line-clamp-1 text-xs text-rosver-muted">
                  {lead.message}
                </span>
              </button>
            ))}
          </div>
        </WireBlock>

        <WireBlock label="Detalle">
          {selected ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-rosver-ink">
                {selected.name}
              </p>
              <p className="text-xs text-rosver-muted">
                {selected.contact} · {selected.date}
              </p>
              <p className="mt-2 text-sm text-rosver-ink">
                {selected.message}
              </p>
              <button
                type="button"
                className="mt-3 self-start rounded-full bg-rosver-red px-4 py-2 text-xs font-bold text-white"
              >
                Convertir en cotización
              </button>
            </div>
          ) : (
            <p className="text-sm text-rosver-muted">Selecciona un lead.</p>
          )}
        </WireBlock>
      </div>
    </div>
  )
}
