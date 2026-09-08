import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { AdminEmptyState } from '@/shared/ui/admin-field'
import { useEffect, useState } from 'react'

type HistoryEntry = {
  id: string
  action: 'created' | 'updated' | 'deactivated'
  oldAmount: number | null
  newAmount: number | null
  changedByEmail: string | null
  createdAt: string
}

const ACTION_LABEL: Record<HistoryEntry['action'], string> = {
  created: 'Precio creado',
  updated: 'Precio editado',
  deactivated: 'Precio quitado',
}

const ACTION_COLOR: Record<HistoryEntry['action'], string> = {
  created: 'bg-rosver-success/15 text-rosver-success',
  updated: 'bg-rosver-yellow/20 text-rosver-ink',
  deactivated: 'bg-rosver-red/10 text-rosver-red',
}

const DATETIME_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function money(n: number | null) {
  return n != null ? `S/ ${n.toFixed(2)}` : '—'
}

/** Historial de cambios de precio de un producto (auditoría). */
export function PriceHistoryPanel({ productId }: { productId: string }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await api<{ entries: HistoryEntry[] }>(
          `/api/admin/products/${productId}/price-history`,
        )
        if (!cancelled) setEntries(data.entries)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No se pudo cargar el historial')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [productId])

  return (
    <section className="space-y-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-bold text-rosver-ink">Historial de precios</h2>
      {loading ? (
        <AdminEmptyState title="Cargando…" />
      ) : error ? (
        <AdminEmptyState title="No se pudo cargar" detail={error} />
      ) : entries.length === 0 ? (
        <p className="text-sm text-rosver-muted">Todavía no hay cambios registrados.</p>
      ) : (
        <ul className="divide-y divide-rosver-line rounded-xl border border-rosver-line">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold',
                    ACTION_COLOR[e.action],
                  )}
                >
                  {ACTION_LABEL[e.action]}
                </span>
                <span className="text-xs text-rosver-muted">
                  {e.changedByEmail ?? 'admin'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-rosver-muted">
                  {e.oldAmount != null ? `${money(e.oldAmount)} → ` : ''}
                  {money(e.newAmount)}
                </span>
                <span className="text-xs text-rosver-muted">
                  {DATETIME_FMT.format(new Date(e.createdAt))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
