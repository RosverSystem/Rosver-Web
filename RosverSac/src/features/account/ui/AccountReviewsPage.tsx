import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { api, ApiError } from '@/shared/lib/api'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { getGuestRatingKey } from '@/features/catalog/lib/guest-rating-key'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type UserReview = {
  productId: string
  productName: string
  productSlug: string
  rating: number
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

async function fetchMyReviews(): Promise<UserReview[]> {
  const res = await api<{ ok: boolean; reviews: UserReview[] }>(
    '/api/profile/reviews',
  )
  return res.reviews
}

async function patchReviewComment(
  slug: string,
  data: { title: string; body: string; guestKey?: string },
): Promise<void> {
  await api('/api/catalog/products/' + encodeURIComponent(slug) + '/rating', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={14}
          height={14}
          viewBox="0 0 20 20"
          fill={s <= rating ? '#F2B705' : 'none'}
          stroke={s <= rating ? '#F2B705' : '#9CA3AF'}
          strokeWidth={1.5}
          aria-hidden
        >
          <path d="M10 1l2.39 4.85 5.35.78-3.87 3.77.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.26 6.63l5.35-.78L10 1z" />
        </svg>
      ))}
    </span>
  )
}

export function AccountReviewsPage() {
  const { toasts, showSuccess, showErrors, dismiss } = useFormToasts()
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchMyReviews()
      setReviews(data)
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'No se pudieron cargar las reseñas.'
      showErrors([msg])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEdit(review: UserReview) {
    setEditingSlug(review.productSlug)
    setEditTitle(review.title ?? '')
    setEditBody(review.body ?? '')
  }

  function cancelEdit() {
    setEditingSlug(null)
    setEditTitle('')
    setEditBody('')
  }

  async function saveEdit(review: UserReview) {
    if (busy) return
    setBusy(true)
    try {
      await patchReviewComment(review.productSlug, {
        title: editTitle.trim(),
        body: editBody.trim(),
        guestKey: getGuestRatingKey(),
      })
      showSuccess(['Reseña actualizada.'])
      cancelEdit()
      await load()
    } catch (e) {
      showErrors([e instanceof ApiError ? e.message : 'Error al guardar la reseña.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <h2 className="font-display text-lg font-bold text-rosver-ink uppercase">
        Mis reseñas
      </h2>

      {loading ? (
        <p className="text-sm text-rosver-muted">Cargando reseñas…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rosver-line bg-rosver-soft py-10 text-center">
          <p className="text-sm text-rosver-muted">
            Aún no calificaste ningún producto.
          </p>
          <Link
            to="/catalogo"
            className="mt-3 inline-block text-sm font-bold text-rosver-red hover:text-rosver-red-dark"
          >
            Explorar catálogo →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => {
            const isEditing = editingSlug === review.productSlug
            return (
              <div
                key={review.productSlug}
                className="rounded-2xl border border-rosver-line bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/producto/${review.productSlug}`}
                      className="font-bold text-rosver-ink hover:text-rosver-red line-clamp-1"
                    >
                      {review.productName}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRow rating={review.rating} />
                      <span className="text-xs text-rosver-muted">
                        {new Date(review.createdAt).toLocaleDateString('es-PE', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(review)}
                      className="shrink-0 rounded-full border border-rosver-line px-3.5 py-1.5 text-xs font-bold text-rosver-muted transition hover:border-rosver-ink hover:text-rosver-ink"
                    >
                      Editar reseña
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={120}
                      placeholder="Título de la reseña (opcional)"
                      className="w-full rounded-xl border border-rosver-line bg-rosver-soft px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/20"
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Cuéntanos tu experiencia con este producto…"
                      className="w-full resize-none rounded-xl border border-rosver-line bg-rosver-soft px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted focus:border-rosver-red focus:ring-2 focus:ring-rosver-red/20"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void saveEdit(review)}
                        className="rounded-full bg-rosver-red px-5 py-2 text-xs font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-50"
                      >
                        {busy ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={cancelEdit}
                        className="rounded-full border border-rosver-line px-5 py-2 text-xs font-bold text-rosver-muted transition hover:text-rosver-ink disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (review.title || review.body) ? (
                  <div className="mt-3 rounded-xl bg-rosver-soft/60 p-3">
                    {review.title ? (
                      <p className="text-sm font-semibold text-rosver-ink">
                        {review.title}
                      </p>
                    ) : null}
                    {review.body ? (
                      <p className="mt-1 text-sm leading-relaxed text-rosver-muted">
                        {review.body}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-rosver-muted">
                    Sin comentario aún.{' '}
                    <button
                      type="button"
                      onClick={() => startEdit(review)}
                      className="font-semibold text-rosver-blue hover:text-rosver-red"
                    >
                      Agregar reseña
                    </button>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
