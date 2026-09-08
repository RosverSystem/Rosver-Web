import { shortDisplayName, useAuth } from '@/features/auth'
import { Link } from 'react-router-dom'

/** ERP SystemRSV — dashboard vacío listo para widgets bento. */
export function AdminDashboardPage() {
  const { user } = useAuth()
  const first = user ? shortDisplayName(user) : 'Admin'

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-muted uppercase">
          SystemRSV
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-rosver-ink sm:text-3xl">
          Bienvenido, {first}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-rosver-muted">
          Panel de gestión del ecommerce Rosver. Los widgets (pedidos, stock,
          cotizaciones) se conectarán aquí. Empieza por el módulo Productos.
        </p>
        <Link
          to="/admin/productos"
          className="mt-5 inline-flex rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark"
        >
          Ir a Productos
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {['Pedidos hoy', 'Cotizaciones abiertas', 'Productos visibles'].map(
          (label) => (
            <div
              key={label}
              className="rounded-3xl border border-dashed border-rosver-line bg-white/70 p-5 shadow-sm"
            >
              <p className="text-xs font-bold tracking-wide text-rosver-muted uppercase">
                {label}
              </p>
              <p className="mt-3 font-display text-3xl font-bold text-rosver-ink/20">
                —
              </p>
              <p className="mt-1 text-xs text-rosver-muted">Próximamente</p>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
