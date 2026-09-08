import {
  ADMIN_NAV,
  isAdminNavActive,
  isProductosGroupOpen,
} from '@/app/layout/admin/admin-nav'
import { cn } from '@/shared/lib'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

type AdminSidebarProps = {
  onNavigate?: () => void
  className?: string
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const { pathname } = useLocation()
  const [productosOpen, setProductosOpen] = useState(() =>
    isProductosGroupOpen(pathname),
  )

  useEffect(() => {
    if (isProductosGroupOpen(pathname)) setProductosOpen(true)
  }, [pathname])

  return (
    <aside
      className={cn(
        'flex h-full w-[16.5rem] shrink-0 flex-col border-r border-rosver-line bg-white',
        className,
      )}
    >
      <div className="px-4 pt-5 pb-4">
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-rosver-red font-display text-sm font-black text-white">
            SR
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base font-bold text-rosver-ink">
              SystemRSV
            </p>
            <p className="truncate text-[11px] font-medium text-rosver-muted">
              ERP Rosver
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {ADMIN_NAV.map((entry) => {
          if (entry.type === 'link') {
            const active = isAdminNavActive(pathname, entry.link)
            return (
              <Link
                key={entry.id}
                to={entry.link}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                  active
                    ? 'bg-rosver-red text-white shadow-sm shadow-rosver-red/25'
                    : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                )}
              >
                <entry.Icon size={20} color="currentColor" strokeWidth={2} />
                {entry.name}
              </Link>
            )
          }

          const groupActive = isProductosGroupOpen(pathname)
          return (
            <div key={entry.id} className="mt-1">
              <button
                type="button"
                onClick={() => setProductosOpen((v) => !v)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition',
                  groupActive
                    ? 'bg-rosver-soft text-rosver-ink'
                    : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                )}
              >
                <entry.Icon size={20} color="currentColor" strokeWidth={2} />
                <span className="flex-1">{entry.name}</span>
                <span
                  className={cn(
                    'text-[10px] text-rosver-muted transition',
                    productosOpen && 'rotate-180',
                  )}
                  aria-hidden
                >
                  ▾
                </span>
              </button>
              {productosOpen ? (
                <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-rosver-line pl-2">
                  {entry.children.map((child) => {
                    const active = isAdminNavActive(pathname, child.link)
                    return (
                      <Link
                        key={child.id}
                        to={child.link}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
                          active
                            ? 'bg-rosver-red text-white'
                            : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                        )}
                      >
                        <child.Icon
                          size={18}
                          color="currentColor"
                          strokeWidth={2}
                        />
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-rosver-line p-3">
        <div className="rounded-2xl bg-rosver-soft/80 px-3 py-3">
          <p className="text-xs font-bold text-rosver-ink">Rosver Catálogo</p>
          <p className="mt-1 text-[11px] leading-snug text-rosver-muted">
            Gestión de productos, categorías y ofertas web.
          </p>
          <Link
            to="/"
            onClick={onNavigate}
            className="mt-2 inline-flex rounded-full bg-rosver-ink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rosver-red"
          >
            Ver tienda
          </Link>
        </div>
      </div>
    </aside>
  )
}
