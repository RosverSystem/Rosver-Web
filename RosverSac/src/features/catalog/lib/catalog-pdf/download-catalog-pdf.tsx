import { brandMediaPath, BRAND_KEYS } from '@/shared/lib/brand-assets'
import type { Category, Product } from '@/features/catalog/model/mocks'
import { buildCatalogSections } from './build-tree'
import { loadImagesInBatches, urlToDataUrl } from './load-images'
import type { CatalogPdfPayload } from './types'

const COVER_PATH = '/CatalagoPDF/Caratula.pdf'

export type BuildCatalogPdfOptions = {
  categories: Category[]
  products: Product[]
  onProgress?: (message: string) => void
}

function downloadBytes(bytes: Uint8Array, fileName: string) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const blob = new Blob([copy], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Catálogo: Caratula.pdf + portadas por categoría + productos (sin índice).
 */
export async function downloadCatalogPdf(opts: BuildCatalogPdfOptions) {
  const { categories, products, onProgress } = opts
  onProgress?.('Organizando categorías…')

  const sections = buildCatalogSections(categories, products)
  if (sections.length === 0) {
    throw new Error('No hay productos visibles para el catálogo.')
  }

  const flat = sections.flatMap((sec) =>
    sec.subsections.flatMap((sub) => sub.products),
  )
  const sourceProducts = products.filter((p) =>
    flat.some((f) => f.id === p.id),
  )
  const urlById = new Map(sourceProducts.map((p) => [p.id, p.imageUrl]))

  onProgress?.(`Cargando fotos (0/${flat.length})…`)
  const imageUrls = flat.map((p) => urlById.get(p.id))
  const images = await loadImagesInBatches(imageUrls, 6, (done, total) => {
    onProgress?.(`Cargando fotos (${done}/${total})…`)
  })
  flat.forEach((p, i) => {
    p.imageDataUrl = images[i] ?? null
  })

  onProgress?.('Cargando imágenes de categorías…')
  await Promise.all(
    sections.map(async (sec) => {
      sec.imageDataUrl = (await urlToDataUrl(sec.imageUrl)) ?? null
    }),
  )

  onProgress?.('Cargando logo…')
  const logoDataUrl = await urlToDataUrl(brandMediaPath(BRAND_KEYS.logoSinfondo))

  const year = new Date().getFullYear()
  const payload: CatalogPdfPayload = {
    year,
    generatedAtLabel: new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date()),
    productCount: flat.length,
    sections,
    logoDataUrl,
  }

  onProgress?.('Diseñando PDF…')
  const [{ pdf }, { CatalogPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./CatalogPdfDocument'),
  ])
  const catalogBlob = await pdf(
    <CatalogPdfDocument data={payload} />,
  ).toBlob()

  onProgress?.('Uniendo carátula general…')
  const { PDFDocument } = await import('pdf-lib')
  const out = await PDFDocument.create()

  try {
    const coverRes = await fetch(COVER_PATH)
    if (coverRes.ok) {
      const coverDoc = await PDFDocument.load(await coverRes.arrayBuffer())
      const coverPages = await out.copyPages(
        coverDoc,
        coverDoc.getPageIndices(),
      )
      coverPages.forEach((p) => out.addPage(p))
    }
  } catch {
    /* sin carátula: sigue el PDF generado */
  }

  const catalogDoc = await PDFDocument.load(await catalogBlob.arrayBuffer())
  const catalogPages = await out.copyPages(
    catalogDoc,
    catalogDoc.getPageIndices(),
  )
  catalogPages.forEach((p) => out.addPage(p))

  const bytes = await out.save()
  downloadBytes(bytes, `Catalogo-Rosver-${year}.pdf`)
}
