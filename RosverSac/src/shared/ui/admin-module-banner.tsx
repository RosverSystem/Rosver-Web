import { cn } from '@/shared/lib'
import type { ReactNode } from 'react'

export type AdminModuleStat = {
  label: string
  value: string | number
  /** Acento visual del valor */
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

type Props = {
  eyebrow?: string
  title: string
  description?: string
  stats?: AdminModuleStat[]
  actions?: ReactNode
  className?: string
}

const TONE: Record<NonNullable<AdminModuleStat['tone']>, string> = {
  default: 'text-white',
  success: 'text-rosver-success',
  warning: 'text-rosver-yellow',
  danger: 'text-rosver-red',
}

/**
 * Banner oscuro de módulo ERP (estilo área cliente) con métricas de cantidad.
 */
export function AdminModuleBanner({
  eyebrow = 'System',
  title,
  description,
  stats,
  actions,
  className,
}: Props) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl bg-rosver-ink text-white shadow-sm',
        className,
      )}
      aria-labelledby="admin-module-banner-title"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(135deg, transparent 40%, #E30613 40%, #E30613 42%, transparent 42%), linear-gradient(45deg, transparent 60%, #E30613 60%, #E30613 62%, transparent 62%), radial-gradient(circle at 92% 18%, #E30613 0 8%, transparent 9%)',
          backgroundSize: '48px 48px, 36px 36px, 100% 100%',
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-20 size-56 rounded-full bg-rosver-red/30 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-1.5 bg-rosver-red"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.22em] text-white/65 uppercase">
              {eyebrow}
            </p>
            <h1
              id="admin-module-banner-title"
              className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-xl text-sm text-white/75">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="min-w-[6.5rem] rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm"
              >
                <p className="text-[10px] font-bold tracking-wide text-white/55 uppercase">
                  {s.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 font-display text-xl font-bold tabular-nums',
                    TONE[s.tone ?? 'default'],
                  )}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
