import type { ComponentType } from 'react'
import {
  Compass,
  Group,
  Hardrive,
  History,
  Home,
  Image,
  Message,
  Progress,
  Settings,
} from 'cssvg-icons'

type IconProps = { size?: number; color?: string; strokeWidth?: number }

export type AdminNavItem = {
  id: string
  name: string
  link: string
  keywords: string[]
  Icon: ComponentType<IconProps>
}

/** Rail principal SystemRSV — módulos del ecommerce/importaciones. */
export const ADMIN_NAV: AdminNavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    link: '/admin',
    keywords: ['inicio', 'resumen', 'kpi', 'home'],
    Icon: Home,
  },
  {
    id: 'productos',
    name: 'Productos',
    link: '/admin/productos',
    keywords: ['catalogo', 'sku', 'stock', 'precio'],
    Icon: Hardrive,
  },
  {
    id: 'categorias',
    name: 'Categorías',
    link: '/admin/categorias',
    keywords: ['taxonomia', 'rubro'],
    Icon: Compass,
  },
  {
    id: 'pedidos',
    name: 'Pedidos',
    link: '/admin/pedidos',
    keywords: ['ordenes', 'ventas', 'despacho'],
    Icon: Progress,
  },
  {
    id: 'cotizaciones',
    name: 'Cotizaciones',
    link: '/admin/cotizaciones',
    keywords: ['quotes', 'b2b', 'presupuesto'],
    Icon: History,
  },
  {
    id: 'leads',
    name: 'Leads',
    link: '/admin/leads',
    keywords: ['contacto', 'captacion', 'whatsapp'],
    Icon: Message,
  },
  {
    id: 'contenido',
    name: 'Contenido web',
    link: '/admin/contenido',
    keywords: ['banners', 'home', 'cms'],
    Icon: Image,
  },
  {
    id: 'usuarios',
    name: 'Usuarios',
    link: '/admin/usuarios',
    keywords: ['roles', 'permisos', 'rbac', 'staff'],
    Icon: Group,
  },
]

export const ADMIN_NAV_EXTRA: AdminNavItem[] = [
  {
    id: 'ajustes',
    name: 'Ajustes',
    link: '/admin',
    keywords: ['config', 'settings'],
    Icon: Settings,
  },
]

export function isAdminNavActive(pathname: string, link: string) {
  if (link === '/admin') return pathname === '/admin'
  return pathname === link || pathname.startsWith(`${link}/`)
}

export function searchAdminModules(query: string): AdminNavItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return ADMIN_NAV.filter((item) => {
    const hay = [item.name, item.id, ...item.keywords].join(' ').toLowerCase()
    return hay.includes(q)
  })
}
