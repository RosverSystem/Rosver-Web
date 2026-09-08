import { AdminEmptyState, AdminPageHeader } from '@/shared/ui/admin-field'

export function AdminOffersPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Ofertas" />
      <div className="rounded-2xl border border-rosver-line bg-white shadow-sm">
        <AdminEmptyState
          title="Próximamente"
          detail="Aquí podrás marcar productos en promoción y precios especiales."
        />
      </div>
    </div>
  )
}
