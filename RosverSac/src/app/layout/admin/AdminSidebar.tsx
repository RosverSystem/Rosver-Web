import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Settings } from 'cssvg-icons'
import { shortDisplayName, useAuth } from '@/features/auth'
import { cn } from '@/shared/lib'
import {
  ADMIN_NAV,
  isAdminNavActive,
  isProductosGroupOpen,
  type AdminNavGroup,
} from './admin-nav'

type Props = {
  mobileOpen: boolean
  onCloseMobile: () => void
}

function leafClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    active
      ? 'bg-rosver-red/10 text-rosver-red ring-1 ring-rosver-red/25'
      : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
  )
}

/** Scroll interno sin barra visible (sigue scrolleable con rueda). */
const NAV_SCROLL =
  'admin-sidebar-nav hide-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3'

export function AdminSidebar({ mobileOpen, onCloseMobile }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const [productosOpen, setProductosOpen] = useState(() =>
    isProductosGroupOpen(pathname),
  )
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

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
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [accountOpen])

  const rail = (
    <aside className="relative flex h-full w-[16.25rem] flex-col border-r border-rosver-line bg-white">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-rosver-line px-3">
        <Link
          to="/admin"
          className="group flex min-w-0 items-center gap-2.5"
          onClick={onCloseMobile}
        >
          <img
            src="/Logo_Vertical.png"
            alt="Rosver"
            width={120}
            height={36}
            className="h-9 w-auto max-w-[7.5rem] object-contain object-left"
            decoding="async"
          />
          <span className="relative flex min-w-0 flex-col gap-0.5 border-l border-rosver-line pl-2.5">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-rosver-red shadow-[0_0_0_3px] shadow-rosver-red/15 transition group-hover:shadow-rosver-red/25"
              />
              <span className="truncate font-display text-[13px] font-semibold tracking-[0.14em] text-rosver-ink uppercase">
                System
              </span>
            </span>
            <span
              aria-hidden
              className="h-0.5 w-full max-w-[4.5rem] rounded-full bg-gradient-to-r from-rosver-red via-rosver-red/70 to-transparent"
            />
          </span>
        </Link>
      </div>

      <nav className={NAV_SCROLL} aria-label="Módulos">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-rosver-muted uppercase">
          Menú
        </p>

        {ADMIN_NAV.map((entry) => {
          if (entry.type === 'link') {
            const leaf = entry
            const active = isAdminNavActive(pathname, leaf.link)
            const Icon = leaf.Icon
            return (
              <NavLink
                key={leaf.id}
                to={leaf.link}
                end={leaf.link === '/admin'}
                title={leaf.name}
                className={() => leafClass(active)}
                onClick={onCloseMobile}
              >
                <span className="inline-flex size-5 shrink-0 items-center justify-center">
                  <Icon size={20} color="currentColor" strokeWidth={2} />
                </span>
                <span className="truncate">{leaf.name}</span>
              </NavLink>
            )
          }

          const group = entry as AdminNavGroup & { type: 'group' }
          const open = productosOpen || isProductosGroupOpen(pathname)
          const childActive = isProductosGroupOpen(pathname)
          const GroupIcon = group.Icon

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
                <span className="min-w-0 flex-1 truncate text-left">
                  {group.name}
                </span>
                <span
                  className={cn(
                    'shrink-0 transition-transform',
                    open && 'rotate-90',
                  )}
                >
                  <ArrowRight size={16} color="currentColor" strokeWidth={2} />
                </span>
              </button>
              {open ? (
                <div className="ml-4 space-y-0.5 border-l border-rosver-line pl-3">
                  {group.children.map((child) => {
                    const active = isAdminNavActive(pathname, child.link)
                    const ChildIcon = child.Icon
                    return (
                      <NavLink
                        key={child.id}
                        to={child.link}
                        className={() =>
                          cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                            active
                              ? 'font-semibold text-rosver-red'
                              : 'text-rosver-muted hover:bg-rosver-soft hover:text-rosver-ink',
                          )
                        }
                        onClick={onCloseMobile}
                      >
                        <ChildIcon
                          size={16}
                          color="currentColor"
                          strokeWidth={2}
                        />
                        <span className="truncate">{child.name}</span>
                      </NavLink>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-rosver-line px-3 py-2">
        <Link
          to="/"
          title="Ver tienda"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-ink"
        >
          <Settings size={18} color="currentColor" strokeWidth={2} />
          <span>Ver tienda</span>
        </Link>
      </div>

      <div ref={accountRef} className="relative border-t border-rosver-line p-3">
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-rosver-soft"
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
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-rosver-ink">
              {firstName}
            </span>
            <span className="block truncate text-xs text-rosver-muted">
              {roleLabel}
            </span>
          </span>
          <span
            className={cn(
              'shrink-0 text-rosver-muted transition-transform',
              accountOpen && 'rotate-90',
            )}
          >
            <ArrowRight size={14} color="currentColor" strokeWidth={2} />
          </span>
        </button>

        {accountOpen ? (
          <div
            role="menu"
            className="absolute right-3 bottom-[calc(100%+0.35rem)] left-3 z-50 overflow-hidden rounded-xl border border-rosver-line bg-white py-1 shadow-lg"
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
          <div className="absolute inset-y-0 left-0 w-[16.25rem] shadow-xl">
            {rail}
          </div>
        </div>
      ) : null}
    </>
  )
}
