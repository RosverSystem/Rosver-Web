import { ArrowRight } from 'cssvg-icons'
import { Link } from 'react-router-dom'

/**
 * Banner promo ancho estilo landing (oferta + CTA), paleta Rosver.
 */
export function PromoBanners() {
  return (
    <section
      aria-label="Oferta destacada"
      className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#fff1f0] via-[#fff7f2] to-[#f3efe8] px-5 py-8 sm:px-10 sm:py-10"
    >
      <div
        className="pointer-events-none absolute -top-16 right-10 size-48 rounded-full bg-rosver-red/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/80 blur-2xl"
        aria-hidden
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr_auto]">
        <div>
          <span className="inline-flex rounded-full bg-rosver-red/10 px-3 py-1 text-[11px] font-bold tracking-wide text-rosver-red uppercase">
            Oferta por volumen
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
            Importá más.{' '}
            <span className="text-rosver-red">Pagá mejor.</span>
          </h2>
          <p className="mt-2 max-w-md text-sm text-rosver-muted">
            Condiciones especiales para ferreterías y distribuidores. Cotiza tu pedido
            mayorista sin compromiso.
          </p>
          <Link
            to="/cotizar"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
          >
            Cotizar ahora
            <ArrowRight size={16} color="currentColor" strokeWidth={2} />
          </Link>
        </div>

        <div className="relative mx-auto hidden max-w-xs sm:block lg:max-w-sm">
          <img
            src="https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=640&h=480&q=75"
            alt=""
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className="w-full object-contain drop-shadow-[0_20px_40px_rgba(17,17,17,0.2)]"
          />
        </div>

        <div className="text-left lg:text-right">
          <p className="font-display text-4xl font-bold text-rosver-red sm:text-5xl">
            Hasta
            <br />
            15%
          </p>
          <p className="mt-1 text-sm font-semibold text-rosver-ink">en pedidos mayoristas</p>
          <Link
            to="/catalogo"
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-rosver-ink underline-offset-4 hover:text-rosver-red hover:underline"
          >
            Ver colección
            <ArrowRight size={14} color="currentColor" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  )
}
