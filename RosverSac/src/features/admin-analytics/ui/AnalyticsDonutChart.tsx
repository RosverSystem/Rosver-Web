import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useLayoutEffect, useRef } from 'react'

const COLORS = {
  views: '#1E3A5F',
  orders: '#E30613',
  quotes: '#F2B705',
} as const

/**
 * Donut de demanda (vistas / pedidos / cotizaciones).
 * Centro en HTML para no tapar el texto con el arco.
 */
export function AnalyticsDonutChart({
  mix,
}: {
  mix: { views: number; orders: number; quotes: number; reviews?: number }
}) {
  const ref = useRef<SVGSVGElement>(null)
  const entries = [
    { key: 'views' as const, label: 'Vistas', value: mix.views },
    { key: 'orders' as const, label: 'Pedidos', value: mix.orders },
    { key: 'quotes' as const, label: 'Cotiz.', value: mix.quotes },
  ]
  const total = entries.reduce((s, e) => s + e.value, 0) || 1
  const r = 56
  const stroke = 18
  const c = 2 * Math.PI * r

  let offset = 0
  const arcs = entries.map((e) => {
    const len = (e.value / total) * c
    const item = { ...e, len, offset, pct: Math.round((e.value / total) * 100) }
    offset += len
    return item
  })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const circles = el.querySelectorAll<SVGCircleElement>('circle[data-arc]')
    const tween = gsap.fromTo(
      circles,
      {
        strokeDasharray: (_i: number) => `0 ${c}`,
        strokeDashoffset: (i: number) => -arcs[i].offset,
      },
      {
        strokeDasharray: (i: number) => `${arcs[i].len} ${c - arcs[i].len}`,
        duration: 1.05,
        stagger: 0.1,
        ease: 'power2.out',
      },
    )
    const center = el.parentElement?.querySelector('[data-donut-center]')
    const centerTween = center
      ? gsap.fromTo(
          center,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, delay: 0.25, ease: 'back.out(1.4)' },
        )
      : null
    return () => {
      tween.kill()
      centerTween?.kill()
    }
  }, [mix.views, mix.orders, mix.quotes, c])

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-6">
      <div className="relative size-40 shrink-0 sm:size-44">
        <svg
          ref={ref}
          viewBox="0 0 140 140"
          className="size-full -rotate-90"
          role="img"
          aria-label="Mix de demanda"
        >
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={stroke}
          />
          {arcs.map((a) => (
            <circle
              key={a.key}
              data-arc
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={COLORS[a.key]}
              strokeWidth={stroke}
              strokeDasharray={`${a.len} ${c - a.len}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div
          data-donut-center
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <p className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
            Total
          </p>
          <p className="font-display text-2xl font-bold tabular-nums text-rosver-ink">
            {total.toLocaleString('es-PE')}
          </p>
        </div>
      </div>

      <ul className="flex w-full max-w-[220px] flex-col gap-2.5">
        {arcs.map((e) => (
          <li
            key={e.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-rosver-line/80 bg-rosver-soft/50 px-3 py-2"
          >
            <span className="inline-flex items-center gap-2 text-sm text-rosver-ink">
              <span
                className="size-2.5 rounded-full ring-2 ring-white"
                style={{ background: COLORS[e.key] }}
              />
              {e.label}
            </span>
            <span className="text-sm font-bold tabular-nums text-rosver-ink">
              {e.value.toLocaleString('es-PE')}
              <span className="ml-1 text-[11px] font-semibold text-rosver-muted">
                {e.pct}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
