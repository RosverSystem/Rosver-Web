import { ArrowRight } from 'cssvg-icons'
import { Link } from 'react-router-dom'

export function CtaBand() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-rosver-red to-rosver-red-dark px-6 py-10 sm:px-10 sm:py-12">
      <div
        className="pointer-events-none absolute -top-12 -right-8 size-44 rounded-full bg-white/15 blur-xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-10 size-52 rounded-full bg-black/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.16em] text-white/75 uppercase">
            Cotización mayorista
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
            ¿Pedido grande o por volumen?
          </p>
          <p className="mt-2 text-sm text-white/85">
            Te respondemos en menos de 24 horas, sin compromiso.
          </p>
        </div>
        <Link
          to="/cotizar"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-rosver-red shadow-sm transition hover:bg-rosver-soft"
        >
          Solicitar cotización
          <ArrowRight size={16} color="currentColor" strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
