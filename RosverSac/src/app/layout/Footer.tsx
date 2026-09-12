import {
  buildWhatsAppLink,
  ROSVER_COMPANY,
  SOCIAL_LINKS,
  WHATSAPP_DEFAULT_MESSAGE,
  WHATSAPP_LINES,
} from '@/shared/lib'
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp } from '@/shared/ui/icons'
import { Link } from 'react-router-dom'

const FALLBACK_WA = `https://wa.me/${WHATSAPP_LINES[0].e164}`

const SOCIAL = [
  { label: 'Facebook', href: SOCIAL_LINKS.facebook, Icon: IconFacebook },
  { label: 'TikTok', href: SOCIAL_LINKS.tiktok, Icon: IconTikTok },
  { label: 'Instagram', href: SOCIAL_LINKS.instagram, Icon: IconInstagram },
  {
    label: 'WhatsApp',
    href: FALLBACK_WA,
    Icon: IconWhatsApp,
    rotateWa: true as const,
  },
] as const

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Ofertas', to: '/ofertas' },
  { label: 'Ranking', to: '/ranking' },
  { label: 'Cotizar', to: '/cotizar' },
  { label: 'Carrito', to: '/carrito' },
  { label: 'Contacto', to: '/contacto' },
] as const

export function Footer() {
  const co = ROSVER_COMPANY

  return (
    <footer className="border-t border-rosver-line bg-rosver-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="group inline-flex items-center gap-1 font-display text-2xl font-bold tracking-tight italic"
              aria-label="Rosver Sac — inicio"
            >
              <span className="text-rosver-red">ROS</span>
              <span className="text-white transition group-hover:text-rosver-red">
                VER
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/50">
              Importación y venta al por mayor de herramientas, ferretería,
              electrónica y materiales de construcción para todo el Perú.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL.map((item) => (
                <a
                  key={item.label}
                  href={
                    'rotateWa' in item && item.rotateWa
                      ? FALLBACK_WA
                      : item.href
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  onClick={
                    'rotateWa' in item && item.rotateWa
                      ? (e) => {
                          e.currentTarget.href = buildWhatsAppLink(
                            WHATSAPP_DEFAULT_MESSAGE,
                          )
                        }
                      : undefined
                  }
                  className="inline-flex size-9 items-center justify-center rounded-full bg-white ring-2 ring-transparent transition duration-300 hover:-translate-y-0.5 hover:ring-rosver-red hover:shadow-[0_6px_16px_rgba(227,6,19,0.35)]"
                >
                  <item.Icon />
                </a>
              ))}
            </div>
            {/* Solo el badge: más ancho, menos alto */}
            <Link
              to="/libro-reclamaciones"
              className="mt-5 inline-flex w-full max-w-[16.5rem] items-center justify-center rounded-lg border border-white/20 bg-white px-3 py-1.5 transition hover:border-rosver-red/50 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosver-red sm:max-w-[18rem]"
            >
              <img
                src="/libro-reclamaciones.png"
                alt="Libro de reclamaciones digital"
                width={280}
                height={40}
                className="h-8 w-full max-h-8 object-contain object-center sm:h-9 sm:max-h-9"
                loading="lazy"
                decoding="async"
              />
            </Link>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold tracking-widest text-white uppercase">
              Navegación
            </p>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              {NAV_LINKS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="transition hover:text-rosver-red"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold tracking-widest text-white uppercase">
              Datos empresa
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-white/60">
              <li>
                <span className="block text-[11px] tracking-wide text-white/35 uppercase">
                  Razón social
                </span>
                <span className="text-white/85">{co.legalName}</span>
              </li>
              <li>
                <span className="block text-[11px] tracking-wide text-white/35 uppercase">
                  Nombre comercial
                </span>
                <span className="text-white/85">{co.tradeName}</span>
              </li>
              <li>
                <span className="block text-[11px] tracking-wide text-white/35 uppercase">
                  RUC
                </span>
                <span className="font-semibold text-white/90">{co.ruc}</span>
              </li>
              <li>
                <span className="block text-[11px] tracking-wide text-white/35 uppercase">
                  Dirección
                </span>
                <a
                  href={co.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-snug text-white/75 transition hover:text-rosver-red"
                >
                  {co.localAddress}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold tracking-widest text-white uppercase">
              Contacto
            </p>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              <li>
                <Link to="/contacto" className="transition hover:text-rosver-red">
                  Formulario de contacto
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${co.email}`}
                  className="transition hover:text-rosver-red"
                >
                  {co.email}
                </a>
              </li>
              <li className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                {WHATSAPP_LINES.map((line, i) => (
                  <span
                    key={line.e164}
                    className="inline-flex items-center gap-1.5"
                  >
                    <a
                      href={`https://wa.me/${line.e164}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-rosver-red"
                    >
                      {line.display}
                    </a>
                    {i < WHATSAPP_LINES.length - 1 ? (
                      <span className="text-white/30" aria-hidden>
                        ·
                      </span>
                    ) : null}
                  </span>
                ))}
              </li>
              <li>
                <a
                  href={co.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-snug text-white/50 transition hover:text-rosver-red"
                >
                  {co.localAddress}
                </a>
              </li>
            </ul>
            <a
              href={FALLBACK_WA}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.currentTarget.href = buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE)
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#20bd5a]"
            >
              <IconWhatsApp className="size-4" />
              Escríbenos
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {co.legalName} — RUC {co.ruc}. Todos
            los derechos reservados.
          </p>
          <p>Importación y venta al por mayor · Lima, Perú</p>
        </div>
      </div>
    </footer>
  )
}
