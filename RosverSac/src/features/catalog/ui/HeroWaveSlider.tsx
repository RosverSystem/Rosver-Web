import {
  HERO_PANEL_DESIGNER_SPECS,
  HOME_HERO_CTA,
  HOME_HERO_PANELS,
  panelsFromCmsSlides,
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
  Download,
  Image as ImageIcon,
  Verified,
} from 'cssvg-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/** Slots de imagen del strip (diseñador: 4 paneles 800×1200). */
const PLACEHOLDER_SLOTS = 4

const TRUST = [
  { icon: Verified, label: 'El mejor precio desde unidad' },
  { icon: Compass, label: 'Envíos a todo el Perú' },
  { icon: Award, label: 'Temporada 2026' },
] as const

function useVisiblePanels() {
  const [visible, setVisible] = useState(1)
  useEffect(() => {
    const update = () => {
      // CTA + 4 paneles = 5 columnas a pantallas grandes
      if (window.matchMedia('(min-width: 1280px)').matches) setVisible(5)
      else if (window.matchMedia('(min-width: 1024px)').matches) setVisible(4)
      else if (window.matchMedia('(min-width: 768px)').matches) setVisible(2)
      else setVisible(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return visible
}

/**
 * Hero multipanel (strip vertical + CTA oscuro + pills rojo/gris).
 * Referencia Katrina → paleta Rosver (`rosver-red` / `rosver-ink`).
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
  const [index, setIndex] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api<{ value: unknown }>('/api/content/home_hero')
      .then((res) => {
        if (cancelled) return
        const mapped = panelsFromCmsSlides(res.value)
        if (mapped?.length) {
          setPanels(mapped)
          setIndex(0)
        }
      })
      .catch(() => {
        /* fallback local */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const items = panels
  const usePlaceholders = items.length === 0
  const slotCount = usePlaceholders ? PLACEHOLDER_SLOTS : items.length
  // CTA + paneles (reales o placeholders).
  const total = 1 + slotCount
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

  return (
    <section className="relative isolate bg-rosver-ink text-white">
      <div className="relative">
        {scrollMax > 0 ? (
          <>
            <button
              type="button"
              aria-label="Panel anterior"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm transition hover:bg-rosver-red sm:left-3 sm:size-11"
            >
              <span className="inline-flex rotate-180">
                <ArrowRight size={20} color="currentColor" strokeWidth={2} />
              </span>
            </button>
            <button
              type="button"
              aria-label="Panel siguiente"
              onClick={() => go(1)}
              className="absolute top-1/2 right-2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm transition hover:bg-rosver-red sm:right-3 sm:size-11"
            >
              <ArrowRight size={20} color="currentColor" strokeWidth={2} />
            </button>
          </>
        ) : null}

        <div className="overflow-hidden">
          <div
            className={cn(
              'flex h-[min(58dvh,480px)] sm:h-[min(62dvh,560px)] lg:h-[min(68dvh,640px)]',
              reduceMotion ? '' : 'transition-transform duration-500 ease-out',
            )}
            style={{
              width: `${trackWidthPct}%`,
              transform: `translateX(-${translatePct}%)`,
            }}
          >
            <HeroCtaPanel
              widthPct={itemWidthPct}
              pdfBusy={pdfBusy}
              onDownload={() => void downloadPdf()}
            />

            {usePlaceholders
              ? Array.from({ length: PLACEHOLDER_SLOTS }, (_, i) => (
                  <HeroPlaceholderPanel
                    key={`ph-${i}`}
                    index={i + 1}
                    widthPct={itemWidthPct}
                  />
                ))
              : items.map((panel, i) => (
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
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
            {Array.from({ length: scrollMax + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir al grupo ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1 rounded-full transition-all',
                  i === index
                    ? 'w-8 bg-white'
                    : 'w-4 bg-white/40 hover:bg-white/70',
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
              className="flex flex-1 items-center justify-center gap-2.5 px-4 py-3 text-center sm:py-3.5"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-rosver-red/15 text-rosver-red">
                <Icon size={16} color="currentColor" strokeWidth={2} />
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-white/90 sm:text-xs">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function HeroCtaPanel({
  widthPct,
  pdfBusy,
  onDownload,
}: {
  widthPct: number
  pdfBusy: boolean
  onDownload: () => void
}) {
  return (
    <div
      className="relative flex h-full shrink-0 flex-col justify-end overflow-hidden bg-rosver-ink px-5 py-8 sm:px-6 sm:py-10 lg:px-7"
      style={{ width: `${widthPct}%` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 25% 15%, rgba(227,6,19,0.48), transparent 58%), linear-gradient(160deg, #0D0D0D 0%, #1a1a1a 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-1 bg-rosver-red"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />

      <div className="relative z-[1] max-w-[15rem] sm:max-w-[16.5rem]">
        <p className="mb-2.5 text-[10px] font-bold tracking-[0.2em] text-rosver-red uppercase">
          Rosver SAC
        </p>
        <h2 className="font-display text-xl leading-[1.08] font-bold tracking-tight text-white uppercase sm:text-2xl lg:text-[1.7rem]">
          Despachos
          <br />
          <span className="text-white/90">y catálogo</span>
          <br />
          <span className="text-rosver-red">oficial</span>
        </h2>
        <p className="mt-3 text-[11px] leading-snug text-white/65 sm:text-xs">
          Precios desde unidad y envíos a todo el Perú.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
          <button
            type="button"
            disabled={pdfBusy}
            onClick={onDownload}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[11px] font-extrabold tracking-wide text-rosver-ink uppercase whitespace-nowrap transition hover:bg-rosver-soft disabled:opacity-70 sm:text-xs"
          >
            <Download size={15} color="currentColor" strokeWidth={2} />
            <span>{pdfBusy ? 'Generando…' : HOME_HERO_CTA.ctaLabel}</span>
            <ArrowRight size={15} color="currentColor" strokeWidth={2} />
          </button>
          <Link
            to="/catalogo"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/35 px-4 py-2 text-[11px] font-bold tracking-wide text-white uppercase transition hover:border-white hover:bg-white/10 sm:text-xs"
          >
            Ver catálogo
            <ArrowRight size={14} color="currentColor" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function HeroPlaceholderPanel({
  index,
  widthPct,
}: {
  index: number
  widthPct: number
}) {
  const { width, height } = HERO_PANEL_DESIGNER_SPECS.panelPx
  return (
    <div
      className="relative flex h-full shrink-0 flex-col items-center justify-center overflow-hidden border-l border-white/10 bg-[#141414]"
      style={{ width: `${widthPct}%` }}
      aria-label={`Espacio para imagen ${index} (${width}×${height})`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'linear-gradient(160deg, #1a1a1a 0%, #0D0D0D 50%, #161616 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-3 rounded-sm border border-dashed border-white/20 sm:inset-4"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-center gap-2 px-3 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/8 text-white/55 sm:size-11">
          <ImageIcon size={20} color="currentColor" strokeWidth={1.75} />
        </span>
        <p className="font-display text-[11px] font-bold tracking-wide text-white/70 uppercase sm:text-xs">
          Panel {index}
        </p>
        <p className="text-[10px] leading-tight text-white/40">
          {width}×{height}
          <br />
          WebP
        </p>
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
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-start gap-3 px-4 pb-10 sm:px-5 sm:pb-12">
        <p className="max-w-[14rem] font-display text-sm leading-tight font-bold tracking-wide text-white uppercase sm:text-base lg:text-lg">
          {panel.title}
        </p>
        <SplitPill left={panel.badgeLeft} right={panel.badgeRight} />
      </div>
    </>
  )

  const className =
    'group relative flex h-full shrink-0 flex-col justify-end overflow-hidden border-l border-white/10'

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

function SplitPill({ left, right }: { left: string; right: string }) {
  return (
    <span className="inline-flex max-w-full overflow-hidden rounded-full text-[9px] leading-[1.15] font-extrabold tracking-wide uppercase sm:text-[10px]">
      <span className="bg-rosver-red px-2.5 py-1.5 whitespace-pre-line text-white sm:px-3 sm:py-2">
        {left}
      </span>
      <span className="bg-rosver-soft px-2.5 py-1.5 whitespace-pre-line text-rosver-ink sm:px-3 sm:py-2">
        {right}
      </span>
    </span>
  )
}
