import { cn } from '@/shared/lib'

type StepperProps = {
  steps: { key: string; label: string }[]
  currentIndex: number
  className?: string
}

/** Tracker horizontal estilo marketplace (Falabella-like). */
export function StatusStepper({ steps, currentIndex, className }: StepperProps) {
  return (
    <ol
      className={cn(
        'grid w-full gap-2',
        steps.length === 4 ? 'grid-cols-4' : 'grid-cols-3',
        className,
      )}
    >
      {steps.map((step, i) => {
        const done = i <= currentIndex
        const current = i === currentIndex
        return (
          <li key={step.key} className="flex min-w-0 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'mx-auto flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  done
                    ? 'bg-rosver-success text-white'
                    : 'bg-rosver-soft text-rosver-muted',
                  current && 'ring-2 ring-rosver-red ring-offset-2',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
            </div>
            <span
              className={cn(
                'w-full truncate text-center text-[10px] font-bold uppercase sm:text-[11px]',
                done ? 'text-rosver-ink' : 'text-rosver-muted',
              )}
            >
              {step.label}
            </span>
            <span
              className={cn(
                'h-1 w-full rounded-full',
                done ? 'bg-rosver-success' : 'bg-rosver-line',
              )}
              aria-hidden
            />
          </li>
        )
      })}
    </ol>
  )
}
