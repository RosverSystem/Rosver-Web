import { useAuth, type AuthUser } from '@/features/auth/model/auth-context'
import { cn } from '@/shared/lib'
import { IconUser } from '@/shared/ui/icons'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function shortDisplayName(user: AuthUser): string {
  const name = user.fullName?.trim()
  if (name) return name.split(/\s+/)[0] ?? name
  return user.email.split('@')[0] ?? 'Cuenta'
}

type SessionAccountMenuProps = {
  /** desktop | compact (móvil drawer) | footer */
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
      <div className={cn('flex flex-col gap-1 py-2', className)}>
        <Link
          to="/cuenta"
          onClick={onNavigate}
          className="flex items-center gap-2 text-sm font-bold text-rosver-ink uppercase"
        >
          <img
            src={user.avatarUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-full object-cover ring-1 ring-rosver-line"
          />
          {label}
        </Link>
        <Link
          to="/cuenta/perfil"
          onClick={onNavigate}
          className="pl-9 text-xs font-semibold text-rosver-muted"
        >
          Ver perfil
        </Link>
        {isAdmin ? (
          <Link
            to="/admin"
            onClick={onNavigate}
            className="pl-9 text-xs font-semibold text-rosver-blue"
          >
            Panel SystemRSV
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void onLogout()}
          className="pl-9 text-left text-xs font-semibold text-rosver-red"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('relative hidden sm:block', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[11rem] items-center gap-2 px-2 py-1.5 text-sm font-semibold text-rosver-ink transition hover:text-rosver-red"
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
          className="absolute top-full right-0 z-40 mt-1 min-w-[11rem] border border-rosver-line bg-white py-1 shadow-[0_12px_24px_rgba(17,17,17,0.12)]"
        >
          <p className="truncate border-b border-rosver-line px-3 py-2 text-xs text-rosver-muted">
            {user.email}
          </p>
          <Link
            role="menuitem"
            to="/cuenta"
            onClick={() => closeAnd()}
            className="block px-3 py-2 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
          >
            Mi cuenta
          </Link>
          <Link
            role="menuitem"
            to="/cuenta/perfil"
            onClick={() => closeAnd()}
            className="block px-3 py-2 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
          >
            Perfil
          </Link>
          {isAdmin ? (
            <Link
              role="menuitem"
              to="/admin"
              onClick={() => closeAnd()}
              className="block px-3 py-2 text-sm font-semibold text-rosver-blue hover:bg-rosver-soft"
            >
              SystemRSV
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => void onLogout()}
            className="block w-full px-3 py-2 text-left text-sm font-semibold text-rosver-red hover:bg-rosver-soft"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}
