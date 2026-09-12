import { api } from '@/shared/lib/api'

export type ProductRatingState = {
  ok: boolean
  myRating: number | null
  myTitle?: string
  myBody?: string
  rating: number
  reviewCount: number
  canRate: boolean
}

export async function fetchMyProductRating(
  slug: string,
  guestKey: string,
): Promise<ProductRatingState> {
  const q = guestKey
    ? `?guestKey=${encodeURIComponent(guestKey)}`
    : ''
  return api<ProductRatingState>(`/api/catalog/products/${encodeURIComponent(slug)}/rating${q}`)
}

export async function submitProductRatingApi(
  slug: string,
  rating: number,
  guestKey: string,
  comment?: { title?: string; body?: string },
): Promise<ProductRatingState> {
  return api<ProductRatingState>(
    `/api/catalog/products/${encodeURIComponent(slug)}/rating`,
    {
      method: 'POST',
      body: JSON.stringify({
        rating,
        guestKey: guestKey || undefined,
        title: comment?.title,
        body: comment?.body,
      }),
    },
  )
}

export async function updateProductRatingCommentApi(
  slug: string,
  guestKey: string,
  comment: { title?: string; body?: string },
): Promise<{ ok: boolean }> {
  return api(`/api/catalog/products/${encodeURIComponent(slug)}/rating`, {
    method: 'PATCH',
    body: JSON.stringify({
      guestKey: guestKey || undefined,
      title: comment.title,
      body: comment.body,
    }),
  })
}

export type RankingResponse = {
  ok: boolean
  products: import('@/features/catalog/model/mocks').Product[]
  count: number
}

export async function fetchRankingProducts(
  limit = 24,
): Promise<RankingResponse> {
  return api<RankingResponse>(
    `/api/catalog/ranking?limit=${Math.min(60, Math.max(1, limit))}`,
  )
}
