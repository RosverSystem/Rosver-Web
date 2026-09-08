import { useAuth } from '@/features/auth'

/** ERP SystemRSV — panel inicial en blanco (placeholder). */
export function AdminDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rosver-line bg-white px-6 py-16 text-center">
      <p className="text-[11px] font-bold tracking-[0.2em] text-rosver-muted uppercase">
        SystemRSV
      </p>
      <h1 className="font-display text-2xl font-bold text-rosver-ink sm:text-3xl">
        Panel administrativo
      </h1>
      <p className="max-w-md text-sm text-rosver-muted">
        Vista en blanco lista para el ERP. Sesión:{' '}
        <span className="font-semibold text-rosver-ink">{user?.email}</span>
      </p>
    </div>
  )
}
