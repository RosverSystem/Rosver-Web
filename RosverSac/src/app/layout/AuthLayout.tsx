import { Link } from 'react-router-dom'

/**
 * Shell auth a pantalla completa (sin navbar/footer marketplace).
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh max-w-[100vw] overflow-x-hidden bg-rosver-soft">
      <Link
        to="/"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-rosver-ink shadow-sm backdrop-blur transition hover:bg-white sm:top-5 sm:left-5"
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
