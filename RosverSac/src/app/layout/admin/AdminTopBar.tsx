import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Clock, Menu, Search } from 'cssvg-icons'
import { cn } from '@/shared/lib'
import { adminPageTitle, searchAdminModules, type AdminNavLeaf } from './admin-nav'

type Props = {
  onOpenMobileNav: () => void
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return useMemo(
    () =>
      new Intl.DateTimeFormat('es-PE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now),
    [now],
  )
}

export function AdminTopBar({ onOpenMobileNav }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const clock = useLiveClock()
  const title = adminPageTitle(pathname)
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const results = useMemo(() => searchAdminModules(query).slice(0, 8), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMobileSearch(false)
        document.getElementById('admin-module-search')?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setMobileSearch(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function go(item: AdminNavLeaf) {
    setQuery('')
    setOpen(false)
    setMobileSearch(false)
    navigate(item.link)
  }

  const searchField = (id: string, className?: string) => (
    <div className={cn('relative w-full', className)}>
      <label htmlFor={id} className="sr-only">
        Buscar módulos
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-rosver-muted">
        <Search size={16} color="currentColor" strokeWidth={2} />
      </div>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar módulos…"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        className="h-10 w-full rounded-full border border-rosver-line bg-rosver-soft/60 py-2 pr-12 pl-10 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:border-rosver-red/40 focus:bg-white focus:ring-2 focus:ring-rosver-red/15"
      />
      {id === 'admin-module-search' ? (
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-rosver-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-rosver-muted sm:inline">
          ⌘K
        </kbd>
      ) : null}

      {open && query.trim() ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.4rem)] left-0 z-40 max-h-72 w-full overflow-y-auto rounded-2xl border border-rosver-line bg-white py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-rosver-muted">Sin resultados</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-rosver-soft"
                onClick={() => go(item)}
              >
                <span className="font-medium text-rosver-ink">{item.name}</span>
                <span className="truncate text-xs text-rosver-muted">{item.link}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )

  return (
    <header
      ref={wrapRef}
      className="sticky top-0 z-30 shrink-0 border-b border-rosver-line bg-white/95 backdrop-blur-sm"
    >
      <div className="flex h-14 items-center gap-3 px-3 sm:gap-4 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex size-10 items-center justify-center rounded-xl text-rosver-ink transition hover:bg-rosver-soft lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={22} color="currentColor" strokeWidth={2} />
        </button>

        <div className="min-w-0 shrink-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-rosver-ink sm:text-lg">
            {title}
          </h1>
        </div>

        <div className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
          {searchField('admin-module-search')}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-ink md:hidden"
            aria-label="Buscar"
            aria-expanded={mobileSearch}
            onClick={() => setMobileSearch((v) => !v)}
          >
            <Search size={20} color="currentColor" strokeWidth={2} />
          </button>

          <div
            className="hidden items-center gap-1.5 rounded-full border border-rosver-line bg-rosver-soft/50 px-3 py-1.5 text-xs text-rosver-muted sm:inline-flex"
            title={clock}
          >
            <Clock size={14} color="currentColor" strokeWidth={2} />
            <span className="tabular-nums whitespace-nowrap">{clock}</span>
          </div>
        </div>
      </div>

      {mobileSearch ? (
        <div className="border-t border-rosver-line px-3 py-2 md:hidden">
          {searchField('admin-module-search-mobile')}
        </div>
      ) : null}
    </header>
  )
}
