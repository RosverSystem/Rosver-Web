import { prefersReducedMotion } from '@/shared/lib/gsap'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Entrada suave al cambiar de página (fade + slide corto). Sin animación de
 * salida: las rutas remontan por diseño de App.tsx, así que solo se anima
 * la entrada del contenido nuevo.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  if (prefersReducedMotion()) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
