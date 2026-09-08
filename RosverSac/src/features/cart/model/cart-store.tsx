import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { INITIAL_CART, type CartLine } from './mocks'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  addItem: (productSlug: string, quantity?: number) => void
  updateQuantity: (productSlug: string, quantity: number) => void
  removeLine: (productSlug: string) => void
  replaceAll: (next: CartLine[]) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(INITIAL_CART)

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

    return {
      lines,
      itemCount,
      addItem(productSlug, quantity = 1) {
        setLines((prev) => {
          const existing = prev.find((l) => l.productSlug === productSlug)
          if (existing) {
            return prev.map((l) =>
              l.productSlug === productSlug
                ? { ...l, quantity: l.quantity + quantity }
                : l,
            )
          }
          return [...prev, { productSlug, quantity }]
        })
      },
      updateQuantity(productSlug, quantity) {
        setLines((prev) =>
          prev.map((l) =>
            l.productSlug === productSlug
              ? { ...l, quantity: Math.max(1, quantity) }
              : l,
          ),
        )
      },
      removeLine(productSlug) {
        setLines((prev) => prev.filter((l) => l.productSlug !== productSlug))
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
