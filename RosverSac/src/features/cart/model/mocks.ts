export type CartLine = {
  productSlug: string
  quantity: number
}

export const INITIAL_CART: CartLine[] = [
  { productSlug: 'taladro-percutor-20v', quantity: 2 },
  { productSlug: 'set-llaves-combinadas-40pzs', quantity: 12 },
]
