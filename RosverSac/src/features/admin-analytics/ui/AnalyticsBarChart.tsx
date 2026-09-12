import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useLayoutEffect, useRef } from 'react'
import type { AnalyticsTopItem } from '../model/types'
import { Link } from 'react-router-dom'

/** Histograma horizontal con rank y animación. */
export function AnalyticsBarChart({
  items,
  valueKey,
  accent = '#E30613',
}: {
  items: AnalyticsTopItem[]
  valueKey: 'viewCount' | 'orderCount' | 'quoteCount' | 'score' | 'rating'
  accent?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey]) || 0))

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const rows = el.querySelectorAll('[data-row]')
    const bars = el.querySelectorAll('[data-bar]')
    const tl = gsap.timeline()
    tl.fromTo(
      rows,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out' },
    )
    tl.fromTo(
      bars,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.65, stagger: 0.05, ease: 'power3.out' },
      0.08,
    )
    return () => {
      tl.kill()
    }
  }, [items, valueKey])

  if (!items.length) {
    return (
      <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-rosver-line bg-rosver-soft/40 px-3 py-6 text-center">
        <p className="text-sm font-semibold text-rosver-ink">Sin datos aún</p>
        <p className="mt-1 text-xs text-rosver-muted">
          Se llenará con actividad real de la tienda.
        </p>
      </div>
    )
  }

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {items.slice(0, 6).map((item, idx) => {
        const val = Number(item[valueKey]) || 0
        const pct = Math.max(6, (val / max) * 100)
        return (
          <div key={item.id} data-row className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white"
                  style={{ background: accent }}
                >
                  {idx + 1}
                </span>
                <Link
                  to={`/producto/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs font-semibold text-rosver-ink transition hover:text-rosver-red"
                  title={item.name}
                >
                  {item.name}
                </Link>
              </div>
              <span className="shrink-0 text-xs font-bold tabular-nums text-rosver-ink">
                {valueKey === 'rating' || valueKey === 'score'
                  ? val.toFixed(valueKey === 'rating' ? 1 : 1)
                  : val.toLocaleString('es-PE')}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-rosver-soft">
              <div
                data-bar
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${accent}cc, ${accent})`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
