import { config } from './config.js'
import { pool } from './db.js'
import { hashPassword } from './lib/crypto.js'
import {
  ensureModule,
  ensureModulePermissions,
  grantAllPermissionsToRole,
  grantPermissionsToRole,
} from './lib/rbac.js'

const MODULES: Array<{ code: string; name: string; actions: string[] }> = [
  {
    code: 'auth',
    name: 'Autenticación',
    actions: ['login', 'register', 'logout', 'manage'],
  },
  {
    code: 'account',
    name: 'Cuenta cliente',
    actions: ['read', 'update'],
  },
  {
    code: 'catalog',
    name: 'Catálogo',
    actions: ['read'],
  },
  {
    code: 'admin',
    name: 'Panel ERP',
    actions: ['read', 'manage'],
  },
  {
    code: 'admin.users',
    name: 'Usuarios',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
  {
    code: 'admin.roles',
    name: 'Roles y permisos',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
  {
    code: 'admin.catalog',
    name: 'Catálogo admin',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
  {
    code: 'admin.content',
    name: 'Contenido web',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
  {
    code: 'admin.leads',
    name: 'Leads',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
  {
    code: 'admin.orders',
    name: 'Pedidos',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
  {
    code: 'admin.quotes',
    name: 'Cotizaciones',
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
]

async function upsertRole(
  code: string,
  name: string,
  description: string,
  isSystem: boolean,
) {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO roles (code, name, description, is_system)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           updated_at = now()
     RETURNING id`,
    [code, name, description, isSystem],
  )
  return rows[0].id
}

async function upsertUser(params: {
  email: string
  password: string
  roleId: string
  fullName: string
  phone: string
  avatarUrl: string
}) {
  const passwordHash = await hashPassword(params.password)
  await pool.query(
    `INSERT INTO users (
       email, password_hash, role_id, full_name, phone, avatar_url, email_verified_at
     ) VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role_id = EXCLUDED.role_id,
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       avatar_url = CASE
         WHEN users.avatar_url LIKE '/avatars/%' THEN EXCLUDED.avatar_url
         ELSE users.avatar_url
       END,
       email_verified_at = COALESCE(users.email_verified_at, now()),
       status = 'active',
       updated_at = now()`,
    [
      params.email,
      passwordHash,
      params.roleId,
      params.fullName,
      params.phone,
      params.avatarUrl,
    ],
  )
}

async function seed() {
  for (const mod of MODULES) {
    await ensureModule(mod.code, mod.name)
    await ensureModulePermissions(mod.code, mod.actions)
  }

  const adminRoleId = await upsertRole(
    'admin',
    'Administrador',
    'Acceso total SystemRSV / ERP',
    true,
  )
  const clientRoleId = await upsertRole(
    'client',
    'Cliente',
    'Cuenta ecommerce / pedidos y perfil',
    true,
  )

  await grantAllPermissionsToRole(adminRoleId)
  await grantPermissionsToRole(clientRoleId, [
    'account.read',
    'account.update',
    'auth.logout',
    'catalog.read',
  ])

  await upsertUser({
    email: config.seed.adminEmail,
    password: config.seed.adminPassword,
    roleId: adminRoleId,
    fullName: 'Admin Acosta',
    phone: '+51999999999',
    avatarUrl: '/avatars/default-admin.svg',
  })

  const skipClient = process.env.SEED_SKIP_CLIENT === '1'
  if (!skipClient) {
    await upsertUser({
      email: config.seed.clientEmail,
      password: config.seed.clientPassword,
      roleId: clientRoleId,
      fullName: 'Cliente demo',
      phone: '+51988888888',
      avatarUrl: '/avatars/default-1.svg',
    })
  }

  console.log('✓ Seed RBAC + usuarios listo')
  console.log(`  admin:  ${config.seed.adminEmail}`)
  if (skipClient) {
    console.log('  client: (omitido SEED_SKIP_CLIENT=1)')
  } else {
    console.log(`  client: ${config.seed.clientEmail}`)
  }
  await pool.end()
}

seed().catch((err) => {
  console.error('Seed falló:', err)
  process.exit(1)
})
