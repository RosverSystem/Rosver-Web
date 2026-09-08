import { useAuth, type AuthUser } from '@/features/auth/model/auth-context'
import { cn } from '@/shared/lib'
import { IconUser } from '@/shared/ui/icons'
import { useEffect, useId, useRef, useState } from 'react'
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
          className={cn('transition hover:text-white', className)}
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
            'flex items-center gap-2 py-2.5 text-sm font-bold text-rosver-ink uppercase',
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
  const accountHref = isAdmin ? '/admin' : '/cuenta'

  if (variant === 'footer') {
    return (
      <Link
        to={accountHref}
        onClick={onNavigate}
        className={cn('transition hover:text-white', className)}
      >
        {label}
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-1 border-t border-rosver-line pt-2', className)}>
        <div className="flex items-center gap-2 px-1 py-1">
          <img
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover ring-1 ring-rosver-line"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-rosver-ink">{label}</p>
            <p className="truncate text-[11px] text-rosver-muted">{user.email}</p>
          </div>
        </div>
        <Link
          to="/cuenta"
          onClick={onNavigate}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
        >
          Mi cuenta
        </Link>
        <Link
          to="/cuenta/perfil"
          onClick={onNavigate}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
        >
          Perfil
        </Link>
        {isAdmin ? (
          <Link
            to="/admin"
            onClick={onNavigate}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-rosver-blue hover:bg-rosver-soft"
          >
            Panel SystemRSV
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-1 rounded-lg border border-rosver-line px-3 py-2.5 text-left text-sm font-bold text-rosver-red hover:border-rosver-red hover:bg-rosver-soft"
        >
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
          className="absolute top-[calc(100%+6px)] right-0 z-50 w-56 overflow-hidden rounded-xl border border-rosver-line bg-white shadow-[0_16px_40px_rgba(13,13,13,0.14)]"
        >
          <div className="border-b border-rosver-line bg-rosver-soft/70 px-3 py-2.5">
            <p className="truncate text-sm font-bold text-rosver-ink">{label}</p>
            <p className="truncate text-[11px] text-rosver-muted">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              role="menuitem"
              to="/cuenta"
              onClick={() => closeAnd()}
              className="block px-3 py-2.5 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
            >
              Mi cuenta
            </Link>
            <Link
              role="menuitem"
              to="/cuenta/perfil"
              onClick={() => closeAnd()}
              className="block px-3 py-2.5 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
            >
              Perfil
            </Link>
            {isAdmin ? (
              <Link
                role="menuitem"
                to="/admin"
                onClick={() => closeAnd()}
                className="block px-3 py-2.5 text-sm font-semibold text-rosver-blue hover:bg-rosver-soft"
              >
                SystemRSV
              </Link>
            ) : null}
          </div>
          <div className="border-t border-rosver-line p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => void onLogout()}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-rosver-red hover:bg-rosver-soft"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
