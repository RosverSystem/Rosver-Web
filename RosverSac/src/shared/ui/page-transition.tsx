import { prefersReducedMotion } from '@/shared/lib/gsap'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Clave de transición por “sección”, no por pathname completo.
 * Así /cuenta/pedidos → /cuenta/cotizaciones no remonta navbar+banner
 * ni dispara el fade que se siente como recarga.
 */
export function routeShellKey(pathname: string): string {
  if (!pathname || pathname === '/') return 'home'
  if (pathname.startsWith('/cuenta')) return 'cuenta'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/catalogo')) return 'catalogo'
  if (pathname.startsWith('/producto')) return 'producto'
  if (pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/registro')) {
    return 'auth'
  }
  const seg = pathname.split('/').filter(Boolean)[0]
  return seg ?? 'home'
}

/**
 * Entrada suave solo al cambiar de sección (p. ej. Inicio → Catálogo).
 * Navegación interna (tabs de cuenta, categorías de catálogo) sin remount.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const shellKey = routeShellKey(pathname)

  if (prefersReducedMotion()) return <>{children}</>

  return (
    <motion.div
      key={shellKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
