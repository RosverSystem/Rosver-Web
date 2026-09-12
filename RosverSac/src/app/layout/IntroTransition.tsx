import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useGSAP } from '@gsap/react'
import { useEffect, useRef, useState } from 'react'

/** Tope de seguridad: si el timeline se cuelga (pestaña en segundo plano,
 * jank, etc.) la cortina igual se retira y no bloquea clics indefinidamente. */
const MAX_DURATION_MS = 4000

/**
 * Cortina de intro tipo transición de stream: dos paneles de marca barren
 * la pantalla, el logo aparece un instante y se abren revelando la página.
 *
 * REGLA DE PRODUCTO — NO TOCAR:
 * Debe correr en **cada carga real** de la app (incluido F5 / hard refresh).
 * Prohibido sessionStorage, localStorage, “una vez por pestaña”, ni saltarla
 * por HMR/import/debug. Solo se omite con `prefers-reduced-motion`.
 * Montada fuera de `<Routes>` en `App.tsx`.
 */
export function IntroTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(prefersReducedMotion)

  useEffect(() => {
    if (done) return
    const fallback = window.setTimeout(() => {
      document.body.style.overflow = ''
      setDone(true)
    }, MAX_DURATION_MS)
    return () => window.clearTimeout(fallback)
  }, [done])

  useGSAP(
    () => {
      if (done || !backRef.current || !frontRef.current || !logoRef.current) {
        return
      }

      document.body.style.overflow = 'hidden'

      const tl = gsap.timeline({
        defaults: { ease: 'power4.inOut' },
        onComplete: () => {
          document.body.style.overflow = ''
          setDone(true)
        },
      })

      tl.set([backRef.current, frontRef.current], { xPercent: -100 })
        .set(logoRef.current, { opacity: 0, scale: 0.8 })
        .to(backRef.current, { xPercent: 0, duration: 0.55 })
        .to(frontRef.current, { xPercent: 0, duration: 0.55 }, '-=0.4')
        .to(
          logoRef.current,
          { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' },
          '-=0.15',
        )
        .to({}, { duration: 0.35 })
        .to(logoRef.current, { opacity: 0, scale: 0.85, duration: 0.25 })
        .to(frontRef.current, { xPercent: 100, duration: 0.55 }, '-=0.05')
        .to(backRef.current, { xPercent: 100, duration: 0.55 }, '-=0.4')
    },
    { scope: containerRef, dependencies: [] },
  )

  if (done) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      <div ref={backRef} className="absolute inset-0 bg-rosver-ink" />
      <div ref={frontRef} className="absolute inset-0 bg-rosver-red" />
      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="relative inline-flex items-center font-display text-4xl font-bold tracking-tight text-white italic sm:text-6xl">
          ROS
          <span className="relative ml-1">
            VER
            <span
              className="absolute -top-1 -right-3 size-2.5 rounded-[2px] bg-rosver-ink"
              aria-hidden
            />
          </span>
        </span>
      </div>
    </div>
  )
}
