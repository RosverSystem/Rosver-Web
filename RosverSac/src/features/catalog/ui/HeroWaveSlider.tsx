import {
  HOME_HERO_CTA,
  HOME_HERO_PANELS,
  homeHeroFromCms,
  type HomeHeroPanel,
} from '@/features/catalog/model/home-hero-slides'
import { api } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useOptionalToasts } from '@/shared/ui/toast-provider'
import {
  ArrowRight,
  Award,
  Compass,
  Verified,
} from 'cssvg-icons'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const TRUST = [
  { icon: Verified, label: 'El mejor precio desde unidad' },
  { icon: Compass, label: 'Envíos a todo el Perú' },
  { icon: Award, label: 'Temporada 2026' },
] as const

function useVisiblePanels() {
  const [visible, setVisible] = useState(1)
  useEffect(() => {
    const update = () => {
      // CTA + 4 paneles = 5 columnas (como el ejemplo)
      if (window.matchMedia('(min-width: 1100px)').matches) setVisible(5)
      else if (window.matchMedia('(min-width: 768px)').matches) setVisible(3)
      else setVisible(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return visible
}

/**
 * Hero multipanel estilo Katrina → Rosver.
 * CTA oscuro + paneles foto + pills partido rojo/blanco + trust bar.
 * Autoplay + flechas; contenido desde CMS `/api/content/home_hero`.
 */
export function HeroWaveSlider() {
  const toasts = useOptionalToasts()
  const reduceMotion = prefersReducedMotion()
  const visible = useVisiblePanels()
  const [panels, setPanels] = useState<HomeHeroPanel[]>(() =>
    HOME_HERO_PANELS.filter((p) => p.visible !== false)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  )
  const [ctaTitle, setCtaTitle] = useState<string>(HOME_HERO_CTA.title)
  const [ctaLabel, setCtaLabel] = useState<string>(HOME_HERO_CTA.ctaLabel)
  const [autoplayMs, setAutoplayMs] = useState(5000)
  const [index, setIndex] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [paused, setPaused] = useState(false)
  const hoverRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    void api<{ value: unknown }>('/api/content/home_hero')
      .then((res) => {
        if (cancelled) return
        const cms = homeHeroFromCms(res.value)
        if (cms?.panels.length) {
          setPanels(cms.panels)
          setCtaTitle(cms.ctaTitle)
          setCtaLabel(cms.ctaLabel)
          setAutoplayMs(cms.autoplayMs)
          setIndex(0)
        }
      })
      .catch(() => {
        /* demo local */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const items = panels
  const total = 1 + items.length
  const scrollMax = Math.max(0, total - visible)

  useEffect(() => {
    setIndex((i) => Math.min(i, scrollMax))
  }, [scrollMax])

  function go(delta: number) {
    setIndex((i) => {
      const next = i + delta
      if (next < 0) return scrollMax
      if (next > scrollMax) return 0
      return next
    })
  }

  useEffect(() => {
    if (reduceMotion || autoplayMs <= 0 || scrollMax <= 0 || paused) return
    const id = window.setInterval(() => {
      if (hoverRef.current) return
      setIndex((i) => (i >= scrollMax ? 0 : i + 1))
    }, autoplayMs)
    return () => window.clearInterval(id)
  }, [autoplayMs, scrollMax, reduceMotion, paused])

  async function downloadPdf() {
    if (pdfBusy) return
    setPdfBusy(true)
    toasts?.showInfo(['Generando catálogo PDF…'])
    try {
      const res = await fetch('/api/catalog/pdf', { credentials: 'include' })
      if (!res.ok) {
        let msg = 'No se pudo generar el catálogo.'
        try {
          const j = (await res.json()) as { error?: string }
          if (j.error) msg = j.error
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }
      const blob = await res.blob()
      const year = new Date().getFullYear()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Catalogo-Rosver-${year}.pdf`
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toasts?.showSuccess(['Catálogo PDF descargado.'])
    } catch (err) {
      toasts?.showErrors(
        {
          pdf:
            err instanceof Error
              ? err.message
              : 'No se pudo generar el catálogo.',
        },
        ['pdf'],
      )
    } finally {
      setPdfBusy(false)
    }
  }

  const trackWidthPct = (total / visible) * 100
  const itemWidthPct = 100 / total
  const translatePct = (index / total) * 100

  const titleLines = (() => {
    const raw = ctaTitle.trim()
    if (!raw) return ['DESPACHOS Y', 'CATÁLOGO', 'OFICIAL']
    if (raw.includes('\n')) {
      return raw.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    }
    const words = raw.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    for (let i = 0; i < words.length; i += 2) {
      lines.push(words.slice(i, i + 2).join(' '))
    }
    return lines.length ? lines : ['DESPACHOS Y', 'CATÁLOGO', 'OFICIAL']
  })()

  return (
    <section className="relative isolate bg-[#1a1224] text-white">
      <div
        className="relative"
        onMouseEnter={() => {
          hoverRef.current = true
          setPaused(true)
        }}
        onMouseLeave={() => {
          hoverRef.current = false
          setPaused(false)
        }}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false)
          }
        }}
      >
        {scrollMax > 0 ? (
          <>
            <button
              type="button"
              aria-label="Panel anterior"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-1 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-rosver-red sm:left-2 sm:size-10"
            >
              <span className="inline-flex rotate-180">
                <ArrowRight size={18} color="currentColor" strokeWidth={2} />
              </span>
            </button>
            <button
              type="button"
              aria-label="Panel siguiente"
              onClick={() => go(1)}
              className="absolute top-1/2 right-1 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-rosver-red sm:right-2 sm:size-10"
            >
              <ArrowRight size={18} color="currentColor" strokeWidth={2} />
            </button>
          </>
        ) : null}

        <div className="overflow-hidden">
          <div
            className={cn(
              'flex h-[min(52dvh,420px)] sm:h-[min(58dvh,520px)] lg:h-[min(62dvh,560px)]',
              reduceMotion ? '' : 'transition-transform duration-500 ease-out',
            )}
            style={{
              width: `${trackWidthPct}%`,
              transform: `translateX(-${translatePct}%)`,
            }}
          >
            <HeroCtaPanel
              widthPct={itemWidthPct}
              titleLines={titleLines}
              ctaLabel={ctaLabel}
              pdfBusy={pdfBusy}
              onDownload={() => void downloadPdf()}
            />

            {items.map((panel, i) => (
              <HeroImagePanel
                key={panel.id}
                panel={panel}
                eager={i < visible}
                widthPct={itemWidthPct}
              />
            ))}
          </div>
        </div>

        {scrollMax > 0 ? (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0 sm:bottom-3">
            {Array.from({ length: scrollMax + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir al grupo ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  'pointer-events-auto h-0.5 transition-all',
                  i === index
                    ? 'w-10 bg-rosver-red sm:w-12'
                    : 'w-8 bg-white/35 hover:bg-white/55 sm:w-10',
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10 bg-rosver-ink">
        <ul className="mx-auto flex max-w-7xl flex-col divide-y divide-white/10 sm:flex-row sm:divide-x sm:divide-y-0">
          {TRUST.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-1 items-center justify-center gap-2.5 px-4 py-2.5 text-center sm:py-3"
            >
              <Icon size={16} color="currentColor" strokeWidth={2} className="text-white/90" />
              <span className="text-[11px] font-medium tracking-wide text-white/90 sm:text-xs">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Panel CTA — tipografía blanca + pill PDF (textos desde CMS). */
function HeroCtaPanel({
  widthPct,
  titleLines,
  ctaLabel,
  pdfBusy,
  onDownload,
}: {
  widthPct: number
  titleLines: string[]
  ctaLabel: string
  pdfBusy: boolean
  onDownload: () => void
}) {
  return (
    <div
      className="relative flex h-full shrink-0 flex-col justify-end bg-[#1a1224] px-5 py-8 sm:px-6 sm:py-10 lg:px-7 lg:py-12"
      style={{ width: `${widthPct}%` }}
    >
      <div className="relative z-[1] max-w-[13.5rem] sm:max-w-[15rem]">
        <h2 className="font-display text-[1.35rem] leading-[1.05] font-bold tracking-tight text-white uppercase sm:text-2xl lg:text-[1.75rem]">
          {titleLines.map((line, i) => (
            <span key={`${line}-${i}`}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h2>
        <button
          type="button"
          disabled={pdfBusy}
          onClick={onDownload}
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-extrabold tracking-wide text-rosver-ink uppercase whitespace-nowrap transition hover:bg-rosver-soft disabled:opacity-70 sm:mt-7 sm:min-h-11 sm:text-xs"
        >
          {pdfBusy ? 'Generando…' : ctaLabel}
          <span aria-hidden className="text-base leading-none">
            ›
          </span>
        </button>
      </div>
    </div>
  )
}

function HeroImagePanel({
  panel,
  eager,
  widthPct,
}: {
  panel: HomeHeroPanel
  eager: boolean
  widthPct: number
}) {
  const body = (
    <>
      <img
        src={panel.imageUrl}
        alt=""
        width={800}
        height={1200}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-start gap-2.5 px-3 pb-8 sm:gap-3 sm:px-4 sm:pb-10">
        <p className="max-w-[12rem] font-display text-[13px] leading-tight font-bold tracking-wide text-white uppercase sm:max-w-[14rem] sm:text-sm lg:text-[0.95rem]">
          {panel.title}
        </p>
        <SplitPill left={panel.badgeLeft} right={panel.badgeRight} />
      </div>
    </>
  )

  const className =
    'group relative flex h-full shrink-0 flex-col justify-end overflow-hidden'

  if (panel.href) {
    return (
      <Link
        to={panel.href}
        className={className}
        style={{ width: `${widthPct}%` }}
      >
        {body}
      </Link>
    )
  }

  return (
    <div className={className} style={{ width: `${widthPct}%` }}>
      {body}
    </div>
  )
}

/** Pill partido rojo | blanco. */
function SplitPill({ left, right }: { left: string; right: string }) {
  return (
    <span className="inline-flex max-w-full overflow-hidden rounded-full text-[8px] leading-[1.2] font-extrabold tracking-wide uppercase sm:text-[9px]">
      <span className="bg-rosver-red px-2.5 py-1.5 whitespace-pre-line text-white sm:px-3 sm:py-2">
        {left}
      </span>
      <span className="bg-white px-2.5 py-1.5 whitespace-pre-line text-rosver-ink sm:px-3 sm:py-2">
        {right}
      </span>
    </span>
  )
}
