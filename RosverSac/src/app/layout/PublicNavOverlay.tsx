import { SessionAccountMenu } from '@/features/auth'
import { ROSVER_COMPANY } from '@/shared/lib/company'
import { buildWhatsAppLink } from '@/shared/lib/contact'
import { SOCIAL_LINKS } from '@/shared/lib/social'
import { cn } from '@/shared/lib'
import {
  IconFacebook,
  IconInstagram,
  IconTikTok,
  IconWhatsApp,
} from '@/shared/ui/icons'
import {
  ArrowRight,
  Close,
  Compass,
  Home,
  Message,
  StarGrow,
} from 'cssvg-icons'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const OVERLAY_LINKS = [
  { name: 'Catálogo', to: '/catalogo', Icon: Home },
  { name: 'Destacados', to: '/ranking', Icon: StarGrow },
  { name: 'Ubicación y envíos', to: '/contacto', Icon: Compass },
  { name: 'Mi cotización', to: '/cotizar', Icon: Message },
] as const

type PublicNavOverlayProps = {
  open: boolean
  onClose: () => void
  itemCount: number
}

/**
 * Menú full-screen oscuro (referencia Katrina → paleta Rosver).
 * Abrir/cerrar con Motion; Escape y bloqueo de scroll.
 */
export function PublicNavOverlay({
  open,
  onClose,
  itemCount,
}: PublicNavOverlayProps) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Cerrar al navegar (misma ruta no basta si query cambia; pathname sí)
  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar ruta
  }, [pathname])

  const year = new Date().getFullYear()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Menú Rosver"
          className="fixed inset-0 z-[80] flex flex-col bg-rosver-ink text-white"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: '-4%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: '-3%' }}
          transition={{ duration: reduce ? 0.15 : 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Acento rojo sutil */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 10% 0%, rgba(227,6,19,0.35), transparent 45%), radial-gradient(ellipse at 90% 80%, rgba(30,58,95,0.35), transparent 40%)',
            }}
            aria-hidden
          />

          <header className="relative z-[1] flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-2.5"
              aria-label="Rosver Sac — inicio"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-rosver-red text-xs font-black tracking-tight text-white sm:size-10">
                R
              </span>
              <span className="font-display text-lg font-bold tracking-tight sm:text-xl">
                <span className="text-rosver-red italic">ROS</span>
                <span className="italic">VER</span>
                <span className="ml-1 text-sm font-semibold not-italic text-white/70">
                  SAC
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="flex size-11 items-center justify-center rounded-full border border-white/35 text-white transition hover:border-rosver-red hover:bg-rosver-red"
            >
              <Close size={22} color="currentColor" strokeWidth={2} />
            </button>
          </header>

          <div className="relative z-[1] mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 gap-8 overflow-y-auto px-4 py-4 sm:px-6 lg:grid-cols-2 lg:gap-0 lg:overflow-hidden lg:px-10 lg:py-6">
            {/* Columna nav */}
            <motion.nav
              className="flex flex-col lg:border-r lg:border-white/15 lg:pr-10"
              initial={reduce ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduce ? 0 : 0.12, duration: 0.4 }}
            >
              <ul className="flex flex-col gap-1 sm:gap-2">
                {OVERLAY_LINKS.map((item, i) => {
                  const active =
                    pathname === item.to ||
                    pathname.startsWith(`${item.to}/`)
                  const Icon = item.Icon
                  return (
                    <motion.li
                      key={item.to}
                      initial={reduce ? false : { opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: reduce ? 0 : 0.16 + i * 0.05,
                        duration: 0.35,
                      }}
                    >
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl py-2.5 pr-2 transition sm:gap-4 sm:py-3',
                          active
                            ? 'text-rosver-red'
                            : 'text-white hover:text-rosver-red',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-full border transition sm:size-11',
                            active
                              ? 'border-rosver-red bg-rosver-red/15'
                              : 'border-white/30 group-hover:border-rosver-red',
                          )}
                        >
                          <Icon size={20} color="currentColor" strokeWidth={2} />
                        </span>
                        <span className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                          {item.name}
                        </span>
                        {item.to === '/cotizar' && itemCount > 0 ? (
                          <span className="ml-1 inline-flex min-w-7 items-center justify-center rounded-full bg-rosver-red px-2 py-0.5 text-xs font-bold text-white">
                            {itemCount > 99 ? '99+' : itemCount}
                          </span>
                        ) : null}
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>

              <div className="mt-6 border-t border-white/15 pt-5 sm:mt-8">
                <div className="flex flex-col gap-2.5 sm:max-w-md">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center justify-between gap-3 rounded-full border border-white/35 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#25D366] hover:bg-[#25D366]/10"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <IconWhatsApp className="size-5 text-[#25D366]" />
                      WhatsApp
                    </span>
                    <ArrowRight size={16} color="currentColor" strokeWidth={2} />
                  </a>
                  <a
                    href={`mailto:${ROSVER_COMPANY.email}`}
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center justify-between gap-3 rounded-full border border-white/35 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-rosver-red hover:bg-rosver-red/10"
                  >
                    <span className="truncate">{ROSVER_COMPANY.email}</span>
                    <ArrowRight size={16} color="currentColor" strokeWidth={2} />
                  </a>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  {(
                    [
                      {
                        label: 'Facebook',
                        href: SOCIAL_LINKS.facebook,
                        Icon: IconFacebook,
                      },
                      {
                        label: 'Instagram',
                        href: SOCIAL_LINKS.instagram,
                        Icon: IconInstagram,
                      },
                      {
                        label: 'TikTok',
                        href: SOCIAL_LINKS.tiktok,
                        Icon: IconTikTok,
                      },
                    ] as const
                  ).map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex size-10 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-rosver-red hover:bg-rosver-red"
                    >
                      <Icon className="size-4" />
                    </a>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-white p-3 text-rosver-ink lg:hidden">
                  <SessionAccountMenu
                    variant="compact"
                    onNavigate={onClose}
                    className="border-t-0 pt-0"
                  />
                </div>
              </div>
            </motion.nav>

            {/* Columna marca */}
            <motion.div
              className="relative hidden flex-col justify-center lg:flex lg:pl-12"
              initial={reduce ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduce ? 0 : 0.2, duration: 0.45 }}
            >
              <p className="text-[11px] font-bold tracking-[0.22em] text-white/50 uppercase">
                Importa lo mejor
              </p>
              <h2 className="mt-3 font-display text-4xl leading-[1.05] font-bold tracking-tight xl:text-5xl">
                <span className="text-rosver-red italic">ROS</span>
                <span className="italic">VER</span>
                <span className="mt-1 block text-3xl font-semibold not-italic text-white/90 xl:text-4xl">
                  Importaciones
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                Herramientas y soluciones para profesionales. Stock para
                ferreterías, distribuidores y proyectos en todo el Perú.
              </p>

              {/* Radar / globe decorativo CSS */}
              <div
                className="pointer-events-none absolute right-0 bottom-4 size-56 opacity-80 xl:size-72"
                aria-hidden
              >
                <RadarMark />
              </div>
            </motion.div>
          </div>

          <footer className="relative z-[1] flex shrink-0 flex-col gap-2 border-t border-white/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
            <p className="text-[11px] text-white/45">
              Rosver SAC © {year} — Herramientas y soluciones para
              profesionales.
            </p>
            <p className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
              Catálogo · Ofertas · Cotizar
            </p>
          </footer>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function RadarMark() {
  return (
    <div className="relative size-full">
      <div className="absolute inset-[8%] rounded-full border border-white/15" />
      <div className="absolute inset-[22%] rounded-full border border-white/12" />
      <div className="absolute inset-[36%] rounded-full border border-rosver-red/40" />
      <div className="absolute inset-[48%] rounded-full border border-white/10" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_40%,rgba(227,6,19,0.12)_100%)]" />
      {/* rejilla */}
      <div className="absolute inset-[12%] rotate-12 rounded-full border border-dashed border-white/10" />
      <span className="absolute top-[28%] right-[30%] size-2 rounded-sm bg-rosver-red shadow-[0_0_12px_#E30613]" />
      <span className="absolute bottom-[34%] left-[32%] size-1.5 rounded-sm bg-white/80" />
      <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-rosver-yellow" />
    </div>
  )
}
