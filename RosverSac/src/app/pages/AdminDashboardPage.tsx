import { WireBlock } from '@/shared/ui/wireframe'
import { Link } from 'react-router-dom'

const STATS = [
  { label: 'Leads sin atender', value: 4, link: '/admin/leads' },
  { label: 'Cotizaciones en revisión', value: 2, link: '/admin/cotizaciones' },
  { label: 'Pedidos en proceso', value: 3, link: '/admin/pedidos' },
  { label: 'Productos publicados', value: 6, link: '/admin/productos' },
]

export function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        Dashboard
      </h1>

      <WireBlock label="Resumen — accesos rápidos a lo pendiente">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Link
              key={stat.label}
              to={stat.link}
              className="rounded-xl border border-rosver-line bg-white px-4 py-4 transition hover:border-rosver-red"
            >
              <p className="font-display text-2xl font-bold text-rosver-ink">
                {stat.value}
              </p>
              <p className="text-xs text-rosver-muted">{stat.label}</p>
            </Link>
          ))}
        </div>
      </WireBlock>
    </div>
  )
}
