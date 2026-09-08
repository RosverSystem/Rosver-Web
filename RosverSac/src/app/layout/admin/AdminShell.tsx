import { AdminSidebar } from '@/app/layout/admin/AdminSidebar'
import { AdminTopBar } from '@/app/layout/admin/AdminTopBar'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

export function AdminShell() {
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="flex min-h-dvh bg-rosver-soft">
      <div className="sticky top-0 hidden h-dvh lg:block">
        <AdminSidebar />
      </div>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-rosver-ink/40"
            aria-label="Cerrar menú"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative z-10 h-full shadow-2xl">
            <AdminSidebar onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar onMenuClick={() => setMobileNav(true)} />
        <main className="flex-1 px-4 pb-8 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
