import {
  HOME_HERO_SLIDES,
  type HomeHeroSlide,
} from '@/features/catalog/model/home-hero-slides'
import { api } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { ArrowRight } from 'cssvg-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTOPLAY_MS = 6500

function mapCmsSlides(raw: unknown): HomeHeroSlide[] | null {
  if (!raw || typeof raw !== 'object') return null
  const slides = (raw as { slides?: unknown }).slides
  if (!Array.isArray(slides) || slides.length === 0) return null
  return slides.map((s, i) => {
    const row = s as Record<string, unknown>
    return {
      id: String(row.id ?? `cms-${i}`),
      eyebrow: row.tag ? String(row.tag) : row.eyebrow ? String(row.eyebrow) : undefined,
      title: String(row.title ?? ''),
      titleAccent: row.titleAccent ? String(row.titleAccent) : undefined,
      subtitle: String(row.subtitle ?? ''),
      ctaLabel: String(row.cta ?? row.ctaLabel ?? 'Ver catálogo'),
      ctaTo: String(row.ctaLink ?? row.ctaTo ?? '/catalogo'),
      imageUrl: String(row.imageUrl ?? HOME_HERO_SLIDES[i % HOME_HERO_SLIDES.length]?.imageUrl ?? ''),
      visible: true,
      sortOrder: i + 1,
    }
  })
}

/**
 * Hero full-bleed estilo referencia grocery: fondo marca, texto izq.,
 * producto a la derecha sin caja, ola blanca abajo (transición a marcas).
 */
export function HeroWaveSlider() {
  const [slides, setSlides] = useState<HomeHeroSlide[]>(() =>
    HOME_HERO_SLIDES.filter((s) => s.visible !== false)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  )
  const [index, setIndex] = useState(0)
  const reduceMotion = prefersReducedMotion()

  useEffect(() => {
    let cancelled = false
    void api<{ value: unknown }>('/api/content/home_hero')
      .then((res) => {
        if (cancelled) return
        const mapped = mapCmsSlides(res.value)
        if (mapped?.length) {
          setSlides(mapped)
          setIndex(0)
        }
      })
      .catch(() => {
        /* fallback: constantes locales */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [reduceMotion, slides.length])

  if (!slides.length) return null

  const slide = slides[index]

  return (
    <section className="relative isolate overflow-hidden bg-rosver-red text-white">
      {/* Decoración suave (hojas → círculos de marca) */}
      <div
        className="pointer-events-none absolute -top-16 -left-10 size-48 rounded-full bg-white/10 blur-2xl sm:size-64"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 right-[35%] size-32 rounded-full bg-white/5 blur-xl max-lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-8 bottom-28 size-24 rounded-full border border-white/15 max-md:hidden"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-4 pt-10 pb-20 sm:gap-6 sm:pt-12 sm:pb-24 lg:grid-cols-2 lg:gap-8 lg:px-6 lg:pt-14 lg:pb-28">
        <div
          key={`${slide.id}-copy`}
          className="relative z-[2] max-w-xl"
          style={
            reduceMotion ? undefined : { animation: 'fade-in 0.45s ease-out' }
          }
        >
          {slide.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.18em] text-white/75 uppercase">
              {slide.eyebrow}
            </p>
          ) : null}

          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {slide.title}{' '}
            {slide.titleAccent ? (
              <span className="text-white underline decoration-white/40 decoration-4 underline-offset-6">
                {slide.titleAccent}
              </span>
            ) : null}
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            {slide.subtitle}
          </p>

          <Link
            to={slide.ctaTo}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-rosver-red shadow-sm transition hover:bg-rosver-soft"
          >
            {slide.ctaLabel}
            <ArrowRight size={18} color="currentColor" strokeWidth={2} />
          </Link>

          {slides.length > 1 ? (
            <div className="mt-8 flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Ir al slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/40',
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Imagen por encima de la ola (como la referencia grocery) */}
        <div className="relative z-[4] mx-auto flex w-full max-w-md justify-center lg:max-w-none lg:justify-end">
          <HeroProductArt
            key={slide.id}
            slide={slide}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>

      {/* Ola blanca → sección marcas */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] leading-[0]"
        aria-hidden
      >
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-14 w-full sm:h-20 lg:h-24"
        >
          <path
            fill="#ffffff"
            d="M0,72 C180,110 360,20 540,48 C720,76 900,110 1080,70 C1260,30 1350,40 1440,56 L1440,120 L0,120 Z"
          />
        </svg>
      </div>
    </section>
  )
}

function HeroProductArt({
  slide,
  reduceMotion,
}: {
  slide: HomeHeroSlide
  reduceMotion: boolean
}) {
  return (
    <div
      className="relative aspect-square w-full max-w-[380px] translate-y-4 sm:max-w-[440px] sm:translate-y-6 lg:max-w-[520px] lg:translate-y-10"
      style={
        reduceMotion ? undefined : { animation: 'fade-in 0.45s ease-out' }
      }
    >
      <div
        className="absolute inset-[12%] rounded-full bg-white/12 blur-lg"
        aria-hidden
      />
      <img
        src={slide.imageUrl}
        alt=""
        width={900}
        height={900}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="relative z-[1] size-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.28)]"
      />
    </div>
  )
}
