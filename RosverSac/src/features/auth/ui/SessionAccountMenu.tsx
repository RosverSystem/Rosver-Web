import { useAuth, type AuthUser } from '@/features/auth/model/auth-context'
import { cn } from '@/shared/lib'
import { IconBag, IconUser } from '@/shared/ui/icons'
import { Group, Monitor } from 'cssvg-icons'
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

/** Primer nombre legible (evita confundir con el rol «Cliente»). */
export function shortDisplayName(user: AuthUser): string {
  const name = user.fullName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    const roleLike = new Set(
      [
        user.roleName,
        user.roleCode,
        'cliente',
        'client',
        'admin',
        'administrador',
        'usuario',
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase()),
    )
    if (parts.length >= 2 && roleLike.has(parts[0]!.toLowerCase())) {
      return parts[1]!
    }
    return parts[0]!
  }
  const local = user.email.split('@')[0] ?? 'Cuenta'
  const token = local.split(/[._-]/)[0]
  return token ? token.charAt(0).toUpperCase() + token.slice(1) : 'Cuenta'
}

type SessionAccountMenuProps = {
  variant?: 'desktop' | 'compact' | 'footer'
  onNavigate?: () => void
  className?: string
}

type CssvgIcon = ComponentType<{
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}>

function MenuIconWrap({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-rosver-soft text-rosver-ink"
      aria-hidden
    >
      {children}
    </span>
  )
}

function MenuLink({
  to,
  onClick,
  icon,
  children,
  tone = 'default',
}: {
  to: string
  onClick?: () => void
  icon: ReactNode
  children: ReactNode
  tone?: 'default' | 'blue'
}) {
  return (
    <Link
      role="menuitem"
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition',
        tone === 'blue'
          ? 'text-rosver-blue hover:bg-rosver-soft'
          : 'text-rosver-ink hover:bg-rosver-soft',
      )}
    >
      <MenuIconWrap>{icon}</MenuIconWrap>
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  )
}

function LogoutMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function BuildingMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </svg>
  )
}

function Cssvg({
  Icon,
  size = 16,
}: {
  Icon: CssvgIcon
  size?: number
}) {
  return <Icon size={size} color="currentColor" strokeWidth={2} />
}

export function SessionAccountMenu({
  variant = 'desktop',
  onNavigate,
  className,
}: SessionAccountMenuProps) {
  const { user, loading, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const closeAnd = (fn?: () => void) => {
    setOpen(false)
    onNavigate?.()
    fn?.()
  }

  const onLogout = async () => {
    await logout()
    closeAnd(() => navigate('/login'))
  }

  if (loading) {
    if (variant === 'footer') {
      return <span className={cn('text-white/40', className)}>Cuenta…</span>
    }
    return (
      <span
        className={cn(
          'inline-flex h-10 w-24 animate-pulse rounded-full bg-rosver-soft',
          className,
        )}
        aria-hidden
      />
    )
  }

  if (!user) {
    if (variant === 'footer') {
      return (
        <Link
          to="/login"
          onClick={onNavigate}
          className={cn('transition hover:text-rosver-red', className)}
        >
          Mi cuenta
        </Link>
      )
    }
    if (variant === 'compact') {
      return (
        <Link
          to="/login"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 py-2.5 text-sm font-bold text-rosver-ink uppercase',
            className,
          )}
        >
          <IconUser className="size-4" /> Iniciar sesión
        </Link>
      )
    }
    return (
      <Link
        to="/login"
        className={cn(
          'hidden items-center gap-2 px-2 py-2 text-sm font-semibold text-rosver-ink transition hover:text-rosver-red sm:flex',
          className,
        )}
      >
        <IconUser />
        <span className="hidden lg:inline">Mi cuenta</span>
      </Link>
    )
  }

  const label = shortDisplayName(user)
  const accountHref = isAdmin ? '/admin' : '/cuenta/perfil'

  const navItems = (
    <>
      <MenuLink
        to="/cuenta/perfil"
        onClick={() => closeAnd()}
        icon={<Cssvg Icon={Group} />}
      >
        Mi perfil
      </MenuLink>
      <MenuLink
        to="/cuenta/empresa"
        onClick={() => closeAnd()}
        icon={<BuildingMark />}
      >
        Mi empresa
      </MenuLink>
      <MenuLink
        to="/cuenta/pedidos"
        onClick={() => closeAnd()}
        icon={<IconBag className="size-4" />}
      >
        Mis pedidos
      </MenuLink>
      {isAdmin ? (
        <MenuLink
          to="/admin"
          onClick={() => closeAnd()}
          tone="blue"
          icon={<Cssvg Icon={Monitor} />}
        >
          SystemRSV
        </MenuLink>
      ) : null}
    </>
  )

  // compact: onNavigate closes drawer; desktop uses closeAnd
  const compactItems = (
    <>
      <MenuLink
        to="/cuenta/perfil"
        onClick={onNavigate}
        icon={<Cssvg Icon={Group} />}
      >
        Mi perfil
      </MenuLink>
      <MenuLink
        to="/cuenta/empresa"
        onClick={onNavigate}
        icon={<BuildingMark />}
      >
        Mi empresa
      </MenuLink>
      <MenuLink
        to="/cuenta/pedidos"
        onClick={onNavigate}
        icon={<IconBag className="size-4" />}
      >
        Mis pedidos
      </MenuLink>
      {isAdmin ? (
        <MenuLink
          to="/admin"
          onClick={onNavigate}
          tone="blue"
          icon={<Cssvg Icon={Monitor} />}
        >
          Panel SystemRSV
        </MenuLink>
      ) : null}
    </>
  )

  if (variant === 'footer') {
    return (
      <Link
        to={accountHref}
        onClick={onNavigate}
        className={cn('transition hover:text-rosver-red', className)}
      >
        {label}
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-col gap-1 border-t border-rosver-line pt-3',
          className,
        )}
      >
        <div className="mb-1 flex items-center gap-3 rounded-xl bg-rosver-soft/80 px-2.5 py-2.5">
          <img
            src={user.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl object-cover ring-1 ring-rosver-line"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-rosver-ink">{label}</p>
            <p className="truncate text-[11px] text-rosver-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 py-1">{compactItems}</div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-1 flex items-center gap-3 rounded-xl border border-rosver-line px-2.5 py-2.5 text-left text-sm font-bold text-rosver-red transition hover:border-rosver-red/40 hover:bg-rosver-soft"
        >
          <MenuIconWrap>
            <span className="text-rosver-red">
              <LogoutMark />
            </span>
          </MenuIconWrap>
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('relative z-50 hidden sm:block', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[12rem] items-center gap-2 rounded-full px-1.5 py-1 text-sm font-semibold text-rosver-ink transition hover:bg-rosver-soft hover:text-rosver-red"
      >
        <img
          src={user.avatarUrl}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-full object-cover ring-1 ring-rosver-line"
        />
        <span className="hidden truncate lg:inline">{label}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-[15.5rem] overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_16px_40px_rgba(13,13,13,0.14)]"
        >
          <div className="flex items-center gap-3 border-b border-rosver-line bg-rosver-soft/70 px-3.5 py-3">
            <img
              src={user.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-white"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-rosver-ink">{label}</p>
              <p className="truncate text-[11px] text-rosver-muted">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 p-2">{navItems}</div>
          <div className="border-t border-rosver-line p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => void onLogout()}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-bold text-rosver-red transition hover:bg-rosver-soft"
            >
              <MenuIconWrap>
                <span className="text-rosver-red">
                  <LogoutMark />
                </span>
              </MenuIconWrap>
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
