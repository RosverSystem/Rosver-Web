import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Menu, Settings } from 'cssvg-icons'
import { shortDisplayName, useAuth } from '@/features/auth'
import { cn } from '@/shared/lib'
import {
  ADMIN_NAV,
  isAdminNavActive,
  isProductosGroupOpen,
  type AdminNavGroup,
  type AdminNavLeaf,
} from './admin-nav'

type Props = {
  mobileOpen: boolean
  onCloseMobile: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

function leafClass(active: boolean, collapsed: boolean) {
  return cn(
    'flex items-center gap-3 rounded-xl text-sm font-medium transition-colors',
    collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
    active
      ? 'bg-rosver-red/10 text-rosver-red ring-1 ring-rosver-red/25'
      : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
  )
}

export function AdminSidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const [productosOpen, setProductosOpen] = useState(() => isProductosGroupOpen(pathname))
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const displayCollapsed = collapsed && !mobileOpen
  const firstName = user ? shortDisplayName(user) : 'Usuario'
  const roleLabel = user?.roleName || (isAdmin ? 'Administrador' : 'Staff')
  const initial = firstName.charAt(0).toUpperCase()

  useEffect(() => {
    if (isProductosGroupOpen(pathname)) setProductosOpen(true)
  }, [pathname])

  useEffect(() => {
    onCloseMobile()
    setAccountOpen(false)
  }, [pathname, onCloseMobile])

  useEffect(() => {
    if (!accountOpen) return
    const onDoc = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [accountOpen])

  const rail = (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-rosver-line bg-white transition-[width] duration-200',
        displayCollapsed ? 'w-[4.5rem]' : 'w-[16.25rem]',
      )}
    >
      <div
        className={cn(
          'relative flex h-14 shrink-0 items-center border-b border-rosver-line',
          displayCollapsed ? 'justify-center px-2' : 'justify-between gap-2 px-3',
        )}
      >
        <Link
          to="/admin"
          className={cn('flex min-w-0 items-center gap-2.5', displayCollapsed && 'justify-center')}
          onClick={onCloseMobile}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rosver-red text-[11px] font-bold tracking-tight text-white">
            SR
          </span>
          {!displayCollapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight text-rosver-ink">
              SystemRSV
            </span>
          ) : null}
        </Link>
        {!mobileOpen && !displayCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-ink"
            aria-label="Colapsar menú"
            title="Colapsar"
          >
            <Menu size={18} color="currentColor" strokeWidth={2} />
          </button>
        ) : null}
        {displayCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="absolute top-1/2 right-0 z-10 hidden size-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-rosver-line bg-white text-rosver-muted shadow-sm hover:text-rosver-ink lg:inline-flex"
            aria-label="Expandir menú"
            title="Expandir"
          >
            <span className="rotate-180">
              <ArrowRight size={14} color="currentColor" strokeWidth={2} />
            </span>
          </button>
        ) : null}
      </div>

      <nav
        className={cn('flex-1 space-y-1 overflow-y-auto py-3', displayCollapsed ? 'px-2' : 'px-3')}
        aria-label="Módulos"
      >
        {!displayCollapsed ? (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-rosver-muted">
            Menú
          </p>
        ) : null}

        {ADMIN_NAV.map((entry) => {
          if (entry.type === 'link') {
            const leaf = entry as AdminNavLeaf & { type: 'link' }
            const active = isAdminNavActive(pathname, leaf.link)
            const Icon = leaf.Icon
            return (
              <NavLink
                key={leaf.id}
                to={leaf.link}
                end={leaf.link === '/admin'}
                title={leaf.name}
                className={() => leafClass(active, displayCollapsed)}
                onClick={onCloseMobile}
              >
                <span className="shrink-0">
                  <Icon size={20} color="currentColor" strokeWidth={2} />
                </span>
                {!displayCollapsed ? <span className="truncate">{leaf.name}</span> : null}
              </NavLink>
            )
          }

          const group = entry as AdminNavGroup & { type: 'group' }
          const open = productosOpen || isProductosGroupOpen(pathname)
          const childActive = isProductosGroupOpen(pathname)
          const GroupIcon = group.Icon

          if (displayCollapsed) {
            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  title={group.name}
                  onClick={() => {
                    setProductosOpen(true)
                    navigate(group.children[0]?.link ?? '/admin/productos')
                    onCloseMobile()
                  }}
                  className={leafClass(childActive, true)}
                >
                  <GroupIcon size={20} color="currentColor" strokeWidth={2} />
                </button>
                {group.children.map((child) => {
                  const active = isAdminNavActive(pathname, child.link)
                  return (
                    <NavLink
                      key={child.id}
                      to={child.link}
                      title={child.name}
                      className={() =>
                        cn(
                          'mx-auto flex size-8 items-center justify-center rounded-lg text-[10px] font-bold',
                          active
                            ? 'bg-rosver-red text-white'
                            : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                        )
                      }
                      onClick={onCloseMobile}
                    >
                      {child.name.slice(0, 1)}
                    </NavLink>
                  )
                })}
              </div>
            )
          }

          return (
            <div key={group.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => setProductosOpen((v) => !v)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  childActive
                    ? 'bg-rosver-red/10 text-rosver-red'
                    : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                )}
                aria-expanded={open}
              >
                <GroupIcon size={20} color="currentColor" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate text-left">{group.name}</span>
                <span className={cn('shrink-0 transition-transform', open && 'rotate-90')}>
                  <ArrowRight size={16} color="currentColor" strokeWidth={2} />
                </span>
              </button>
              {open ? (
                <div className="ml-4 space-y-0.5 border-l border-rosver-line pl-3">
                  {group.children.map((child) => {
                    const active = isAdminNavActive(pathname, child.link)
                    return (
                      <NavLink
                        key={child.id}
                        to={child.link}
                        className={() =>
                          cn(
                            'block rounded-lg px-3 py-2 text-sm transition-colors',
                            active
                              ? 'font-semibold text-rosver-red'
                              : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                          )
                        }
                        onClick={onCloseMobile}
                      >
                        {child.name}
                      </NavLink>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className={cn('border-t border-rosver-line py-2', displayCollapsed ? 'px-2' : 'px-3')}>
        <Link
          to="/"
          title="Ver tienda"
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-ink',
            displayCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          )}
        >
          <Settings size={18} color="currentColor" strokeWidth={2} />
          {!displayCollapsed ? <span>Ver tienda</span> : null}
        </Link>
      </div>

      <div
        ref={accountRef}
        className={cn(
          'relative border-t border-rosver-line',
          displayCollapsed ? 'p-2' : 'p-3',
          displayCollapsed && 'lg:relative',
        )}
      >
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl transition hover:bg-rosver-soft',
            displayCollapsed ? 'justify-center p-1.5' : 'px-2 py-2',
          )}
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          title={firstName}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-full object-cover ring-1 ring-rosver-line"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rosver-ink text-sm font-semibold text-white">
              {initial}
            </span>
          )}
          {!displayCollapsed ? (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold text-rosver-ink">
                  {firstName}
                </span>
                <span className="block truncate text-xs text-rosver-muted">{roleLabel}</span>
              </span>
              <span className={cn('shrink-0 text-rosver-muted transition-transform', accountOpen && 'rotate-90')}>
                <ArrowRight size={14} color="currentColor" strokeWidth={2} />
              </span>
            </>
          ) : null}
        </button>

        {accountOpen ? (
          <div
            role="menu"
            className={cn(
              'absolute z-50 overflow-hidden rounded-xl border border-rosver-line bg-white py-1 shadow-lg',
              displayCollapsed
                ? 'bottom-2 left-full ml-2 w-48'
                : 'bottom-[calc(100%+0.35rem)] left-3 right-3',
            )}
          >
            {user?.email ? (
              <p className="border-b border-rosver-line px-3 py-2 text-xs text-rosver-muted">
                {user.email}
              </p>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rosver-ink transition hover:bg-rosver-soft"
              onClick={() => {
                setAccountOpen(false)
                onCloseMobile()
                void logout().then(() => {
                  navigate('/auth?mode=login', { replace: true })
                })
              }}
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )

  return (
    <>
      <div className="relative hidden h-full shrink-0 lg:flex">{rail}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-rosver-ink/40"
            aria-label="Cerrar menú"
            onClick={onCloseMobile}
          />
          <div className="absolute inset-y-0 left-0 w-[16.25rem] shadow-xl">{rail}</div>
        </div>
      ) : null}
    </>
  )
}
