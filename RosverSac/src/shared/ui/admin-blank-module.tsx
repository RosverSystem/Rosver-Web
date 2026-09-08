import { shortDisplayName, useAuth } from '@/features/auth'

/** Placeholder vacío estilo SaaS soft — módulos SystemRSV. */
export function AdminBlankModule({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const { user } = useAuth()
  const first = user ? shortDisplayName(user) : null

  return (
    <section className="flex min-h-[62vh] flex-col justify-center rounded-3xl border border-rosver-line bg-white px-6 py-16 text-center shadow-sm sm:px-10">
      <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-muted uppercase">
        SystemRSV
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-rosver-ink sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-rosver-muted">
        {description ??
          'Vista en blanco lista para el módulo. El contenido se construirá sobre este shell.'}
      </p>
      {first ? (
        <p className="mt-6 text-xs text-rosver-muted">
          Sesión: <span className="font-semibold text-rosver-ink">{first}</span>
        </p>
      ) : null}
    </section>
  )
}
