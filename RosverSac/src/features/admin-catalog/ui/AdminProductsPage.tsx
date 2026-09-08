import { CATEGORIES, PRODUCTS } from '@/features/catalog'
import { Badge } from '@/shared/ui/badge'
import { WireBlock } from '@/shared/ui/wireframe'
import { Link } from 'react-router-dom'

export function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
          Productos
        </h1>
        <Link
          to="/admin/productos/nuevo"
          className="rounded-full bg-rosver-red px-4 py-2 text-sm font-bold text-white"
        >
          + Nuevo producto
        </Link>
      </div>

      <WireBlock label="Listado — buscar / filtrar / estado visible">
        <input
          type="search"
          placeholder="Buscar por nombre o SKU..."
          className="mb-3 w-full max-w-sm rounded-lg border border-rosver-line px-3 py-2 text-sm outline-none focus:border-rosver-red/50"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-rosver-line text-xs text-rosver-muted uppercase">
                <th className="pb-2 font-semibold">Producto</th>
                <th className="pb-2 font-semibold">Categoría</th>
                <th className="pb-2 font-semibold">Precio</th>
                <th className="pb-2 font-semibold">Visible</th>
                <th className="pb-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-rosver-line">
              {PRODUCTS.map((product) => (
                <tr key={product.slug}>
                  <td className="py-2.5">
                    <p className="font-semibold text-rosver-ink">
                      {product.name}
                    </p>
                    <p className="text-xs text-rosver-muted">
                      SKU {product.sku}
                    </p>
                  </td>
                  <td className="py-2.5 text-rosver-muted">
                    {CATEGORIES.find((c) => c.slug === product.category)
                      ?.name ?? product.category}
                  </td>
                  <td className="py-2.5">
                    {product.price !== null
                      ? `S/ ${product.price.toFixed(2)}`
                      : 'Consultar'}
                  </td>
                  <td className="py-2.5">
                    <Badge tone="success">visible</Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      to={`/admin/productos/${product.slug}`}
                      className="text-xs font-semibold text-rosver-red"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WireBlock>
    </div>
  )
}
