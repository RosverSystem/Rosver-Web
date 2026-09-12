import { api, ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import {
  isOrderPipelineStatus,
  ORDER_PIPELINE_BADGE,
  ORDER_PIPELINE_LABEL,
  ORDER_PIPELINE_SHORT,
  ORDER_PIPELINE_STATUSES,
  type OrderPipelineStatus,
} from '@/shared/lib/order-pipeline'
import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  Activity,
  ArrowRight,
  Database,
  Group,
  Message,
  Progress,
  Refresh,
  StarGrow,
} from 'cssvg-icons'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'

type DashboardSummary = {
  ok: true
  updatedAt: string
  kpis: {
    products: number
    clients: number
    ordersOpen: number
    ordersTotal: number
    quotesOpen: number
    quotesTotal: number
    complaintsOpen: number
    totalViews: number
  }
  ordersByStatus: { status: string; count: number }[]
  top1: {
    slug: string
    name: string
    rating: number
    viewCount: number
    quoteCount: number
  } | null
  recentOrders: {
    id: string
    code: string
    status: string
    businessName: string | null
    createdAt: string
  }[]
}

/** Deudas abiertas del proyecto (espejo de docs/pendientes). */
const OPEN_PENDIENTES = [
  {
    id: 'P01',
    title: 'Google OAuth',
    status: 'bloqueado' as const,
    how: 'Crear OAuth en Google Cloud, poner Client ID/Secret en Railway y .env, probar /auth/google.',
  },
  {
    id: 'P04',
    title: 'Roles y permisos UI',
    status: 'pendiente' as const,
    how: 'Pantalla admin para roles finos sobre la API RBAC ya existente (no solo admin/client).',
  },
  {
    id: 'P14',
    title: 'Deploy con commitSha',
    status: 'parcial' as const,
    how: 'Asegurar que railway-deploy.ps1 siempre envíe el SHA del commit al redeploy.',
  },
  {
    id: 'P22',
    title: 'Sync ERP / CSV externo',
    status: 'pendiente' as const,
    how: 'Definir formato CSV del ERP externo; reutilizar pipeline de import ELFA o endpoint dedicado.',
  },
  {
    id: 'P30',
    title: 'Reseñas con texto',
    status: 'parcial' as const,
    how: 'Campo comentario en rating + UI en /cuenta; voto 1–5 ya está (0232).',
  },
  {
    id: 'P53',
    title: 'Leads y contenido real',
    status: 'parcial' as const,
    how: 'Tablas + API admin para leads/contenido (hoy mock); cotizaciones/pedidos ya OK.',
  },
  {
    id: 'P99',
    title: 'Dominio rosversac.com',
    status: 'pendiente' as const,
    how: 'DNS Cloudflare → Railway; SSL; actualizar 08-despliegue.',
  },
  {
    id: 'P129',
    title: 'Auto 2×1',
    status: 'pendiente' as const,
    how: 'Regla de promoción en carrito sin armar combo manual en ERP.',
  },
  {
    id: 'P130',
    title: 'Migrar ofertas viejas',
    status: 'pendiente' as const,
    how: 'Script SQL/admin: price_kind=offer → combos 035; validar en /ofertas.',
  },
] as const

const QUICK_LINKS = [
  { to: '/admin/pedidos', label: 'Pedidos', hint: 'Pipeline CRM' },
  { to: '/admin/cotizaciones', label: 'Cotizaciones', hint: 'Comercial' },
  { to: '/admin/clientes', label: 'Clientes', hint: 'Interés + oferta' },
  { to: '/admin/analitica', label: 'Analítica', hint: 'Demanda y tops' },
  { to: '/admin/productos', label: 'Productos', hint: 'Ficha CRM' },
  { to: '/admin/reclamaciones', label: 'Reclamaciones', hint: 'Libro' },
] as const

const STATUS_TONE: Record<
  (typeof OPEN_PENDIENTES)[number]['status'],
  string
> = {
  bloqueado: 'bg-rosver-red/10 text-rosver-red',
  pendiente: 'bg-rosver-yellow/25 text-rosver-ink',
  parcial: 'bg-rosver-blue/10 text-rosver-blue',
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function AdminDashboardPage() {
  const { toasts, showErrors, dismiss } = useFormToasts()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const pageRef = useRef<HTMLDivElement>(null)
  const kpiRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await api<DashboardSummary>('/api/admin/dashboard')
      setData(res)
    } catch (err) {
      showErrors([
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el inicio.',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const root = pageRef.current
    if (!root || !data || prefersReducedMotion()) return

    const sections = root.querySelectorAll('[data-section]')
    const kpis = kpiRef.current?.querySelectorAll('[data-kpi]') ?? []

    const tl = gsap.timeline()
    tl.fromTo(
      kpis,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out' },
    )
    tl.fromTo(
      sections,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, stagger: 0.07, ease: 'power2.out' },
      0.12,
    )

    kpis.forEach((card) => {
      const num = card.querySelector<HTMLElement>('[data-count]')
      if (!num) return
      const target = Number(num.dataset.target || 0)
      const obj = { v: 0 }
      gsap.to(obj, {
        v: target,
        duration: 0.85,
        delay: 0.15,
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

  const kpis = data?.kpis
  const statusMap = new Map(
    (data?.ordersByStatus ?? []).map((r) => [r.status, r.count]),
  )
  const pipelineMax = Math.max(
    1,
    ...ORDER_PIPELINE_STATUSES.map((s) => statusMap.get(s) ?? 0),
  )

  return (
    <div
      ref={pageRef}
      className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10"
    >
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <header className="relative overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_12px_40px_-28px_rgba(13,13,13,0.35)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 0% 0%, rgba(227,6,19,0.09), transparent 48%), radial-gradient(ellipse at 100% 20%, rgba(30,58,95,0.1), transparent 42%), linear-gradient(180deg, #fff 0%, #F3F4F6 140%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-red uppercase">
              SystemRSV · Panel
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-rosver-ink sm:text-3xl">
              Inicio
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-rosver-muted">
              Resumen operativo: pedidos abiertos, cotizaciones, clientes y
              pendientes del proyecto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rosver-line bg-white px-3 py-2 text-sm font-semibold text-rosver-ink transition hover:border-rosver-ink/25 disabled:opacity-60"
            >
              <Refresh size={16} color="currentColor" strokeWidth={2} />
              {loading ? 'Cargando…' : 'Actualizar'}
            </button>
            <Link
              to="/admin/analitica"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rosver-red px-3.5 py-2 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
            >
              Analítica
              <ArrowRight size={16} color="currentColor" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      <div
        ref={kpiRef}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <KpiCard
          label="Pedidos abiertos"
          value={kpis?.ordersOpen}
          hint={`${kpis?.ordersTotal ?? 0} total`}
          accent="#E30613"
          icon={<Progress size={18} color="currentColor" strokeWidth={2} />}
        />
        <KpiCard
          label="Cotizaciones"
          value={kpis?.quotesOpen}
          hint={`${kpis?.quotesTotal ?? 0} total`}
          accent="#1E3A5F"
          icon={<StarGrow size={18} color="currentColor" strokeWidth={2} />}
        />
        <KpiCard
          label="Clientes"
          value={kpis?.clients}
          hint="Activos"
          accent="#10B981"
          icon={<Group size={18} color="currentColor" strokeWidth={2} />}
        />
        <KpiCard
          label="Productos"
          value={kpis?.products}
          hint="Visibles"
          accent="#0D0D0D"
          icon={<Database size={18} color="currentColor" strokeWidth={2} />}
        />
        <KpiCard
          label="Reclamaciones"
          value={kpis?.complaintsOpen}
          hint="Abiertas"
          accent="#F2B705"
          icon={<Message size={18} color="currentColor" strokeWidth={2} />}
        />
        <KpiCard
          label="Vistas"
          value={kpis?.totalViews}
          hint="Fichas"
          accent="#1E3A5F"
          icon={<Activity size={18} color="currentColor" strokeWidth={2} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section
          data-section
          className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5 lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-rosver-ink">
                Pedidos por fase
              </h2>
              <p className="text-[11px] text-rosver-muted">
                Snapshot del pipeline CRM
              </p>
            </div>
            <Link
              to="/admin/pedidos"
              className="text-xs font-bold text-rosver-red hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {ORDER_PIPELINE_STATUSES.map((status) => {
              const count = statusMap.get(status) ?? 0
              const pct = Math.round((count / pipelineMax) * 100)
              return (
                <li key={status}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold',
                        ORDER_PIPELINE_BADGE[status],
                      )}
                    >
                      <span className="sm:hidden">
                        {ORDER_PIPELINE_SHORT[status]}
                      </span>
                      <span className="hidden sm:inline">
                        {ORDER_PIPELINE_LABEL[status]}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-rosver-ink tabular-nums">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-rosver-soft">
                    <div
                      className="h-full rounded-full bg-rosver-red transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section
          data-section
          className="overflow-hidden rounded-2xl border border-rosver-line bg-rosver-ink p-4 text-white shadow-sm sm:p-5 lg:col-span-2"
        >
          <p className="text-[11px] font-bold tracking-wide text-white/55 uppercase">
            Top 1 tendencia
          </p>
          {data?.top1 ? (
            <>
              <p className="mt-2 line-clamp-3 text-base font-bold leading-snug sm:text-lg">
                {data.top1.name}
              </p>
              <p className="mt-3 text-xs text-white/70">
                ★ {data.top1.rating.toFixed(1)} · {data.top1.viewCount} vistas ·{' '}
                {data.top1.quoteCount} cotiz.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/producto/${data.top1.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-rosver-yellow px-3 py-2 text-xs font-bold text-rosver-ink"
                >
                  Ver en tienda
                </Link>
                <Link
                  to="/admin/analitica"
                  className="inline-flex rounded-xl border border-white/25 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  Más tops
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/55">
              {loading ? 'Cargando…' : 'Sin datos de demanda aún'}
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section
          data-section
          className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5 lg:col-span-3"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-rosver-ink">
                Últimos pedidos
              </h2>
              <p className="text-[11px] text-rosver-muted">
                Los 5 más recientes
              </p>
            </div>
          </div>
          {data?.recentOrders.length ? (
            <ul className="divide-y divide-rosver-line">
              {data.recentOrders.map((o) => {
                const status = isOrderPipelineStatus(o.status)
                  ? o.status
                  : null
                return (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/admin/pedidos/vista?codigo-pedido=${encodeURIComponent(o.code)}`}
                        className="text-sm font-bold text-rosver-ink hover:text-rosver-red"
                      >
                        {o.code}
                      </Link>
                      <p className="truncate text-xs text-rosver-muted">
                        {o.businessName || 'Sin razón social'} ·{' '}
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                    {status ? (
                      <span
                        className={cn(
                          'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold',
                          ORDER_PIPELINE_BADGE[status as OrderPipelineStatus],
                        )}
                      >
                        {ORDER_PIPELINE_SHORT[status as OrderPipelineStatus]}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-rosver-muted">
              {loading ? 'Cargando…' : 'Aún no hay pedidos.'}
            </p>
          )}
        </section>

        <section
          data-section
          className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5 lg:col-span-2"
        >
          <h2 className="text-sm font-bold text-rosver-ink">Accesos rápidos</h2>
          <p className="mt-0.5 text-[11px] text-rosver-muted">
            Módulos del día a día
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {QUICK_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex h-full flex-col rounded-xl border border-rosver-line bg-rosver-soft/50 px-3 py-2.5 transition hover:border-rosver-red/40 hover:bg-white"
                >
                  <span className="text-xs font-bold text-rosver-ink">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-rosver-muted">
                    {item.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        data-section
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,13,13,0.35)] sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-rosver-ink">
              Pendientes del proyecto
            </h2>
            <p className="text-[11px] text-rosver-muted">
              Qué falta y cómo abordarlo (docs/pendientes)
            </p>
          </div>
          <span className="rounded-lg bg-rosver-soft px-2.5 py-1 text-[11px] font-bold text-rosver-ink tabular-nums">
            {OPEN_PENDIENTES.length} abiertos
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OPEN_PENDIENTES.map((p) => (
            <li
              key={p.id}
              className="flex flex-col rounded-xl border border-rosver-line bg-rosver-soft/40 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wide text-rosver-muted">
                  {p.id}
                </span>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-bold capitalize',
                    STATUS_TONE[p.status],
                  )}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-bold text-rosver-ink">
                {p.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-rosver-muted">
                {p.how}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string
  value: number | undefined
  hint: string
  accent: string
  icon: ReactNode
}) {
  const n = value ?? 0
  return (
    <div
      data-kpi
      className="relative overflow-hidden rounded-2xl border border-rosver-line bg-white p-3.5 shadow-sm sm:p-4"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
          {label}
        </p>
        <span
          className="inline-flex size-7 items-center justify-center rounded-lg bg-rosver-soft"
          style={{ color: accent }}
        >
          {icon}
        </span>
      </div>
      <p
        data-count
        data-target={n}
        className="mt-2 font-display text-2xl font-bold tabular-nums text-rosver-ink"
      >
        {n.toLocaleString('es-PE')}
      </p>
      <p className="mt-0.5 text-[11px] text-rosver-muted">{hint}</p>
    </div>
  )
}
