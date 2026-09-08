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

const COLLAPSE_KEY = 'systemrsv.sidebar.collapsed'

/**
 * Shell ERP: sidebar + topbar fijos; solo el main hace scroll.
 */
export function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-rosver-soft text-rosver-ink">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
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
