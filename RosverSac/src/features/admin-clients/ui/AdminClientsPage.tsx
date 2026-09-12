import { fetchClients } from '@/features/admin-clients/model/api'
import type { ClientListItem } from '@/features/admin-clients/model/types'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Group, Search } from 'cssvg-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Listado de clientes registrados + acceso a detalle / interés.
 */
export function AdminClientsPage() {
  const { toasts, showErrors, dismiss } = useFormToasts()
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(query = q) {
    setLoading(true)
    try {
      const res = await fetchClients(query)
      setClients(res.clients)
    } catch (err) {
      showErrors([
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar clientes.',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-rosver-red uppercase">
            SystemRSV
          </p>
          <h1 className="font-display text-2xl font-bold text-rosver-ink">
            Clientes
          </h1>
          <p className="mt-1 max-w-xl text-sm text-rosver-muted">
            Cuentas registradas: interés en productos, últimos vistos y contacto
            para ofrecer ofertas.
          </p>
        </div>
        <p className="rounded-xl bg-rosver-soft px-3 py-2 text-sm font-bold tabular-nums text-rosver-ink">
          {clients.length} cliente{clients.length === 1 ? '' : 's'}
        </p>
      </header>

      <form
        className="flex flex-wrap gap-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void load(q)
        }}
      >
        <label className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-rosver-muted">
            <Search size={16} color="currentColor" strokeWidth={2} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o RUC…"
            className="w-full rounded-xl border border-rosver-line bg-white py-2.5 pr-3 pl-9 text-sm text-rosver-ink outline-none focus:border-rosver-red"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-rosver-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-rosver-red"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <p className="py-12 text-center text-sm text-rosver-muted">Cargando…</p>
      ) : !clients.length ? (
        <div className="rounded-2xl border border-dashed border-rosver-line bg-white px-6 py-14 text-center">
          <Group size={32} color="currentColor" strokeWidth={2} />
          <p className="mt-3 font-display text-lg font-bold text-rosver-ink">
            No hay clientes
          </p>
          <p className="mt-1 text-sm text-rosver-muted">
            Aparecerán cuando se registren con rol cliente en la tienda.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <li key={c.id}>
              <article className="flex h-full flex-col rounded-2xl border border-rosver-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-rosver-ink/20 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rosver-soft text-sm font-bold text-rosver-ink">
                    {(c.fullName || c.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold text-rosver-ink">
                      {c.fullName || 'Sin nombre'}
                    </h2>
                    <p className="truncate text-xs text-rosver-muted">{c.email}</p>
                    {c.companyName ? (
                      <p className="mt-0.5 truncate text-[11px] text-rosver-muted">
                        {c.companyName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Vistas" value={c.totalViews} />
                  <MiniStat label="SKUs" value={c.viewProductCount} />
                  <MiniStat label="Pedidos" value={c.orderCount} />
                </div>

                <p className="mt-3 text-[11px] text-rosver-muted">
                  {c.lastViewedAt
                    ? `Última vista: ${DATE_FMT.format(new Date(c.lastViewedAt))}`
                    : `Alta: ${DATE_FMT.format(new Date(c.createdAt))}`}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Link
                    to={`/admin/clientes/${c.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-rosver-red px-3 py-2 text-sm font-bold text-white hover:bg-rosver-red-dark"
                  >
                    Ver detalles
                  </Link>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-xl border px-2.5 text-[11px] font-bold',
                      c.status === 'active'
                        ? 'border-rosver-success/30 text-rosver-success'
                        : 'border-rosver-line text-rosver-muted',
                    )}
                  >
                    {c.status === 'active' ? 'Activo' : 'Off'}
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-rosver-soft/70 px-1 py-1.5">
      <p className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums text-rosver-ink">{value}</p>
    </div>
  )
}
