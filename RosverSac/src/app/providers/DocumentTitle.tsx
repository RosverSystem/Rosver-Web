import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PUBLIC_TITLE = 'Rosver SAC'
const ERP_TITLE = 'System'

/**
 * Título de pestaña: web pública → Rosver SAC; ERP (/admin) → System.
 */
export function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const isErp = pathname === '/admin' || pathname.startsWith('/admin/')
    document.title = isErp ? ERP_TITLE : PUBLIC_TITLE
  }, [pathname])

  return null
}
