import { USERS, type Role } from '@/features/admin-users/model/mocks'
import { AdminSelect } from '@/shared/ui/admin-field'
import { WireBlock } from '@/shared/ui/wireframe'

const ROLE_LABEL: Record<Role, string> = {
  client: 'Cliente',
  sales: 'Ventas',
  admin: 'Administrador',
}

const ROLES: Role[] = ['client', 'sales', 'admin']

export function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        Usuarios
      </h1>

      <WireBlock label="Listado y asignación de rol">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-rosver-line text-xs text-rosver-muted uppercase">
                <th className="pb-2 font-semibold">Nombre</th>
                <th className="pb-2 font-semibold">Correo</th>
                <th className="pb-2 font-semibold">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-rosver-line">
              {USERS.map((user) => (
                <tr key={user.id}>
                  <td className="py-2.5 font-semibold text-rosver-ink">
                    {user.name}
                  </td>
                  <td className="py-2.5 text-rosver-muted">{user.email}</td>
                  <td className="py-2.5 min-w-[10rem]">
                    <AdminSelect defaultValue={user.role} aria-label="Rol">
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </AdminSelect>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WireBlock>
    </div>
  )
}
