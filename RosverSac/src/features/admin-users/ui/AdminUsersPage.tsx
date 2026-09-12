import { useAuth } from '@/features/auth'
import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { AdminEmptyState, AdminPageHeader, AdminSelect } from '@/shared/ui/admin-field'
import { BootstrapTable } from '@/shared/ui/bootstrap-table'
import { useEffect, useMemo, useState } from 'react'
import { LoginAuditPanel } from './LoginAuditPanel'

type AdminUser = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  avatarUrl: string
  roleCode: string
  roleName: string
  status: string
  emailVerified: boolean
  createdAt: string
}

type Role = {
  id: string
  code: string
  name: string
}

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        api<{ users: AdminUser[] }>('/api/admin/users'),
        api<{ roles: Role[] }>('/api/admin/roles'),
      ])
      setUsers(usersData.users)
      setRoles(rolesData.roles)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar los usuarios',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.fullName ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roleName.toLowerCase().includes(q),
    )
  }, [users, query])

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length
    const verified = users.filter((u) => u.emailVerified).length
    return {
      total: users.length,
      active,
      inactive: users.length - active,
      verified,
    }
  }, [users])

  async function changeRole(u: AdminUser, roleId: string) {
    clear()
    setSavingId(u.id)
    try {
      await api(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId }),
      })
      await load()
      showMessages(['Rol actualizado'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo cambiar el rol',
      ])
    } finally {
      setSavingId(null)
    }
  }

  async function toggleStatus(u: AdminUser) {
    const nextStatus = u.status === 'active' ? 'disabled' : 'active'
    if (
      nextStatus === 'disabled' &&
      !window.confirm(`¿Desactivar a «${u.fullName ?? u.email}»? No podrá iniciar sesión.`)
    ) {
      return
    }
    clear()
    setSavingId(u.id)
    try {
      await api(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      await load()
      showMessages([
        nextStatus === 'active' ? 'Usuario activado' : 'Usuario desactivado',
      ])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo actualizar el estado',
      ])
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        eyebrow="Sistema"
        title="Usuarios"
        description="Cuentas, roles y estado de acceso."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Activos', value: stats.active, tone: 'success' },
          { label: 'Inactivos', value: stats.inactive, tone: 'danger' },
          { label: 'Verificados', value: stats.verified, tone: 'warning' },
        ]}
      />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, correo o rol…"
        className="h-11 w-full max-w-sm appearance-none rounded-xl border border-rosver-line bg-white px-3 text-sm text-rosver-ink shadow-sm outline-none transition placeholder:text-rosver-muted/80 hover:border-rosver-muted/40 focus:border-rosver-red/45 focus:ring-2 focus:ring-rosver-red/15"
      />

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No hay usuarios"
            detail="Ajusta la búsqueda o espera a que se registren clientes."
          />
        ) : (
          <div className="overflow-x-auto">
            <BootstrapTable responsive={false} className="min-w-[640px]">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const busy = savingId === u.id
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-rosver-line"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-rosver-ink">
                              {u.fullName ?? 'Sin nombre'}
                              {isSelf ? (
                                <span className="ml-1.5 text-[10px] font-bold text-rosver-muted">
                                  (tú)
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-rosver-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-[10rem]">
                        <AdminSelect
                          value={roles.find((r) => r.code === u.roleCode)?.id ?? ''}
                          onChange={(e) => void changeRole(u, e.target.value)}
                          disabled={busy}
                          aria-label={`Rol de ${u.email}`}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </AdminSelect>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-bold',
                            u.status === 'active'
                              ? 'bg-rosver-success/15 text-rosver-success'
                              : 'bg-rosver-red/10 text-rosver-red',
                          )}
                        >
                          {u.status === 'active' ? 'Activo' : 'Desactivado'}
                        </span>
                        {!u.emailVerified ? (
                          <span className="ml-1.5 rounded-full bg-rosver-soft px-2 py-1 text-[10px] font-semibold text-rosver-muted">
                            Correo sin verificar
                          </span>
                        ) : null}
                      </td>
                      <td className="text-rosver-muted">
                        {DATE_FMT.format(new Date(u.createdAt))}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => void toggleStatus(u)}
                          disabled={busy || isSelf}
                          className="text-xs font-semibold text-rosver-red hover:underline disabled:cursor-not-allowed disabled:text-rosver-muted disabled:no-underline"
                        >
                          {u.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </BootstrapTable>
          </div>
        )}
      </div>

      <LoginAuditPanel />
    </div>
  )
}
