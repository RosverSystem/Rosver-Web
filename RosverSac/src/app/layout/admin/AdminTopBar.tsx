import { searchAdminModules } from '@/app/layout/admin/admin-nav'
import { shortDisplayName, useAuth } from '@/features/auth'
import { cn } from '@/shared/lib'
import { Clock, Search } from 'cssvg-icons'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function formatNow(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function AdminTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const first = user ? shortDisplayName(user) : 'Admin'
  const [now, setNow] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const accountMenuId = useId()

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (!accountRef.current?.contains(t)) setAccountOpen(false)
      if (!searchRef.current?.contains(t)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const results = useMemo(() => searchAdminModules(query), [query])

  const onLogout = async () => {
    setAccountOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex flex-wrap items-center gap-3 px-4 py-4 lg:gap-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-rosver-ink shadow-sm lg:hidden"
        aria-label="Abrir menú"
      >
        <span className="font-display text-xs font-black text-rosver-red">SR</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            width={44}
            height={44}
            className="hidden size-11 rounded-full object-cover ring-2 ring-white sm:block"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-rosver-ink sm:text-xl">
            ¡Hola, {first}!
          </p>
          <p className="truncate text-xs text-rosver-muted sm:text-sm">
            SystemRSV · gestión Rosver
          </p>
        </div>
      </div>

      <div
        ref={searchRef}
        className="relative order-3 w-full lg:order-none lg:mx-auto lg:max-w-md lg:flex-1"
      >
        <label className="flex items-center gap-2 rounded-full border border-transparent bg-white px-4 py-2.5 text-rosver-muted shadow-sm focus-within:border-rosver-red/30 focus-within:text-rosver-ink">
          <Search size={18} color="currentColor" strokeWidth={2} />
          <span className="sr-only">Buscar módulos</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Buscar módulos o datos…"
            className="w-full bg-transparent text-sm text-rosver-ink outline-none placeholder:text-rosver-muted"
          />
        </label>
        {searchOpen && query.trim() ? (
          <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_16px_40px_rgba(13,13,13,0.12)]">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-rosver-muted">Sin coincidencias.</p>
            ) : (
              results.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  onClick={() => {
                    setQuery('')
                    setSearchOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
                >
                  <item.Icon size={18} color="currentColor" strokeWidth={2} />
                  {item.name}
                </Link>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-rosver-muted shadow-sm md:flex">
        <span className="text-rosver-muted">
          <Clock size={16} color="currentColor" strokeWidth={2} />
        </span>
        <time dateTime={now.toISOString()}>{formatNow(now)}</time>
      </div>

      <div ref={accountRef} className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-controls={accountMenuId}
          onClick={() => setAccountOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-rosver-ink py-1.5 pr-3 pl-1.5 text-sm font-semibold text-white shadow-sm',
          )}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-rosver-red text-xs font-bold">
              {first.slice(0, 1)}
            </span>
          )}
          <span className="hidden sm:inline">Mi cuenta</span>
          <span className="text-[10px] text-white/70" aria-hidden>
            ▾
          </span>
        </button>
        {accountOpen ? (
          <div
            id={accountMenuId}
            role="menu"
            className="absolute top-[calc(100%+8px)] right-0 z-40 w-56 overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_16px_40px_rgba(13,13,13,0.14)]"
          >
            <div className="border-b border-rosver-line bg-rosver-soft/80 px-3 py-2.5">
              <p className="truncate text-sm font-bold text-rosver-ink">{first}</p>
              <p className="truncate text-[11px] text-rosver-muted">{user?.email}</p>
              <p className="mt-1 text-[11px] font-semibold text-rosver-blue">
                {user?.roleName ?? 'Admin'}
              </p>
            </div>
            <Link
              role="menuitem"
              to="/cuenta/perfil"
              onClick={() => setAccountOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
            >
              Perfil
            </Link>
            <Link
              role="menuitem"
              to="/"
              onClick={() => setAccountOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-rosver-ink hover:bg-rosver-soft"
            >
              Ver tienda
            </Link>
            <div className="border-t border-rosver-line p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => void onLogout()}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rosver-red hover:bg-rosver-soft"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
