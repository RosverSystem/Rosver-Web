import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { AdminEmptyState } from '@/shared/ui/admin-field'
import { useEffect, useState } from 'react'

type AuditEntry = {
  id: string
  userId: string | null
  email: string
  ip: string | null
  success: boolean
  reason: string | null
  createdAt: string
}

const REASON_LABEL: Record<string, string> = {
  bad_credentials: 'Credenciales incorrectas',
  bad_totp: 'Código 2FA incorrecto',
  disabled: 'Cuenta desactivada',
}

const DATETIME_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function LoginAuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await api<{ entries: AuditEntry[] }>('/api/admin/login-audit?limit=50')
        if (!cancelled) setEntries(data.entries)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No se pudo cargar la actividad')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
      <div className="border-b border-rosver-line px-4 py-3">
        <h3 className="text-sm font-semibold text-rosver-ink">Actividad de inicio de sesión</h3>
        <p className="text-xs text-rosver-muted">Últimos 50 intentos, exitosos y fallidos.</p>
      </div>
      {loading ? (
        <AdminEmptyState title="Cargando…" />
      ) : error ? (
        <AdminEmptyState title="No se pudo cargar" detail={error} />
      ) : entries.length === 0 ? (
        <AdminEmptyState title="Todavía no hay actividad registrada" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-rosver-line bg-rosver-soft/60 text-xs text-rosver-muted uppercase">
                <th className="px-4 py-2.5 font-semibold">Correo</th>
                <th className="px-4 py-2.5 font-semibold">Resultado</th>
                <th className="px-4 py-2.5 font-semibold">IP</th>
                <th className="px-4 py-2.5 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosver-line">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-rosver-ink">{e.email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        e.success
                          ? 'bg-rosver-success/15 text-rosver-success'
                          : 'bg-rosver-red/10 text-rosver-red',
                      )}
                    >
                      {e.success ? 'Éxito' : (e.reason && REASON_LABEL[e.reason]) || 'Fallo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-rosver-muted">{e.ip ?? '—'}</td>
                  <td className="px-4 py-2.5 text-rosver-muted">
                    {DATETIME_FMT.format(new Date(e.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
