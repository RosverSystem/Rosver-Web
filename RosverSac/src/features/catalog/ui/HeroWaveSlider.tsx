import {
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
  Verified,
} from 'cssvg-icons'
import { useEffect, useState } from 'react'
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
      if (window.matchMedia('(min-width: 1280px)').matches) setVisible(6)
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
  const hasPanels = items.length > 0
  // Sin paneles de imagen: CTA a ancho completo (no una franja estrecha).
  const total = hasPanels ? 1 + items.length : 1
  const effectiveVisible = hasPanels ? visible : 1
  const scrollMax = Math.max(0, total - effectiveVisible)

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

  const trackWidthPct = (total / effectiveVisible) * 100
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
              fullBleed={!hasPanels}
              pdfBusy={pdfBusy}
              onDownload={() => void downloadPdf()}
            />

            {items.map((panel, i) => (
              <HeroImagePanel
                key={panel.id}
                panel={panel}
                eager={i < effectiveVisible}
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
  fullBleed,
  pdfBusy,
  onDownload,
}: {
  widthPct: number
  fullBleed: boolean
  pdfBusy: boolean
  onDownload: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex h-full shrink-0 flex-col justify-center overflow-hidden bg-rosver-ink',
        fullBleed
          ? 'px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-14'
          : 'justify-end px-5 py-8 sm:px-7 sm:py-10',
      )}
      style={{ width: `${widthPct}%` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: fullBleed
            ? 'radial-gradient(ellipse 80% 70% at 18% 28%, rgba(227,6,19,0.42), transparent 58%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(30,58,95,0.35), transparent 55%), linear-gradient(165deg, #0D0D0D 0%, #161616 55%, #0D0D0D 100%)'
            : 'radial-gradient(ellipse at 25% 15%, rgba(227,6,19,0.48), transparent 58%), linear-gradient(160deg, #0D0D0D 0%, #1a1a1a 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-1 bg-rosver-red sm:w-1.5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div
        className={cn(
          'relative z-[1]',
          fullBleed
            ? 'mx-auto w-full max-w-3xl sm:mx-0'
            : 'max-w-[15.5rem] sm:max-w-[17rem]',
        )}
      >
        <p className="mb-3 text-[10px] font-bold tracking-[0.22em] text-rosver-red uppercase sm:mb-4 sm:text-[11px]">
          Rosver SAC
        </p>

        <h2
          className={cn(
            'font-display font-bold tracking-tight text-white uppercase',
            fullBleed
              ? 'text-3xl leading-[1.08] sm:text-4xl md:text-5xl lg:text-[3.25rem]'
              : 'text-xl leading-[1.1] sm:text-2xl lg:text-[1.65rem]',
          )}
        >
          {fullBleed ? (
            <>
              Despachos
              <br />
              <span className="text-white/90">y catálogo</span>
              <br />
              <span className="text-rosver-red">oficial</span>
            </>
          ) : (
            HOME_HERO_CTA.title
          )}
        </h2>

        {fullBleed ? (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:mt-5 sm:text-base">
            Precios desde unidad, envíos a todo el Perú y el listado completo
            listo para cotizar.
          </p>
        ) : null}

        <div
          className={cn(
            'flex flex-wrap items-center gap-3',
            fullBleed ? 'mt-7 sm:mt-8' : 'mt-5 sm:mt-6',
          )}
        >
          <button
            type="button"
            disabled={pdfBusy}
            onClick={onDownload}
            className={cn(
              'inline-flex items-center justify-center gap-2.5 rounded-full bg-white font-extrabold tracking-wide text-rosver-ink uppercase whitespace-nowrap transition',
              'hover:bg-rosver-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'disabled:opacity-70',
              fullBleed
                ? 'min-h-12 px-6 py-3 text-sm sm:px-7 sm:text-[0.95rem]'
                : 'min-h-11 px-4 py-2.5 text-[11px] sm:px-5 sm:text-xs',
            )}
          >
            <Download
              size={fullBleed ? 18 : 15}
              color="currentColor"
              strokeWidth={2}
            />
            <span>{pdfBusy ? 'Generando…' : HOME_HERO_CTA.ctaLabel}</span>
            <ArrowRight
              size={fullBleed ? 18 : 15}
              color="currentColor"
              strokeWidth={2}
            />
          </button>

          {fullBleed ? (
            <Link
              to="/catalogo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/35 px-5 py-3 text-sm font-bold tracking-wide text-white uppercase transition hover:border-white hover:bg-white/10 sm:px-6"
            >
              Ver catálogo
              <ArrowRight size={16} color="currentColor" strokeWidth={2} />
            </Link>
          ) : null}
        </div>
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
