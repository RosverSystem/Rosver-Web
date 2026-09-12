import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { OfferComboKind } from '@/features/catalog/model/offer-combo'
import type {
  CartComboNestedItem,
  CartComboSnapshot,
  CartLine,
} from './mocks'
import { isComboLine } from './mocks'

const STORAGE_KEY = 'rosver.cart.v1'

export type AddCartItemInput = {
  lineKind?: 'product' | 'combo'
  productSlug: string
  quantity?: number
  packagingId?: string
  packagingLabel?: string
  unitPrice?: number | null
  comboId?: string
  comboName?: string
  comboSku?: string
  comboImageUrl?: string
  comboKind?: OfferComboKind
  comboItems?: CartComboNestedItem[]
  comboSnapshot?: CartComboSnapshot
  maxPerUser?: number | null
}

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  ready: boolean
  addItem: (input: string | AddCartItemInput, quantity?: number) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  removeLine: (lineKey: string) => void
  replaceAll: (next: CartLine[]) => void
  /** Quita líneas de producto cuyo slug no está; combos por id opcional. */
  syncWithCatalog: (
    availableSlugs: string[],
    availableComboIds?: string[],
  ) => void
  clear: () => void
  lineKey: (line: CartLine) => string
}

const CartContext = createContext<CartContextValue | null>(null)

export function makeLineKey(
  line: Pick<CartLine, 'lineKind' | 'productSlug' | 'packagingId' | 'comboId'>,
) {
  if (line.lineKind === 'combo' && line.comboId) {
    return `combo::${line.comboId}`
  }
  return line.packagingId
    ? `${line.productSlug}::${line.packagingId}`
    : line.productSlug
}

function normalizeLine(row: CartLine): CartLine {
  const qty = Math.max(1, Math.floor(row.quantity) || 1)
  if (row.lineKind === 'combo' && row.comboId) {
    return {
      lineKind: 'combo',
      productSlug: row.productSlug,
      quantity: qty,
      unitPrice: row.unitPrice,
      comboId: row.comboId,
      comboName: row.comboName,
      comboSku: row.comboSku,
      comboImageUrl: row.comboImageUrl,
      comboKind: row.comboKind,
      comboItems: row.comboItems,
      comboSnapshot: row.comboSnapshot,
      maxPerUser: row.maxPerUser,
    }
  }
  return {
    lineKind: 'product',
    productSlug: row.productSlug,
    quantity: qty,
    packagingId: row.packagingId,
    packagingLabel: row.packagingLabel,
    unitPrice: row.unitPrice,
  }
}

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((row): row is CartLine => {
        if (!row || typeof row !== 'object') return false
        const r = row as CartLine
        if (typeof r.quantity !== 'number') return false
        if (r.lineKind === 'combo') return Boolean(r.comboId)
        return typeof r.productSlug === 'string'
      })
      .map(normalizeLine)
  } catch {
    return []
  }
}

function writeStored(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    /* quota / private mode */
  }
}

/**
 * Carrito B2B: líneas por producto + presentación o combo, persistidas en localStorage.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLines(readStored())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    writeStored(lines)
  }, [lines, ready])

  const addItem = useCallback((input: string | AddCartItemInput, quantity = 1) => {
    const payload: AddCartItemInput =
      typeof input === 'string'
        ? { lineKind: 'product', productSlug: input, quantity }
        : { ...input, quantity: input.quantity ?? quantity }

    const qty = Math.max(1, Math.floor(payload.quantity ?? 1) || 1)
    const lineKind = payload.lineKind === 'combo' ? 'combo' : 'product'

    setLines((prev) => {
      const key = makeLineKey({
        lineKind,
        productSlug: payload.productSlug,
        packagingId: payload.packagingId,
        comboId: payload.comboId,
      })
      const existing = prev.find((l) => makeLineKey(l) === key)
      if (lineKind === 'combo' && payload.comboId) {
        const max =
          payload.maxPerUser != null && payload.maxPerUser >= 1
            ? Math.floor(payload.maxPerUser)
            : null
        const existingQty = existing?.quantity ?? 0
        if (max != null && existingQty + qty > max) {
          const allowed = Math.max(0, max - existingQty)
          if (allowed < 1) {
            return prev
          }
          // Cap at max when merging
          return prev.map((l) =>
            makeLineKey(l) === key
              ? {
                  ...l,
                  quantity: max,
                  packagingLabel: payload.packagingLabel ?? l.packagingLabel,
                  unitPrice:
                    payload.unitPrice !== undefined
                      ? payload.unitPrice
                      : l.unitPrice,
                  comboName: payload.comboName ?? l.comboName,
                  comboItems: payload.comboItems ?? l.comboItems,
                  comboSnapshot: payload.comboSnapshot ?? l.comboSnapshot,
                  maxPerUser: max,
                }
              : l,
          )
        }
      }

      if (existing) {
        return prev.map((l) =>
          makeLineKey(l) === key
            ? {
                ...l,
                quantity: l.quantity + qty,
                packagingLabel: payload.packagingLabel ?? l.packagingLabel,
                unitPrice:
                  payload.unitPrice !== undefined
                    ? payload.unitPrice
                    : l.unitPrice,
                comboName: payload.comboName ?? l.comboName,
                comboItems: payload.comboItems ?? l.comboItems,
                comboSnapshot: payload.comboSnapshot ?? l.comboSnapshot,
                maxPerUser:
                  payload.maxPerUser !== undefined
                    ? payload.maxPerUser
                    : l.maxPerUser,
              }
            : l,
        )
      }

      if (lineKind === 'combo' && payload.comboId) {
        const max =
          payload.maxPerUser != null && payload.maxPerUser >= 1
            ? Math.floor(payload.maxPerUser)
            : null
        const capped = max != null ? Math.min(qty, max) : qty
        return [
          ...prev,
          normalizeLine({
            lineKind: 'combo',
            productSlug: payload.productSlug,
            quantity: capped,
            unitPrice: payload.unitPrice,
            comboId: payload.comboId,
            comboName: payload.comboName,
            comboSku: payload.comboSku,
            comboImageUrl: payload.comboImageUrl,
            comboKind: payload.comboKind,
            comboItems: payload.comboItems,
            comboSnapshot: payload.comboSnapshot,
            maxPerUser: max,
          }),
        ]
      }

      return [
        ...prev,
        normalizeLine({
          lineKind: 'product',
          productSlug: payload.productSlug,
          quantity: qty,
          packagingId: payload.packagingId,
          packagingLabel: payload.packagingLabel,
          unitPrice: payload.unitPrice,
        }),
      ]
    })
  }, [])

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    let next = Math.floor(quantity)
    setLines((prev) => {
      if (next < 1) {
        return prev.filter((l) => makeLineKey(l) !== lineKey)
      }
      return prev.map((l) => {
        if (makeLineKey(l) !== lineKey) return l
        const max =
          isComboLine(l) && l.maxPerUser != null && l.maxPerUser >= 1
            ? l.maxPerUser
            : null
        const qty = max != null ? Math.min(next, max) : next
        return { ...l, quantity: qty }
      })
    })
  }, [])

  const removeLine = useCallback((lineKey: string) => {
    setLines((prev) => prev.filter((l) => makeLineKey(l) !== lineKey))
  }, [])

  const replaceAll = useCallback((next: CartLine[]) => {
    setLines(next.map(normalizeLine))
  }, [])

  const syncWithCatalog = useCallback(
    (availableSlugs: string[], availableComboIds?: string[]) => {
      const slugSet = new Set(availableSlugs)
      const comboSet =
        availableComboIds != null ? new Set(availableComboIds) : null
      setLines((prev) => {
        const next = prev.filter((l) => {
          if (isComboLine(l)) {
            if (comboSet == null) return true
            return Boolean(l.comboId && comboSet.has(l.comboId))
          }
          return slugSet.has(l.productSlug)
        })
        return next.length === prev.length ? prev : next
      })
    },
    [],
  )

  const clear = useCallback(() => {
    setLines([])
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
    return {
      lines,
      itemCount,
      ready,
      addItem,
      updateQuantity,
      removeLine,
      replaceAll,
      syncWithCatalog,
      clear,
      lineKey: makeLineKey,
    }
  }, [
    lines,
    ready,
    addItem,
    updateQuantity,
    removeLine,
    replaceAll,
    syncWithCatalog,
    clear,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return ctx
}
