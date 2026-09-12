import { Link } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * Shell auth a pantalla completa (sin navbar/footer marketplace).
 * Bloquea el scroll del documento; el formulario puede scroll interno sin barra.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('auth-lock-scroll')
    return () => {
      root.classList.remove('auth-lock-scroll')
    }
  }, [])

  return (
    <div className="relative h-dvh max-h-dvh max-w-[100vw] overflow-hidden bg-rosver-soft">
      <Link
        to="/"
        className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-bold text-rosver-ink shadow-sm backdrop-blur transition hover:bg-white sm:top-5 sm:left-5 sm:px-3 sm:py-2"
      >
        <span className="font-display text-sm tracking-tight">
          ROS<span className="text-rosver-red">VER</span>
        </span>
        <span className="text-rosver-muted">· Inicio</span>
      </Link>
      {children}
    </div>
  )
}
