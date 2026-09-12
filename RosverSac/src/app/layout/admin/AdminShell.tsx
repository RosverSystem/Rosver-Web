import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopBar } from './AdminTopBar'

function AdminPageFallback() {
  return (
    <div className="flex h-full items-center justify-center py-16 text-sm text-rosver-muted">
      Cargando…
    </div>
  )
}

/**
 * Shell ERP: sidebar fija expandida + topbar; solo el main hace scroll.
 * Sin colapsar sidebar en desktop.
 */
export function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])

  useEffect(() => {
    try {
      localStorage.removeItem('systemrsv.sidebar.collapsed')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-rosver-soft text-rosver-ink">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={closeMobile} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopBar onOpenMobileNav={openMobile} />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Suspense fallback={<AdminPageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
