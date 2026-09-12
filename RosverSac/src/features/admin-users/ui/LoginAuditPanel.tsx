import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { AdminEmptyState } from '@/shared/ui/admin-field'
import { BootstrapTable } from '@/shared/ui/bootstrap-table'
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
        <BootstrapTable className="min-w-[520px]" size="sm">
          <thead>
            <tr>
              <th>Correo</th>
              <th>Resultado</th>
              <th>IP</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.email}</td>
                <td>
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
                <td className="text-rosver-muted">{e.ip ?? '—'}</td>
                <td className="text-rosver-muted">
                  {DATETIME_FMT.format(new Date(e.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </BootstrapTable>
      )}
    </div>
  )
}
