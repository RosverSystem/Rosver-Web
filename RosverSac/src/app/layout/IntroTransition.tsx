import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useGSAP } from '@gsap/react'
import { useRef, useState } from 'react'

/**
 * Cortina de intro tipo transición de stream: dos paneles de marca barren
 * la pantalla, el logo aparece un instante y se abren revelando la página.
 * Corre una vez por carga real de la app (montada fuera de <Routes>).
 */
export function IntroTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(prefersReducedMotion)

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
