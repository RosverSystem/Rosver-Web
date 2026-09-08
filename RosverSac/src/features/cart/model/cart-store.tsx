import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { INITIAL_CART, type CartLine } from './mocks'

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
  addItem: (input: string | AddCartItemInput, quantity?: number) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  removeLine: (lineKey: string) => void
  replaceAll: (next: CartLine[]) => void
  clear: () => void
  lineKey: (line: CartLine) => string
}

const CartContext = createContext<CartContextValue | null>(null)

function makeLineKey(line: Pick<CartLine, 'productSlug' | 'packagingId'>) {
  return line.packagingId
    ? `${line.productSlug}::${line.packagingId}`
    : line.productSlug
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(INITIAL_CART)

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

    return {
      lines,
      itemCount,
      lineKey: makeLineKey,
      addItem(input, quantity = 1) {
        const payload: AddCartItemInput =
          typeof input === 'string'
            ? { productSlug: input, quantity }
            : { ...input, quantity: input.quantity ?? quantity }

        const qty = payload.quantity ?? 1
        setLines((prev) => {
          const key = makeLineKey({
            productSlug: payload.productSlug,
            packagingId: payload.packagingId,
          })
          const existing = prev.find((l) => makeLineKey(l) === key)
          if (existing) {
            return prev.map((l) =>
              makeLineKey(l) === key
                ? { ...l, quantity: l.quantity + qty }
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
      },
      updateQuantity(lineKey, quantity) {
        setLines((prev) =>
          prev.map((l) =>
            makeLineKey(l) === lineKey
              ? { ...l, quantity: Math.max(1, quantity) }
              : l,
          ),
        )
      },
      removeLine(lineKey) {
        setLines((prev) => prev.filter((l) => makeLineKey(l) !== lineKey))
      },
      replaceAll(next) {
        setLines(next)
      },
      clear() {
        setLines([])
      },
    }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return ctx
}
