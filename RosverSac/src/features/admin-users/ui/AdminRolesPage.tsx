import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Pen, Trash } from 'cssvg-icons'
import { useEffect, useMemo, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Permission = {
  id: string
  module: string
  action: string
  code: string
  description: string | null
}

type Role = {
  id: string
  code: string
  name: string
  description: string | null
  is_system: boolean
  permissions: string[]
}

type PermsByModule = Record<string, Permission[]>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByModule(perms: Permission[]): PermsByModule {
  const out: PermsByModule = {}
  for (const p of perms) {
    ;(out[p.module] ??= []).push(p)
  }
  return out
}

function roleBadge(role: Role) {
  if (role.is_system)
    return (
      <span className="ml-1 rounded-full bg-rosver-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rosver-ink">
        sistema
      </span>
    )
  return null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminRolesPage() {
  const { toasts, showMessages, showSuccess, dismiss, clear } = useFormToasts()

  const [roles, setRoles] = useState<Role[]>([])
  const [allPerms, setAllPerms] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPerms, setNewPerms] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  // Permissions matrix modal
  const [permOpen, setPermOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editPerms, setEditPerms] = useState<Set<string>>(new Set())
  const [permBusy, setPermBusy] = useState(false)

  const permsByModule = useMemo(() => groupByModule(allPerms), [allPerms])

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    setLoading(true)
    try {
      const [rolesData, permsData] = await Promise.all([
        api<{ roles: Role[] }>('/api/admin/roles'),
        api<{ permissions: Permission[] }>('/api/admin/permissions'),
      ])
      setRoles(rolesData.roles)
      setAllPerms(permsData.permissions)
    } catch (e) {
      showMessages([e instanceof ApiError ? e.message : 'No se pudo cargar roles'])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // ── Create role ───────────────────────────────────────────────────────────

  function openCreate() {
    setNewCode('')
    setNewName('')
    setNewDesc('')
    setNewPerms(new Set())
    setCreateOpen(true)
  }

  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const errs: string[] = []
    if (!newName.trim()) errs.push('Escribe el nombre del rol')
    if (!newCode.trim()) errs.push('Escribe el código del rol')
    if (!/^[a-z0-9_]+$/.test(newCode.trim()))
      errs.push('Código: solo minúsculas, números y guion bajo')
    if (errs.length) { showMessages(errs); return }

    setBusy(true)
    try {
      await api('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.trim(),
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          permissionCodes: [...newPerms],
        }),
      })
      showSuccess(['Rol creado correctamente'])
      setCreateOpen(false)
      await load()
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo crear el rol'])
    } finally {
      setBusy(false)
    }
  }

  // ── Edit permissions ──────────────────────────────────────────────────────

  function openPermModal(role: Role) {
    setEditingRole(role)
    setEditPerms(new Set(role.permissions))
    setPermOpen(true)
  }

  function togglePerm(code: string) {
    setEditPerms((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function toggleModule(_module: string, perms: Permission[], checked: boolean) {
    setEditPerms((prev) => {
      const next = new Set(prev)
      for (const p of perms) {
        if (checked) next.add(p.code)
        else next.delete(p.code)
      }
      return next
    })
  }

  async function onPermSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRole) return
    setPermBusy(true)
    try {
      await api(`/api/admin/roles/${editingRole.id}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissionCodes: [...editPerms] }),
      })
      showSuccess(['Permisos actualizados'])
      setPermOpen(false)
      await load()
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo guardar los permisos'])
    } finally {
      setPermBusy(false)
    }
  }

  // ── Delete role ───────────────────────────────────────────────────────────

  async function onDelete(role: Role) {
    if (role.is_system) {
      showMessages(['No se pueden eliminar roles del sistema.'])
      return
    }
    if (!window.confirm(`¿Eliminar el rol «${role.name}»? Los usuarios con este rol pasarán a «cliente».`)) return
    clear()
    try {
      await api(`/api/admin/roles/${role.id}`, { method: 'DELETE' })
      showSuccess([`Rol «${role.name}» eliminado`])
      await load()
    } catch (err) {
      showMessages([err instanceof ApiError ? err.message : 'No se pudo eliminar el rol'])
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <AdminPageHeader
        title="Roles y permisos"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-rosver-red px-4 py-2 text-sm font-semibold text-white hover:bg-rosver-red-dark"
          >
            Nuevo rol
          </button>
        }
      />

      {loading ? (
        <div className="py-10 text-center text-sm text-rosver-muted">Cargando roles…</div>
      ) : roles.length === 0 ? (
        <AdminEmptyState
          title="Sin roles definidos"
          detail="Crea el primer rol personalizado."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEditPerms={() => openPermModal(role)}
              onDelete={() => onDelete(role)}
            />
          ))}
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      <AdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo rol"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-rosver-line px-4 py-2 text-sm text-rosver-ink hover:bg-rosver-soft"
            >
              Cancelar
            </button>
            <button
              form="create-role-form"
              type="submit"
              disabled={busy}
              className="rounded-lg bg-rosver-red px-5 py-2 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Creando…' : 'Crear rol'}
            </button>
          </>
        }
      >
        <form id="create-role-form" noValidate onSubmit={onCreateSubmit} className="flex flex-col gap-4">
          <AdminField label="Nombre del rol">
            <AdminInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Supervisor de ventas"
            />
          </AdminField>
          <AdminField label="Código" hint="Solo minúsculas, números y _ (sin espacios)">
            <AdminInput
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="supervisor_ventas"
            />
          </AdminField>
          <AdminField label="Descripción (opcional)">
            <AdminInput
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Breve descripción del rol"
            />
          </AdminField>

          {/* Permissions compact matrix */}
          {allPerms.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-rosver-muted">
                Permisos iniciales
              </span>
              <PermMatrix
                permsByModule={permsByModule}
                selected={newPerms}
                onTogglePerm={(code) => setNewPerms((p) => {
                  const n = new Set(p)
                  if (n.has(code)) n.delete(code); else n.add(code)
                  return n
                })}
                onToggleModule={(_mod, perms, checked) =>
                  setNewPerms((prev) => {
                    const n = new Set(prev)
                    for (const p of perms) { if (checked) n.add(p.code); else n.delete(p.code) }
                    return n
                  })
                }
              />
            </div>
          )}
        </form>
      </AdminModal>

      {/* ── Permissions modal ──────────────────────────────────────────────── */}
      <AdminModal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        title={editingRole ? `Permisos — ${editingRole.name}` : 'Permisos'}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPermOpen(false)}
              className="rounded-lg border border-rosver-line px-4 py-2 text-sm text-rosver-ink hover:bg-rosver-soft"
            >
              Cancelar
            </button>
            <button
              form="perm-role-form"
              type="submit"
              disabled={permBusy}
              className="rounded-lg bg-rosver-red px-5 py-2 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {permBusy ? 'Guardando…' : 'Guardar permisos'}
            </button>
          </>
        }
      >
        {editingRole?.is_system && (
          <p className="mb-3 rounded-lg bg-rosver-soft px-4 py-2 text-sm text-rosver-muted">
            Este es un rol del sistema. Puedes ver sus permisos pero los cambios
            son persistentes — úsalo con precaución.
          </p>
        )}
        <form id="perm-role-form" noValidate onSubmit={onPermSave}>
          <PermMatrix
            permsByModule={permsByModule}
            selected={editPerms}
            onTogglePerm={togglePerm}
            onToggleModule={toggleModule}
          />
        </form>
      </AdminModal>
    </div>
  )
}

// ─── RoleCard ─────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  onEditPerms,
  onDelete,
}: {
  role: Role
  onEditPerms: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-rosver-line bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-sm font-bold text-rosver-ink">
            {role.name}
            {roleBadge(role)}
          </div>
          <span className="text-[11px] font-mono text-rosver-muted">{role.code}</span>
          {role.description && (
            <p className="mt-1 text-xs text-rosver-muted line-clamp-2">{role.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            title="Editar permisos"
            onClick={onEditPerms}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink"
          >
            <Pen size={15} color="currentColor" />
          </button>
          {!role.is_system && (
            <button
              type="button"
              title="Eliminar rol"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-rosver-muted hover:bg-red-50 hover:text-rosver-red"
            >
              <Trash size={15} color="currentColor" />
            </button>
          )}
        </div>
      </div>

      {/* Permission chips */}
      <div className="flex flex-wrap gap-1">
        {role.permissions.length === 0 ? (
          <span className="text-xs text-rosver-muted italic">Sin permisos asignados</span>
        ) : (
          role.permissions.slice(0, 12).map((code) => (
            <span
              key={code}
              className="rounded-full bg-rosver-soft px-2 py-0.5 text-[10px] font-medium text-rosver-ink"
            >
              {code}
            </span>
          ))
        )}
        {role.permissions.length > 12 && (
          <span className="rounded-full bg-rosver-soft px-2 py-0.5 text-[10px] text-rosver-muted">
            +{role.permissions.length - 12} más
          </span>
        )}
      </div>
    </div>
  )
}

// ─── PermMatrix ───────────────────────────────────────────────────────────────

function PermMatrix({
  permsByModule,
  selected,
  onTogglePerm,
  onToggleModule,
}: {
  permsByModule: PermsByModule
  selected: Set<string>
  onTogglePerm: (code: string) => void
  onToggleModule: (module: string, perms: Permission[], checked: boolean) => void
}) {
  return (
    <div className="flex flex-col divide-y divide-rosver-line overflow-hidden rounded-lg border border-rosver-line">
      {Object.entries(permsByModule).map(([module, perms]) => {
        const allChecked = perms.every((p) => selected.has(p.code))
        const someChecked = !allChecked && perms.some((p) => selected.has(p.code))
        return (
          <div key={module} className="bg-white">
            {/* Module header */}
            <label className={cn(
              'flex cursor-pointer items-center gap-2 bg-rosver-soft px-3 py-2',
              allChecked && 'bg-rosver-soft/80',
            )}>
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked }}
                onChange={(e) => onToggleModule(module, perms, e.target.checked)}
                className="h-4 w-4 accent-rosver-red"
              />
              <span className="text-xs font-bold uppercase tracking-wide text-rosver-ink">
                {module}
              </span>
            </label>
            {/* Actions */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-2 sm:grid-cols-3 md:grid-cols-4">
              {perms.map((p) => (
                <label key={p.code} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selected.has(p.code)}
                    onChange={() => onTogglePerm(p.code)}
                    className="h-3.5 w-3.5 accent-rosver-red"
                  />
                  <span className="text-xs text-rosver-ink">{p.action}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
