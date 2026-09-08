import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

type PriceRow = {
  productId: string
  productName: string
  sku: string
  brandName: string | null
  packagingLabel: string
  priceKind: string
  amount: number
  compareAtAmount: number | null
  minQty: number
  isActive: boolean
}

const KIND_LABEL: Record<string, string> = {
  list: 'Venta',
  wholesale: 'Mayorista',
  offer: 'Oferta',
  custom: 'Otro',
}

/**
 * Listado de precios (tarifas por presentación).
 * Alta/edición de productos → /admin/productos.
 */
export function AdminPriceListPage() {
  const { toasts, showMessages, dismiss } = useFormToasts()
  const [rows, setRows] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await api<{
        products: {
          id: string
          name: string
          sku: string
          brandName: string | null
        }[]
      }>('/api/admin/products')

      const details = await Promise.all(
        data.products.slice(0, 200).map(async (p) => {
          try {
            const d = await api<{
              packagings: {
                id: string
                label: string | null
                unitName: string
                contentQty: number
              }[]
              prices: {
                packagingId: string
                priceKind: string
                amount: number
                compareAtAmount: number | null
                minQty: number
                isActive: boolean
              }[]
            }>(`/api/admin/products/${p.id}`)
            return { product: p, ...d }
          } catch {
            return null
          }
        }),
      )

      const next: PriceRow[] = []
      for (const item of details) {
        if (!item) continue
        const packById = new Map(
          item.packagings.map((pk) => [
            pk.id,
            pk.label?.trim() ||
              (pk.contentQty === 1
                ? pk.unitName
                : `${pk.unitName} × ${pk.contentQty}`),
          ]),
        )
        for (const pr of item.prices.filter((x) => x.isActive)) {
          next.push({
            productId: item.product.id,
            productName: item.product.name,
            sku: item.product.sku,
            brandName: item.product.brandName,
            packagingLabel: packById.get(pr.packagingId) ?? 'Presentación',
            priceKind: pr.priceKind,
            amount: pr.amount,
            compareAtAmount: pr.compareAtAmount,
            minQty: pr.minQty,
            isActive: pr.isActive,
          })
        }
      }
      setRows(next)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo cargar el listado',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.brandName?.toLowerCase().includes(q) ?? false) ||
        r.packagingLabel.toLowerCase().includes(q),
    )
  }, [rows, query])

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Listado de precios"
        actions={
          <Link
            to="/admin/productos"
            className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
          >
            Ir a productos
          </Link>
        }
      />

      <AdminInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por producto, SKU, marca…"
        className="max-w-md"
      />

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando precios…" />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="Sin precios publicados"
            detail="Crea productos y agrega precios en Productos → presentaciones."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-rosver-line bg-rosver-soft/60 text-xs font-bold tracking-wide text-rosver-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Presentación</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Desde</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rosver-line">
                {filtered.map((r, i) => (
                  <tr key={`${r.productId}-${r.priceKind}-${r.packagingLabel}-${i}`}>
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/productos"
                        className="font-semibold text-rosver-ink hover:text-rosver-red"
                      >
                        {r.productName}
                      </Link>
                      <p className="text-xs text-rosver-muted">
                        {r.sku}
                        {r.brandName ? ` · ${r.brandName}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-rosver-ink">{r.packagingLabel}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rosver-soft px-2 py-0.5 text-[11px] font-bold text-rosver-ink">
                        {KIND_LABEL[r.priceKind] ?? r.priceKind}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-rosver-muted">{r.minQty}</td>
                    <td className="px-4 py-3 text-right">
                      {r.compareAtAmount != null && r.compareAtAmount > r.amount ? (
                        <span className="mr-2 text-xs text-rosver-muted line-through">
                          S/ {r.compareAtAmount.toFixed(2)}
                        </span>
                      ) : null}
                      <span className="font-bold text-rosver-red">
                        S/ {r.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
