import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useLayoutEffect, useMemo, useRef } from 'react'

type Point = { day: string; views: number; orders: number; quotes: number }

const SERIES = [
  { key: 'views' as const, color: '#1E3A5F', fill: 'rgba(30,58,95,0.14)' },
  { key: 'orders' as const, color: '#E30613', fill: 'rgba(227,6,19,0.12)' },
  { key: 'quotes' as const, color: '#F2B705', fill: 'rgba(242,183,5,0.18)' },
]

/** Línea + área con puntos y animación GSAP. */
export function AnalyticsLineChart({ series }: { series: Point[] }) {
  const ref = useRef<SVGSVGElement>(null)
  const w = 640
  const h = 240
  const pad = { t: 20, r: 16, b: 32, l: 40 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b

  const maxY = Math.max(
    1,
    ...series.flatMap((s) => [s.views, s.orders, s.quotes]),
  )

  const coords = useMemo(() => {
    return series.map((s, i) => {
      const x =
        pad.l +
        (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW)
      return {
        day: s.day,
        x,
        views: pad.t + innerH - (s.views / maxY) * innerH,
        orders: pad.t + innerH - (s.orders / maxY) * innerH,
        quotes: pad.t + innerH - (s.quotes / maxY) * innerH,
        raw: s,
      }
    })
  }, [series, maxY, innerH, innerW])

  function linePath(key: 'views' | 'orders' | 'quotes') {
    if (!coords.length) return ''
    return coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c[key].toFixed(1)}`)
      .join(' ')
  }

  function areaPath(key: 'views' | 'orders' | 'quotes') {
    if (!coords.length) return ''
    const base = pad.t + innerH
    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c[key].toFixed(1)}`)
      .join(' ')
    const last = coords[coords.length - 1]
    const first = coords[0]
    return `${line} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const areas = el.querySelectorAll('[data-area]')
    const lines = el.querySelectorAll<SVGPathElement>('path[data-line]')
    const dots = el.querySelectorAll('[data-dot]')

    lines.forEach((path) => {
      const len = path.getTotalLength()
      path.style.strokeDasharray = String(len)
      path.style.strokeDashoffset = String(len)
    })

    const tl = gsap.timeline()
    tl.fromTo(
      areas,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power1.out' },
      0,
    )
    tl.to(
      lines,
      { strokeDashoffset: 0, duration: 1.15, stagger: 0.12, ease: 'power2.out' },
      0.1,
    )
    tl.fromTo(
      dots,
      { scale: 0, opacity: 0, transformOrigin: 'center' },
      {
        scale: 1,
        opacity: 1,
        duration: 0.35,
        stagger: 0.015,
        ease: 'back.out(1.6)',
      },
      0.55,
    )

    return () => {
      tl.kill()
    }
  }, [series])

  const ticks = [0, 0.33, 0.66, 1].map((t) => Math.round(maxY * t))

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-rosver-soft/80 to-white p-2 sm:p-3">
      <svg
        ref={ref}
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Evolución diaria de vistas, pedidos y cotizaciones"
      >
        <defs>
          {SERIES.map((s) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((v) => {
          const y = pad.t + innerH - (v / maxY) * innerH
          return (
            <g key={`t-${v}`}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={pad.l - 8}
                y={y + 3}
                textAnchor="end"
                fill="#6B7280"
                fontSize="10"
                fontWeight="600"
              >
                {v}
              </text>
            </g>
          )
        })}

        {SERIES.map((s) => (
          <path
            key={`a-${s.key}`}
            data-area
            d={areaPath(s.key)}
            fill={`url(#grad-${s.key})`}
          />
        ))}

        {SERIES.map((s) => (
          <path
            key={`l-${s.key}`}
            data-line
            d={linePath(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {coords.map((c) =>
          SERIES.map((s) => {
            const val = c.raw[s.key]
            if (val <= 0) return null
            return (
              <circle
                key={`${c.day}-${s.key}`}
                data-dot
                cx={c.x}
                cy={c[s.key]}
                r={4}
                fill="#fff"
                stroke={s.color}
                strokeWidth={2}
              >
                <title>
                  {c.day}: {s.key} {val}
                </title>
              </circle>
            )
          }),
        )}

        {coords.map((c, i) => {
          const step = Math.max(1, Math.ceil(coords.length / 7))
          if (i % step !== 0 && i !== coords.length - 1) return null
          return (
            <text
              key={`lbl-${c.day}`}
              x={c.x}
              y={h - 10}
              textAnchor="middle"
              fill="#6B7280"
              fontSize="10"
              fontWeight="600"
            >
              {c.day.slice(5)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
