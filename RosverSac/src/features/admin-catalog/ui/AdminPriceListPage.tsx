import { AdminPageHeader } from '@/shared/ui/admin-field'
import { AdminUnitQtyCascade } from './AdminUnitQtyCascade'

/**
 * Presentaciones — tipos de unidad y cantidades (cascada).
 * Los precios por producto se gestionan en Productos.
 */
export function AdminPriceListPage() {
  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Presentaciones"
        description="Tipos de unidad y cantidades por presentación."
      />
      <AdminUnitQtyCascade />
    </div>
  )
}
