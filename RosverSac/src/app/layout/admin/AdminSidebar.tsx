import {
  ADMIN_NAV,
  ADMIN_NAV_EXTRA,
  isAdminNavActive,
} from '@/app/layout/admin/admin-nav'
import { cn } from '@/shared/lib'
import { Link, useLocation } from 'react-router-dom'

type AdminSidebarProps = {
  onNavigate?: () => void
  className?: string
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside
      className={cn(
        'flex h-full w-[4.5rem] shrink-0 flex-col items-center bg-rosver-ink py-4 text-white',
        className,
      )}
    >
      <Link
        to="/admin"
        onClick={onNavigate}
        aria-label="SystemRSV"
        className="mb-6 flex size-11 items-center justify-center rounded-2xl bg-rosver-red font-display text-sm font-black tracking-tight"
      >
        SR
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {ADMIN_NAV.map((item) => {
          const active = isAdminNavActive(pathname, item.link)
          return (
            <Link
              key={item.id}
              to={item.link}
              title={item.name}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={cn(
                'flex size-11 items-center justify-center rounded-2xl transition',
                active
                  ? 'bg-rosver-red text-white shadow-lg shadow-rosver-red/30'
                  : 'text-white/55 hover:bg-white/10 hover:text-white',
              )}
            >
              <item.Icon size={22} color="currentColor" strokeWidth={2} />
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1.5">
        {ADMIN_NAV_EXTRA.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            title={item.name}
            aria-label={item.name}
            onClick={onNavigate}
            className="flex size-11 items-center justify-center rounded-2xl text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <item.Icon size={22} color="currentColor" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </aside>
  )
}
