import { CATEGORIES } from '@/features/catalog/model/mocks'
import { WHATSAPP_DISPLAY, WHATSAPP_LINK } from '@/shared/lib'
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp } from '@/shared/ui/icons'
import { Link } from 'react-router-dom'

const SOCIAL = [
  { label: 'Facebook', href: '#', Icon: IconFacebook },
  { label: 'TikTok', href: '#', Icon: IconTikTok },
  { label: 'Instagram', href: '#', Icon: IconInstagram },
  { label: 'WhatsApp', href: WHATSAPP_LINK, Icon: IconWhatsApp },
] as const

export function Footer() {
  return (
    <footer className="border-t border-rosver-line bg-rosver-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-display text-2xl font-bold tracking-tight italic"
              aria-label="Rosver Sac — inicio"
            >
              <span className="text-rosver-red">ROS</span>
              <span className="text-white">VER</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/50">
              Importación y venta al por mayor de herramientas, ferretería, electrónica y
              materiales de construcción para todo el Perú.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold tracking-widest text-white uppercase">
              Categorías
            </p>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/catalogo/${category.slug}`}
                    className="transition hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold tracking-widest text-white uppercase">
              Empresa
            </p>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              <li>
                <Link to="/catalogo" className="transition hover:text-white">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/cotizar" className="transition hover:text-white">
                  Cotizar
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-white">
                  Mi cuenta
                </Link>
              </li>
              <li>
                <Link to="/carrito" className="transition hover:text-white">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold tracking-widest text-white uppercase">
              Contacto
            </p>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              <li>
                <Link to="/contacto" className="transition hover:text-white">
                  Formulario de contacto
                </Link>
              </li>
              <li>{WHATSAPP_DISPLAY}</li>
              <li>Lima, Perú</li>
            </ul>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#20bd5a]"
            >
              <IconWhatsApp className="size-4" />
              Escríbenos
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rosver S.A.C. — Todos los derechos reservados.</p>
          <p>Importación y venta al por mayor · Lima, Perú</p>
        </div>
      </div>
    </footer>
  )
}
