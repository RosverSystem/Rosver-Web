import { searchAdminModules } from '@/app/layout/admin/admin-nav'
import { shortDisplayName, useAuth } from '@/features/auth'
import { cn } from '@/shared/lib'
import { Menu, Search } from 'cssvg-icons'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function AdminTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const first = user ? shortDisplayName(user) : 'Admin'
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const accountMenuId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (!accountRef.current?.contains(t)) setAccountOpen(false)
      if (!searchRef.current?.contains(t)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => searchAdminModules(query), [query])

  const onLogout = async () => {
    setAccountOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center gap-3 px-4 py-3 lg:gap-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-rosver-ink shadow-sm lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={20} color="currentColor" strokeWidth={2} />
      </button>

      <div
        ref={searchRef}
        className="relative mx-auto w-full max-w-xl flex-1"
      >
        <label className="flex items-center gap-2 rounded-full border border-rosver-line/80 bg-white px-4 py-2.5 text-rosver-muted shadow-sm focus-within:border-rosver-red/35 focus-within:text-rosver-ink">
          <Search size={18} color="currentColor" strokeWidth={2} />
          <span className="sr-only">Buscar módulos</span>
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Buscar módulos…"
            className="w-full bg-transparent text-sm text-rosver-ink outline-none placeholder:text-rosver-muted"
          />
          <kbd className="hidden rounded-md border border-rosver-line bg-rosver-soft px-1.5 py-0.5 text-[10px] font-bold text-rosver-muted sm:inline">
            ⌘K
          </kbd>
        </label>
        {searchOpen && query.trim() ? (
          <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_16px_40px_rgba(13,13,13,0.12)]">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-rosver-muted">
                Sin coincidencias.
              </p>
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

      <div ref={accountRef} className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-controls={accountMenuId}
          onClick={() => setAccountOpen((v) => !v)}
          className={cn(
            'inline-flex max-w-[12rem] items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-sm ring-1 ring-rosver-line',
          )}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-rosver-red text-xs font-bold text-white">
              {first.slice(0, 1)}
            </span>
          )}
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-sm font-bold text-rosver-ink">
              {first}
            </span>
            <span className="block truncate text-[11px] text-rosver-muted">
              {user?.roleName ?? 'Admin'}
            </span>
          </span>
          <span className="text-[10px] text-rosver-muted" aria-hidden>
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
              <p className="truncate text-[11px] text-rosver-muted">
                {user?.email}
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
