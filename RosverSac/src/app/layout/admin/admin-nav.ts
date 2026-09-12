import { Award, Camera, Caption, Check, Compass, Download, Gauge, Group, Hardrive, Home, Message, Settings, StarGrow, Verified } from 'cssvg-icons'
import type { ComponentType } from 'react'

type IconProps = { size?: number; color?: string; strokeWidth?: number }

export type AdminNavLeaf = {
  id: string
  name: string
  link: string
  keywords: string[]
  Icon: ComponentType<IconProps>
}

export type AdminNavGroup = {
  id: string
  name: string
  Icon: ComponentType<IconProps>
  children: AdminNavLeaf[]
}

export type AdminNavEntry =
  | ({ type: 'link' } & AdminNavLeaf)
  | ({ type: 'group' } & AdminNavGroup)

/** Nav SystemRSV — productos, presentaciones, taxonomía. */
export const ADMIN_NAV: AdminNavEntry[] = [
  {
    type: 'link',
    id: 'inicio',
    name: 'Inicio',
    link: '/admin',
    keywords: ['dashboard', 'home', 'resumen'],
    Icon: Home,
  },
  {
    type: 'link',
    id: 'analitica',
    name: 'Analítica',
    link: '/admin/analitica',
    keywords: [
      'analitica',
      'analytics',
      'tops',
      'graficas',
      'vistas',
      'tendencia',
      'ranking',
      'kpi',
    ],
    Icon: Gauge,
  },
  {
    type: 'link',
    id: 'almacenamiento',
    name: 'Almacenamiento',
    link: '/admin/almacenamiento',
    keywords: [
      'r2',
      'media',
      'imagenes',
      'archivos',
      'cloudflare',
      'almacen',
      'storage',
    ],
    Icon: Hardrive,
  },
  {
    type: 'link',
    id: 'usuarios',
    name: 'Usuarios',
    link: '/admin/usuarios',
    keywords: ['usuarios', 'equipo', 'cuentas', 'staff'],
    Icon: Group,
  },
  {
    type: 'link',
    id: 'roles',
    name: 'Roles',
    link: '/admin/roles',
    keywords: ['roles', 'permisos', 'accesos', 'rbac', 'autorización'],
    Icon: Settings,
  },
  {
    type: 'link',
    id: 'clientes',
    name: 'Clientes',
    link: '/admin/clientes',
    keywords: [
      'clientes',
      'customers',
      'interes',
      'vistas',
      'ofertas',
      'whatsapp',
      'crm',
    ],
    Icon: Caption,
  },
  {
    type: 'link',
    id: 'cotizaciones',
    name: 'Cotizaciones',
    link: '/admin/cotizaciones',
    keywords: [
      'cotizaciones',
      'quotes',
      'cotizar',
      'leads',
      'whatsapp',
      'pdf',
    ],
    Icon: StarGrow,
  },
  {
    type: 'link',
    id: 'pedidos',
    name: 'Pedidos',
    link: '/admin/pedidos',
    keywords: ['pedidos', 'orders', 'carrito', 'pdf', 'whatsapp'],
    Icon: Award,
  },
  {
    type: 'link',
    id: 'leads',
    name: 'Contactos',
    link: '/admin/leads',
    keywords: ['contactos', 'leads', 'mensajes', 'formulario', 'bandeja'],
    Icon: Message,
  },
  {
    type: 'link',
    id: 'contenido',
    name: 'Contenido',
    link: '/admin/contenido',
    keywords: ['contenido', 'hero', 'home', 'cms', 'slides'],
    Icon: Camera,
  },
  {
    type: 'link',
    id: 'reclamaciones',
    name: 'Reclamaciones',
    link: '/admin/reclamaciones',
    keywords: [
      'libro',
      'reclamaciones',
      'reclamo',
      'queja',
      'indecopi',
      'consumidor',
    ],
    Icon: Message,
  },
  {
    type: 'group',
    id: 'catalogo',
    name: 'Catálogo',
    Icon: Compass,
    children: [
      {
        id: 'productos',
        name: 'Productos',
        link: '/admin/productos',
        keywords: ['catalogo', 'sku', 'stock', 'productos', 'ficha'],
        Icon: Download,
      },
      {
        id: 'listado-precios',
        name: 'Presentaciones',
        link: '/admin/listado-precios',
        keywords: [
          'precios',
          'listado',
          'tarifas',
          'mayorista',
          'oferta',
          'unidad',
          'unidades',
          'paquete',
          'caja',
          'presentacion',
          'empaque',
        ],
        Icon: Check,
      },
      {
        id: 'especificaciones',
        name: 'Especificaciones',
        link: '/admin/especificaciones',
        keywords: [
          'specs',
          'especificaciones',
          'ficha tecnica',
          'atributos',
          'voltaje',
          'material',
          'medidas',
        ],
        Icon: Caption,
      },
      {
        id: 'categorias',
        name: 'Categorías',
        link: '/admin/categorias',
        keywords: ['taxonomia', 'rubro', 'categoria', 'subcategoria'],
        Icon: Compass,
      },
      {
        id: 'marcas',
        name: 'Marcas',
        link: '/admin/marcas',
        keywords: ['brand', 'proveedor', 'marca'],
        Icon: Camera,
      },
      {
        id: 'ofertas',
        name: 'Ofertas',
        link: '/admin/ofertas',
        keywords: ['promo', 'descuento', 'oferta'],
        Icon: Verified,
      },
    ],
  },
]

export function flattenAdminNav(): AdminNavLeaf[] {
  const out: AdminNavLeaf[] = []
  for (const entry of ADMIN_NAV) {
    if (entry.type === 'link') out.push(entry)
    else out.push(...entry.children)
  }
  return out
}

export function isAdminNavActive(pathname: string, link: string) {
  if (link === '/admin') return pathname === '/admin'
  return pathname === link || pathname.startsWith(`${link}/`)
}

export function isProductosGroupOpen(pathname: string) {
  return (
    pathname.startsWith('/admin/productos') ||
    pathname.startsWith('/admin/listado-precios') ||
    pathname.startsWith('/admin/especificaciones') ||
    pathname.startsWith('/admin/categorias') ||
    pathname.startsWith('/admin/marcas') ||
    pathname.startsWith('/admin/ofertas')
  )
}

export function searchAdminModules(query: string): AdminNavLeaf[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return flattenAdminNav().filter((item) => {
    const hay = [item.name, item.id, ...item.keywords].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export function adminPageTitle(pathname: string): string {
  if (pathname.startsWith('/admin/analitica')) return 'Analítica'
  if (pathname.startsWith('/admin/clientes')) return 'Clientes'
  if (pathname.startsWith('/admin/usuarios')) return 'Usuarios'
  if (pathname.startsWith('/admin/roles')) return 'Roles'
  if (pathname.startsWith('/admin/leads')) return 'Contactos'
  if (pathname.startsWith('/admin/contenido')) return 'Contenido web'
  if (pathname.startsWith('/admin/almacenamiento')) return 'Almacenamiento'
  if (pathname.startsWith('/admin/ofertas')) return 'Ofertas'
  if (pathname.startsWith('/admin/marcas')) return 'Marcas'
  if (pathname.startsWith('/admin/categorias')) return 'Categorías'
  if (pathname.startsWith('/admin/especificaciones')) return 'Especificaciones'
  if (pathname.startsWith('/admin/listado-precios')) return 'Presentaciones'
  if (pathname.startsWith('/admin/unidades')) return 'Presentaciones'
  if (pathname.startsWith('/admin/cotizaciones')) return 'Cotizaciones'
  if (pathname.startsWith('/admin/pedidos')) return 'Pedidos'
  if (pathname.startsWith('/admin/reclamaciones')) return 'Reclamaciones'
  if (pathname === '/admin/productos/nuevo') return 'Nuevo producto'
  if (pathname.startsWith('/admin/productos/') && pathname !== '/admin/productos')
    return 'Producto'
  if (pathname.startsWith('/admin/productos')) return 'Productos'
  return 'Inicio'
}
