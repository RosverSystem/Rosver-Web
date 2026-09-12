/**
 * Hook para cargar promos BOGO del catálogo (solo display).
 * El servidor valida precios en pedido/cotización.
 */
import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { PublicPromo } from '@/shared/lib/promo-utils'

type PromosState = {
  items: PublicPromo[]
  loading: boolean
}

let _cachedPromos: PublicPromo[] | null = null
let _cacheTs = 0
const CACHE_TTL = 60_000

export function useCartPromos(): PromosState {
  const [state, setState] = useState<PromosState>({
    items: _cachedPromos ?? [],
    loading: _cachedPromos === null,
  })

  useEffect(() => {
    if (_cachedPromos !== null && Date.now() - _cacheTs < CACHE_TTL) {
      setState({ items: _cachedPromos, loading: false })
      return
    }

    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    void api<{ items?: PublicPromo[]; promos?: PublicPromo[] }>(
      '/api/catalog/promos',
    )
      .then((res) => {
        if (cancelled) return
        const items = res.items ?? res.promos ?? []
        _cachedPromos = items
        _cacheTs = Date.now()
        setState({ items, loading: false })
      })
      .catch(() => {
        if (!cancelled) setState({ items: _cachedPromos ?? [], loading: false })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export function promosBySlug(
  promos: PublicPromo[],
): Map<string, PublicPromo> {
  return new Map(promos.map((p) => [p.productSlug, p]))
}
