import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import {
  AdminEmptyState,
  AdminPageHeader,
} from '@/shared/ui/admin-field'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type OfferProduct = {
  id: string
  slug: string
  name: string
  sku: string
  vendor: string
  price: number | null
  originalPrice?: number
  offerPrice?: number
  imageUrl?: string
}

export function AdminOffersPage() {
  const { toasts, showMessages, dismiss } = useFormToasts()
  const [products, setProducts] = useState<OfferProduct[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await api<{ products: OfferProduct[] }>('/api/admin/offers')
      setProducts(data.products)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar las ofertas',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <AdminPageHeader
        title="Ofertas"
        actions={
          <Link
            to="/admin/productos"
            className="rounded-full border border-rosver-line bg-white px-3 py-1.5 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
          >
            Gestionar en productos
          </Link>
        }
      />

      <p className="text-sm text-rosver-muted">
        Aquí aparecen productos con precio «en oferta» o con precio anterior
        (compare) en la lista. Los creas desde el producto → precios.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState title="Cargando…" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-rosver-line bg-white">
            <AdminEmptyState
              title="Todavía no hay ofertas"
              detail="En un producto, agrega un precio de tipo «en oferta» o un precio lista con precio anterior."
            />
          </div>
        ) : (
          products.map((p) => {
            const disc =
              p.price != null && p.originalPrice && p.originalPrice > p.price
                ? Math.round(100 - (p.price / p.originalPrice) * 100)
                : null
            return (
              <article
                key={p.id}
                className="flex gap-3 rounded-2xl border border-rosver-line bg-white p-4 shadow-sm"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-xl bg-rosver-soft text-xs font-bold text-rosver-muted">
                    {p.sku.slice(0, 3)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-rosver-ink">{p.name}</p>
                  <p className="text-xs text-rosver-muted">
                    {p.vendor} · {p.sku}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    {p.originalPrice ? (
                      <span className="text-xs text-rosver-muted line-through">
                        S/ {p.originalPrice.toFixed(2)}
                      </span>
                    ) : null}
                    <span className="font-bold text-rosver-red">
                      {p.price != null ? `S/ ${p.price.toFixed(2)}` : 'Consultar'}
                    </span>
                    {disc ? (
                      <span className="rounded bg-rosver-yellow px-1.5 py-0.5 text-[10px] font-black text-rosver-ink">
                        −{disc}%
                      </span>
                    ) : null}
                  </div>
                  <Link
                    to="/admin/productos"
                    className="mt-2 inline-block text-xs font-semibold text-rosver-red hover:underline"
                  >
                    Abrir en listado
                  </Link>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
