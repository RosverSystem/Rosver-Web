export type CartLine = {
  productSlug: string
  quantity: number
  packagingId?: string
  packagingLabel?: string
  /** Precio unitario congelado al agregar */
  unitPrice?: number | null
}
