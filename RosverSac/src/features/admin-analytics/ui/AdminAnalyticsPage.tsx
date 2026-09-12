import {
  fetchAnalyticsOverview,
  rebuildAnalyticsDemand,
} from '@/features/admin-analytics/model/api'
import type { AnalyticsOverview } from '@/features/admin-analytics/model/types'
import { AnalyticsBarChart } from '@/features/admin-analytics/ui/AnalyticsBarChart'
import { AnalyticsDonutChart } from '@/features/admin-analytics/ui/AnalyticsDonutChart'
import { AnalyticsLineChart } from '@/features/admin-analytics/ui/AnalyticsLineChart'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Activity, Gauge, Refresh, StarGrow } from 'cssvg-icons'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'

/**
 * Analítica ERP — diseño SaaS + gráficas animadas (GSAP).
 */
export function AdminAnalyticsPage() {
  const { toasts, showErrors, showSuccess, dismiss } = useFormToasts()
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(14)
  const [rebuilding, setRebuilding] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const kpiRef = useRef<HTMLDivElement>(null)

  async function load(range = days) {
    setLoading(true)
    try {
      const res = await fetchAnalyticsOverview(range)
      setData(res)
    } catch (err) {
      showErrors([
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar la analítica.',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  useLayoutEffect(() => {
    const root = pageRef.current
    if (!root || !data || prefersReducedMotion()) return

    const sections = root.querySelectorAll('[data-section]')
    const kpis = kpiRef.current?.querySelectorAll('[data-kpi]') ?? []

    const tl = gsap.timeline()
    tl.fromTo(
      kpis,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' },
    )
    tl.fromTo(
      sections,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
      0.15,
    )

    kpis.forEach((card) => {
      const num = card.querySelector<HTMLElement>('[data-count]')
      if (!num) return
      const target = Number(num.dataset.target || 0)
      const obj = { v: 0 }
      gsap.to(obj, {
        v: target,
        duration: 0.9,
        delay: 0.2,
        ease: 'power2.out',
        onUpdate: () => {
          num.textContent = Math.round(obj.v).toLocaleString('es-PE')
        },
      })
    })

    return () => {
      tl.kill()
    }
  }, [data?.updatedAt])

  async function onRebuild() {
    setRebuilding(true)
    try {
      const res = await rebuildAnalyticsDemand()
      setData(res)
      showSuccess(['Pedidos y cotizaciones recalculados desde el historial.'])
    } catch (err) {
      showErrors([
        err instanceof ApiError ? err.message : 'No se pudo recalcular.',
      ])
    } finally {
      setRebuilding(false)
    }
  }

  const kpis = data?.kpis
  const top1 = kpis?.top1

  return (
    <div
      ref={pageRef}
      className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10"
    >
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <header className="relative overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_12px_40px_-28px_rgba(13,13,13,0.35)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse at 0% 0%, rgba(227,6,19,0.08), transparent 45%), radial-gradient(ellipse at 100% 0%, rgba(30,58,95,0.1), transparent 40%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-red uppercase">
              SystemRSV · Demanda
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
              Analítica
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-rosver-muted">
              Vistas, pedidos, cotizaciones y tops que alimentan la tendencia
              de la tienda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-rosver-line bg-rosver-soft/60 p-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                    days === d
                      ? 'bg-white text-rosver-ink shadow-sm'
                      : 'text-rosver-muted hover:text-rosver-ink',
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rosver-line bg-white px-3 py-2 text-sm font-semibold text-rosver-ink transition hover:border-rosver-ink/25 disabled:opacity-60"
            >
              <Refresh size={16} color="currentColor" strokeWidth={2} />
              {loading ? 'Cargando…' : 'Actualizar'}
            </button>
            <button
              type="button"
              onClick={() => void onRebuild()}
              disabled={rebuilding}
              className="rounded-xl bg-rosver-red px-3 py-2 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {rebuilding ? 'Recalculando…' : 'Recalcular'}
            </button>
          </div>
        </div>
      </header>

      <div
        ref={kpiRef}
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        <KpiCard
          label="Vistas"
          value={kpis?.totalViews}
          hint="Fichas abiertas"
          accent="#1E3A5F"
        />
        <KpiCard
          label="Pedidos"
          value={kpis?.totalOrdersUnits}
          hint="Unidades pedidas"
          accent="#E30613"
        />
        <KpiCard
          label="Cotizados"
          value={kpis?.totalQuotesUnits}
          hint="Unidades cotizadas"
          accent="#F2B705"
        />
        <KpiCard
          label="Con rating"
          value={kpis?.ratedProducts}
          hint="Productos valorados"
          accent="#10B981"
        />
        <div
          data-kpi
          className="col-span-2 overflow-hidden rounded-2xl border border-rosver-line bg-rosver-ink p-4 text-white shadow-sm lg:col-span-1"
        >
          <p className="text-[11px] font-bold tracking-wide text-white/60 uppercase">
            Top 1 tendencia
          </p>
          {top1 ? (
            <>
              <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug">
                {top1.name}
              </p>
              <p className="mt-2 text-xs text-white/70">
                ★ {top1.rating.toFixed(1)} · {top1.viewCount} vistas ·{' '}
                {top1.quoteCount} cotiz.
              </p>
              <Link
                to={`/producto/${top1.slug}`}
                className="mt-3 inline-flex text-xs font-bold text-rosver-yellow hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                Ver en tienda →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/60">Sin datos aún</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section
          data-section
          className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5 lg:col-span-3"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rosver-ink">
              <span className="inline-flex size-8 items-center justify-center rounded-xl bg-rosver-soft text-rosver-blue">
                <Activity size={18} color="currentColor" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Evolución diaria</h2>
                <p className="text-[11px] text-rosver-muted">
                  Últimos {days} días
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <LegendDot color="#1E3A5F" label="Vistas" />
              <LegendDot color="#E30613" label="Pedidos" />
              <LegendDot color="#F2B705" label="Cotiz." />
            </div>
          </div>
          {data ? (
            <AnalyticsLineChart series={data.series} />
          ) : (
            <SkeletonChart />
          )}
        </section>

        <section
          data-section
          className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center gap-2 text-rosver-ink">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-rosver-soft text-rosver-red">
              <Gauge size={18} color="currentColor" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-sm font-bold">Mix de demanda</h2>
              <p className="text-[11px] text-rosver-muted">
                Solo actividad real (sin reseñas)
              </p>
            </div>
          </div>
          {data ? <AnalyticsDonutChart mix={data.mix} /> : <SkeletonChart />}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopCard title="Mejor valorados" accent="#F2B705" data-section>
          <AnalyticsBarChart
            items={data?.tops.rated ?? []}
            valueKey="score"
            accent="#F2B705"
          />
        </TopCard>
        <TopCard title="Más vistos" accent="#1E3A5F" data-section>
          <AnalyticsBarChart
            items={data?.tops.viewed ?? []}
            valueKey="viewCount"
            accent="#1E3A5F"
          />
        </TopCard>
        <TopCard title="Más pedidos" accent="#E30613" data-section>
          <AnalyticsBarChart
            items={data?.tops.ordered ?? []}
            valueKey="orderCount"
            accent="#E30613"
          />
        </TopCard>
        <TopCard title="Más cotizados" accent="#10B981" data-section>
          <AnalyticsBarChart
            items={data?.tops.quoted ?? []}
            valueKey="quoteCount"
            accent="#10B981"
          />
        </TopCard>
      </div>

      <section
        data-section
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5"
      >
        <div className="mb-3 flex items-center gap-2 text-rosver-ink">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-rosver-soft text-rosver-red">
            <StarGrow size={18} color="currentColor" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-sm font-bold">Score de tendencia (home)</h2>
            <p className="text-[11px] text-rosver-muted">
              Misma lógica que «Productos en tendencia» cuando no hay marca
              manual.
            </p>
          </div>
        </div>
        <AnalyticsBarChart
          items={data?.tops.trending ?? []}
          valueKey="score"
          accent="#E30613"
        />
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value?: number
  hint: string
  accent: string
}) {
  return (
    <div
      data-kpi
      className="relative overflow-hidden rounded-2xl border border-rosver-line bg-white p-4 shadow-sm"
    >
      <span
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ background: accent }}
        aria-hidden
      />
      <p className="pl-2 text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
        {label}
      </p>
      <p
        data-count
        data-target={value ?? 0}
        className="mt-1 pl-2 font-display text-2xl font-bold tabular-nums text-rosver-ink sm:text-3xl"
      >
        0
      </p>
      <p className="mt-0.5 pl-2 text-[11px] text-rosver-muted">{hint}</p>
      <span
        className="pointer-events-none absolute -right-2 -bottom-3 size-14 rounded-full opacity-10"
        style={{ background: accent }}
        aria-hidden
      />
    </div>
  )
}

function TopCard({
  title,
  accent,
  children,
  ...rest
}: {
  title: string
  accent: string
  children: ReactNode
} & HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...rest}
      className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)]"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full ring-2 ring-white"
          style={{ background: accent, boxShadow: `0 0 0 3px ${accent}22` }}
          aria-hidden
        />
        <h2 className="text-sm font-bold text-rosver-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rosver-soft px-2 py-1 text-rosver-muted">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function SkeletonChart() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl bg-rosver-soft/60 text-sm text-rosver-muted">
      Cargando gráfica…
    </div>
  )
}
