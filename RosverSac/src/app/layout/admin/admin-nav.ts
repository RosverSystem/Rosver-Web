import type { ComponentType } from 'react'
import { Award, Compass, Hardrive, Home } from 'cssvg-icons'

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

/** Nav SystemRSV — solo Inicio + Productos (listado / categorías / ofertas). */
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
    type: 'group',
    id: 'productos',
    name: 'Productos',
    Icon: Hardrive,
    children: [
      {
        id: 'listado',
        name: 'Listado',
        link: '/admin/productos',
        keywords: ['catalogo', 'sku', 'stock', 'productos'],
        Icon: Hardrive,
      },
      {
        id: 'categorias',
        name: 'Categorías',
        link: '/admin/categorias',
        keywords: ['taxonomia', 'rubro', 'categoria'],
        Icon: Compass,
      },
      {
        id: 'ofertas',
        name: 'Ofertas',
        link: '/admin/ofertas',
        keywords: ['promo', 'descuento', 'oferta'],
        Icon: Award,
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
    pathname.startsWith('/admin/categorias') ||
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
