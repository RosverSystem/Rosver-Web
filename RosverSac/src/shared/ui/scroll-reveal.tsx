import { gsap, prefersReducedMotion } from '@/shared/lib/gsap'
import { useGSAP } from '@gsap/react'
import { useRef, type ReactNode } from 'react'

/**
 * Revela su contenido al entrar en viewport (GSAP + ScrollTrigger).
 * Respeta prefers-reduced-motion: si el usuario lo pide, no anima nada.
 */
export function ScrollReveal({
  children,
  className,
  y = 28,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  y?: number
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return

      gsap.from(ref.current, {
        opacity: 0,
        y,
        duration: 0.7,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
