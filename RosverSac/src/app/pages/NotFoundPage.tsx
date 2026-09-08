import { Link } from 'react-router-dom'

/**
 * Catch-all para cualquier ruta que no matchea nada (typo, link roto,
 * página eliminada). Sin esto, React Router no renderiza nada — pantalla
 * en blanco total, sin header/footer/mensaje.
 */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-rosver-red">404</p>
      <h1 className="font-display text-2xl font-bold text-rosver-ink uppercase sm:text-3xl">
        Página no encontrada
      </h1>
      <p className="max-w-md text-sm text-rosver-muted">
        El enlace puede estar roto o la página ya no existe. Revisa la dirección o vuelve
        al inicio.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-rosver-red px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
        >
          Ir al inicio
        </Link>
        <Link
          to="/catalogo"
          className="rounded-full border border-rosver-line px-6 py-2.5 text-sm font-bold text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red"
        >
          Ver catálogo
        </Link>
      </div>
    </main>
  )
}
