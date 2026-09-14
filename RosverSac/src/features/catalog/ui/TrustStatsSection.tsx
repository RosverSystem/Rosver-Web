import { Award, Compass, Group, ArrowRight } from 'cssvg-icons'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useEffect, useRef, useState } from 'react'

const STATS = [
  {
    id: 'years',
    value: '+3',
    label: 'años en el mercado',
    detail: 'Importando soluciones para el Perú',
    Icon: Award,
  },
  {
    id: 'clients',
    value: '+30 mil',
    label: 'clientes satisfechos',
    detail: 'Ferreterías, distribuidores y proyectos',
    Icon: Group,
  },
  {
    id: 'shipments',
    value: '+20 mil',
    label: 'envíos realizados',
    detail: 'Cobertura a nivel nacional',
    Icon: Compass,
  },
] as const

/**
 * Cifras de confianza Rosver (años / clientes / envíos).
 * Carrusel en móvil; grilla en desktop.
 */
export function TrustStatsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = prefersReducedMotion()
  const [paused, setPaused] = useState(false)

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-stat-card]')
    if (!card) return
    const step = card.offsetWidth + 16
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    if (next > max - 4) next = 0
    if (next < 0) next = max
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  useEffect(() => {
    if (reduceMotion || paused) return
    const timer = setInterval(() => scrollByCard(1), 4500)
    return () => clearInterval(timer)
  }, [reduceMotion, paused])

  return (
    <section
      aria-label="Rosver en números"
      className="relative overflow-hidden rounded-[1.75rem] bg-rosver-ink px-5 py-12 text-white sm:rounded-[2rem] sm:px-10 sm:py-14 lg:px-12 lg:py-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at 15% 20%, rgba(227,6,19,0.45), transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(30,58,95,0.4), transparent 45%)',
        }}
        aria-hidden
      />

      <div className="relative z-[1] mb-8 flex items-end justify-between gap-3 sm:mb-10">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-red uppercase">
            Confianza Rosver
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Números que respaldan tu compra
            <span className="text-rosver-red">.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/65">
            Experiencia, clientes y logística al servicio de tu negocio.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 lg:hidden">
          <NavBtn label="Anterior" onClick={() => scrollByCard(-1)} flip />
          <NavBtn label="Siguiente" onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <ul className="relative z-[1] hidden gap-4 lg:grid lg:grid-cols-3">
        {STATS.map((stat) => (
          <li key={stat.id}>
            <StatCard {...stat} />
          </li>
        ))}
      </ul>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative z-[1] hide-scrollbar flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory lg:hidden"
      >
        {STATS.map((stat) => (
          <div
            key={stat.id}
            data-stat-card
            className="w-[min(85vw,18rem)] shrink-0 snap-start"
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>
    </section>
  )
}

function StatCard({
  value,
  label,
  detail,
  Icon,
}: {
  value: string
  label: string
  detail: string
  Icon: typeof Award
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:p-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-rosver-red/20 text-rosver-red">
        <Icon size={22} color="currentColor" strokeWidth={2} />
      </span>
      <p className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold tracking-wide text-white uppercase sm:text-base">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/55">{detail}</p>
    </article>
  )
}

function NavBtn({
  label,
  onClick,
  flip,
}: {
  label: string
  onClick: () => void
  flip?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:border-rosver-red hover:bg-rosver-red"
    >
      <ArrowRight
        size={18}
        color="currentColor"
        strokeWidth={2}
        className={flip ? 'rotate-180' : undefined}
      />
    </button>
  )
}
