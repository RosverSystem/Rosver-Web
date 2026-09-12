export type CatalogPdfProduct = {
  id: string
  name: string
  sku: string
  code?: number
  codeLabel: string
  price: number | null
  vendor: string
  imageDataUrl: string | null
  categorySlug: string
  /** Ej. "Paquete" */
  packKind: string
  /** Ej. "240 UND" */
  packQty: string
}

export type CatalogPdfSubsection = {
  title: string
  slug: string
  products: CatalogPdfProduct[]
}

export type CatalogPdfSection = {
  title: string
  slug: string
  tagline?: string
  /** URL original (se convierte a dataUrl al generar). */
  imageUrl?: string
  imageDataUrl: string | null
  brands: string[]
  subsections: CatalogPdfSubsection[]
}

export type CatalogPdfPayload = {
  year: number
  generatedAtLabel: string
  productCount: number
  sections: CatalogPdfSection[]
  logoDataUrl: string | null
}
