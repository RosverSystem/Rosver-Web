import { api, ApiError } from '@/shared/lib/api'
import { cn, formatInternalCode } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSelect,
} from '@/shared/ui/admin-field'
import { BootstrapTable } from '@/shared/ui/bootstrap-table'
import { Pen, Search, Trash } from 'cssvg-icons'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductImportModal } from './ProductImportModal'

type ProductRow = {
  id: string
  code: number
  sku: string
  name: string
  brandName: string | null
  categoryName: string | null
  visible: boolean
  featured: boolean
  imageUrl?: string | null
}

const PAGE_SIZE = 10

function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xl transition hover:scale-[1.03] active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Listado de productos — alta/edición en ficha CRM. */
export function AdminProductsPage() {
  const navigate = useNavigate()
  const { toasts, showMessages, dismiss } = useFormToasts()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [listQuery, setListQuery] = useState('')
  const deferredQuery = useDeferredValue(listQuery)
  const [listPage, setListPage] = useState(1)
  const [visibleFilter, setVisibleFilter] = useState<'all' | 'visible' | 'hidden'>(
    'all',
  )
  const [importOpen, setImportOpen] = useState(false)

  const stats = useMemo(() => {
    const visible = products.filter((p) => p.visible).length
    const featuredCount = products.filter((p) => p.featured).length
    return {
      total: products.length,
      visible,
      hidden: products.length - visible,
      featured: featuredCount,
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return products.filter((p) => {
      if (visibleFilter === 'visible' && !p.visible) return false
      if (visibleFilter === 'hidden' && p.visible) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        formatInternalCode(p.code).includes(q) ||
        String(p.code).includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false) ||
        (p.categoryName?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [products, deferredQuery, visibleFilter])

  const listPageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safeListPage = Math.min(listPage, listPageCount)
  const pageProducts = useMemo(() => {
    const start = (safeListPage - 1) * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, safeListPage])

  useEffect(() => {
    setListPage(1)
  }, [deferredQuery, visibleFilter])

  async function loadList() {
    setLoading(true)
    try {
      const p = await api<{ products: ProductRow[] }>('/api/admin/products')
      setProducts(p.products)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudo cargar el listado',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function softDelete(id: string, productName: string) {
    if (!window.confirm(`¿Ocultar el producto «${productName}»?`)) return
    try {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' })
      await loadList()
      showMessages(['Producto ocultado'])
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo eliminar',
      ])
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void loadList()}
      />
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Productos"
        description="Alta y edición del catálogo que se muestra en la tienda."
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Visibles', value: stats.visible, tone: 'success' },
          { label: 'Ocultos', value: stats.hidden, tone: 'danger' },
          { label: 'Destacados', value: stats.featured, tone: 'warning' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white uppercase backdrop-blur-sm hover:bg-white/15"
            >
              Importar productos
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/productos/nuevo')}
              className="rounded-full bg-rosver-red px-4 py-2.5 text-xs font-bold text-white uppercase shadow-sm shadow-rosver-red/30 hover:bg-rosver-red-dark"
            >
              Nuevo producto
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-rosver-line bg-gradient-to-br from-white via-white to-rosver-soft/60 p-4 shadow-sm sm:flex-row sm:items-end sm:gap-4">
        <label className="block min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Buscar
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-rosver-red">
              <Search size={18} color="currentColor" strokeWidth={2} />
            </span>
            <input
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Nombre, SKU, código, marca o categoría…"
              className="w-full rounded-xl border border-rosver-line bg-white py-2.5 pr-3 pl-10 text-sm text-rosver-ink outline-none placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/15"
            />
          </div>
        </label>
        <label className="block w-full sm:w-48">
          <span className="mb-1.5 block text-xs font-bold tracking-wide text-rosver-muted uppercase">
            Visibilidad
          </span>
          <AdminSelect
            value={visibleFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || v === 'visible' || v === 'hidden') {
                setVisibleFilter(v)
              }
            }}
          >
            <option value="all">Todos</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultos</option>
          </AdminSelect>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        {loading ? (
          <AdminEmptyState title="Cargando…" />
        ) : filteredProducts.length === 0 ? (
          <AdminEmptyState
            title={products.length === 0 ? 'Sin productos' : 'Sin resultados'}
            detail={
              products.length === 0
                ? 'Usa «Importar productos» o «Nuevo producto».'
                : 'Prueba otro término o filtro.'
            }
          />
        ) : (
          <>
            <BootstrapTable className="min-w-[780px]" size="sm" striped hover>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Marca</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/productos/${p.id}`)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            width={44}
                            height={44}
                            className="size-11 rounded-lg object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="flex size-11 items-center justify-center rounded-lg bg-rosver-soft text-[9px] font-bold text-rosver-muted">
                            N/A
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[14rem] truncate font-semibold text-rosver-ink">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-bold text-rosver-muted">
                            Cód. {formatInternalCode(p.code)}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td>
                      <span className="rounded-md bg-rosver-red/10 px-2 py-1 text-xs font-bold text-rosver-red">
                        {p.sku}
                      </span>
                    </td>
                    <td className="text-sm text-rosver-ink">
                      {p.brandName || '—'}
                    </td>
                    <td className="text-sm text-rosver-ink">
                      {p.categoryName || '—'}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold',
                          p.visible
                            ? 'bg-rosver-success/15 text-rosver-success'
                            : 'bg-rosver-muted/15 text-rosver-muted',
                        )}
                      >
                        {p.visible ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <IconAction
                          label="Editar"
                          onClick={() => navigate(`/admin/productos/${p.id}`)}
                          className="bg-rosver-yellow text-rosver-ink shadow-sm shadow-rosver-yellow/30 hover:opacity-90"
                        >
                          <Pen size={16} color="currentColor" strokeWidth={2} />
                        </IconAction>
                        <IconAction
                          label="Ocultar"
                          onClick={() => void softDelete(p.id, p.name)}
                          className="bg-rosver-red text-white shadow-sm shadow-rosver-red/25 hover:bg-rosver-red-dark"
                        >
                          <Trash
                            size={16}
                            color="currentColor"
                            strokeWidth={2}
                          />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </BootstrapTable>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rosver-line bg-rosver-soft/60 px-4 py-3">
              <p className="text-xs font-medium text-rosver-muted">
                Mostrando {(safeListPage - 1) * PAGE_SIZE + 1}–
                {Math.min(safeListPage * PAGE_SIZE, filteredProducts.length)} de{' '}
                {filteredProducts.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeListPage <= 1}
                  onClick={() => setListPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-rosver-line bg-white px-3 py-1.5 text-xs font-bold text-rosver-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="min-w-16 rounded-lg bg-rosver-ink px-2 py-1 text-center text-xs font-bold text-white">
                  {safeListPage} / {listPageCount}
                </span>
                <button
                  type="button"
                  disabled={safeListPage >= listPageCount}
                  onClick={() =>
                    setListPage((p) => Math.min(listPageCount, p + 1))
                  }
                  className="rounded-lg border border-rosver-line bg-white px-3 py-1.5 text-xs font-bold text-rosver-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
