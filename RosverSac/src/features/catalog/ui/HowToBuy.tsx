import { PURCHASE_STEPS } from '@/features/catalog/model/mocks'
import { IconCard, IconClipboard, IconHeadset, IconTruck } from '@/shared/ui/icons'
import { cn } from '@/shared/lib'

const STEP_ICON = {
  clipboard: IconClipboard,
  card: IconCard,
  truck: IconTruck,
  headset: IconHeadset,
}

const CIRCLE_BG = [
  'bg-rosver-red/15 text-rosver-red',
  'bg-rosver-soft text-rosver-ink',
  'bg-[#f3efe8] text-rosver-red',
  'bg-rosver-ink/10 text-rosver-ink',
] as const

/** Valores / pasos en círculos (como fila “Safe & Clean” de la referencia). */
export function HowToBuy() {
  return (
    <section className="text-center">
      <p className="text-xs font-bold tracking-[0.16em] text-rosver-red uppercase">
        Cómo comprar
      </p>
      <h2 className="mx-auto mt-2 max-w-xl font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
        Del pedido a la entrega,{' '}
        <span className="text-rosver-red">sin fricción</span>
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-rosver-muted">
        Un proceso claro para cotizar, pagar y recibir importaciones Rosver.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
        {PURCHASE_STEPS.map((step, i) => {
          const Icon = STEP_ICON[step.icon]
          return (
            <div key={step.title} className="flex flex-col items-center gap-3">
              <span
                className={cn(
                  'flex size-16 items-center justify-center rounded-full sm:size-[4.5rem]',
                  CIRCLE_BG[i % CIRCLE_BG.length],
                )}
                aria-hidden
              >
                <Icon width={28} height={28} />
              </span>
              <p className="font-display text-xs font-bold tracking-wide text-rosver-ink uppercase sm:text-sm">
                {step.title}
              </p>
              <p className="max-w-[12rem] text-[11px] leading-snug text-rosver-muted sm:text-xs">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
