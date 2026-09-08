import { gsap, ScrollTrigger, prefersReducedMotion } from '@/shared/lib/gsap'
import { routeShellKey } from '@/shared/ui/page-transition'
import Lenis from 'lenis'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll suave sincronizado con GSAP.
 * Solo resetea al tope al cambiar de sección (no en tabs de /cuenta).
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)
  const { pathname } = useLocation()
  const shellKey = routeShellKey(pathname)

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    if (prefersReducedMotion() || isAdmin) return

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
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) return
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [shellKey, isAdmin])

  return null
}
