import { INDUSTRY_SOLUTIONS } from '@/features/catalog/model/mocks'
import { IconBuilding, IconHome, IconSpray, IconWrench } from '@/shared/ui/icons'
import { Link } from 'react-router-dom'

const INDUSTRY_ICON = {
  wrench: IconWrench,
  building: IconBuilding,
  home: IconHome,
  spray: IconSpray,
}

const CARD_BG = [
  'bg-[#fff1f0]',
  'bg-rosver-soft',
  'bg-[#f3efe8]',
  'bg-[#f0f2f5]',
] as const

export function IndustrySolutions() {
  return (
    <section>
      <div className="mb-6 text-center sm:mb-8">
        <p className="text-xs font-bold tracking-[0.16em] text-rosver-red uppercase">
          Industrias
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
          Soluciones para cada rubro
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-rosver-muted">
          Te asesoramos según el negocio: reventa, obra, hogar o mantenimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRY_SOLUTIONS.map((solution, i) => {
          const Icon = INDUSTRY_ICON[solution.icon]
          return (
            <Link
              key={solution.slug}
              to="/cotizar"
              className={`group flex flex-col gap-3 rounded-[1.5rem] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(17,17,17,0.35)] ${CARD_BG[i % CARD_BG.length]}`}
            >
              <span
                className="flex size-11 items-center justify-center rounded-2xl bg-white text-rosver-red shadow-sm transition group-hover:bg-rosver-red group-hover:text-white"
                aria-hidden
              >
                <Icon />
              </span>
              <p className="font-display text-sm font-bold text-rosver-ink uppercase">
                {solution.title}
              </p>
              <p className="text-xs leading-relaxed text-rosver-muted">
                {solution.description}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
