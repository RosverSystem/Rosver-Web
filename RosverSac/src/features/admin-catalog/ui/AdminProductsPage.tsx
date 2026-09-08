import { AdminBlankModule } from '@/shared/ui/admin-blank-module'

/** Productos → Listado (vacío). */
export function AdminProductsPage() {
  return (
    <AdminBlankModule
      title="Listado de productos"
      description="CRUD de catálogo (SKU, precios, visibilidad). Por ahora vacío."
    />
  )
}
