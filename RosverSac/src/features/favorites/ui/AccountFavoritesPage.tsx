import { FavoriteButton } from './FavoriteButton'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { api, ApiError } from '@/shared/lib/api'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Heart } from 'cssvg-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export type FavoriteProductRow = {
  id: string
  slug: string
  name: string
  sku: string
  imageUrl?: string
  rating: number
  price: number | null
  favoritedAt: string
}

async function fetchFavorites(): Promise<FavoriteProductRow[]> {
  const res = await api<{ ok: boolean; products: FavoriteProductRow[] }>(
    '/api/favorites',
  )
  return res.products ?? []
}

/**
 * Vista cliente: productos marcados como favoritos.
 */
export function AccountFavoritesPage() {
  const { toasts, showErrors, dismiss } = useFormToasts()
  const [products, setProducts] = useState<FavoriteProductRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setProducts(await fetchFavorites())
    } catch (e) {
      showErrors([
        e instanceof ApiError
          ? e.message
          : 'No se pudieron cargar tus favoritos.',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <div>
        <h1 className="font-display text-2xl font-bold text-rosver-ink">
          Mis favoritos
        </h1>
        <p className="mt-1 text-sm text-rosver-muted">
          Productos que guardaste con el corazón para cotizar o comprar después.
        </p>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-rosver-muted">Cargando…</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rosver-line bg-rosver-soft/40 px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-rosver-red shadow-sm">
            <Heart size={22} color="currentColor" strokeWidth={2} />
          </span>
          <p className="mt-4 text-sm font-semibold text-rosver-ink">
            Todavía no tienes favoritos
          </p>
          <p className="mt-1 text-sm text-rosver-muted">
            En el catálogo, toca el corazón de un producto para guardarlo aquí.
          </p>
          <Link
            to="/catalogo"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-rosver-red px-5 text-sm font-bold text-white hover:bg-rosver-red-dark"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm"
            >
              <Link to={`/producto/${p.slug}`} className="block">
                <div className="aspect-[4/3] bg-rosver-soft">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      width={480}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm font-bold text-rosver-muted">
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-3.5">
                  <p className="line-clamp-2 text-sm font-bold text-rosver-ink group-hover:text-rosver-red">
                    {p.name}
                  </p>
                  <p className="text-xs text-rosver-muted">SKU: {p.sku}</p>
                  <p className="font-display text-lg font-bold text-rosver-ink">
                    {p.price != null ? `S/ ${p.price.toFixed(2)}` : 'Consultar'}
                  </p>
                </div>
              </Link>
              <div className="absolute top-2.5 right-2.5">
                <FavoriteButton
                  productId={p.id}
                  slug={p.slug}
                  size={16}
                  className="size-9"
                  quiet
                  onToggled={(favorited) => {
                    if (!favorited) {
                      setProducts((prev) => prev.filter((x) => x.id !== p.id))
                    }
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
