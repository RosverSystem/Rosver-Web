import { gsap, ScrollTrigger, prefersReducedMotion } from '@/shared/lib/gsap'
import Lenis from 'lenis'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll suave (inercia) sincronizado con el ticker de GSAP para que
 * ScrollTrigger (reveals, contadores) siga leyendo
 * la posición real de scroll. Se desactiva por completo si el usuario
 * pide prefers-reduced-motion.
 *
 * También resetea el scroll al tope en cada cambio de ruta: al navegar por
 * SPA no hay recarga de documento, así que sin esto la página nueva se
 * queda en el scroll donde estabas (ej. link del footer).
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    lenisRef.current = lenis
    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}
