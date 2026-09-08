import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartLine } from './mocks'

const STORAGE_KEY = 'rosver.cart.v1'

export type AddCartItemInput = {
  productSlug: string
  quantity?: number
  packagingId?: string
  packagingLabel?: string
  unitPrice?: number | null
}

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  ready: boolean
  addItem: (input: string | AddCartItemInput, quantity?: number) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  removeLine: (lineKey: string) => void
  replaceAll: (next: CartLine[]) => void
  /** Quita líneas cuyo producto ya no está en el catálogo. */
  syncWithCatalog: (availableSlugs: string[]) => void
  clear: () => void
  lineKey: (line: CartLine) => string
}

const CartContext = createContext<CartContextValue | null>(null)

export function makeLineKey(line: Pick<CartLine, 'productSlug' | 'packagingId'>) {
  return line.packagingId
    ? `${line.productSlug}::${line.packagingId}`
    : line.productSlug
}

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (row): row is CartLine =>
          Boolean(row) &&
          typeof row === 'object' &&
          typeof (row as CartLine).productSlug === 'string' &&
          typeof (row as CartLine).quantity === 'number',
      )
      .map((row) => ({
        productSlug: row.productSlug,
        quantity: Math.max(1, Math.floor(row.quantity) || 1),
        packagingId: row.packagingId,
        packagingLabel: row.packagingLabel,
        unitPrice: row.unitPrice,
      }))
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
 * Carrito B2B: líneas por producto + presentación, persistidas en localStorage.
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
        ? { productSlug: input, quantity }
        : { ...input, quantity: input.quantity ?? quantity }

    const qty = Math.max(1, Math.floor(payload.quantity ?? 1) || 1)
    setLines((prev) => {
      const key = makeLineKey({
        productSlug: payload.productSlug,
        packagingId: payload.packagingId,
      })
      const existing = prev.find((l) => makeLineKey(l) === key)
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
              }
            : l,
        )
      }
      return [
        ...prev,
        {
          productSlug: payload.productSlug,
          quantity: qty,
          packagingId: payload.packagingId,
          packagingLabel: payload.packagingLabel,
          unitPrice: payload.unitPrice,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    const next = Math.floor(quantity)
    setLines((prev) => {
      if (next < 1) {
        return prev.filter((l) => makeLineKey(l) !== lineKey)
      }
      return prev.map((l) =>
        makeLineKey(l) === lineKey ? { ...l, quantity: next } : l,
      )
    })
  }, [])

  const removeLine = useCallback((lineKey: string) => {
    setLines((prev) => prev.filter((l) => makeLineKey(l) !== lineKey))
  }, [])

  const replaceAll = useCallback((next: CartLine[]) => {
    setLines(next)
  }, [])

  const syncWithCatalog = useCallback((availableSlugs: string[]) => {
    const set = new Set(availableSlugs)
    setLines((prev) => {
      const next = prev.filter((l) => set.has(l.productSlug))
      return next.length === prev.length ? prev : next
    })
  }, [])

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
