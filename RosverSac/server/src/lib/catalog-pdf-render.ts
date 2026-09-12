import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument } from 'pdf-lib'
import puppeteer from 'puppeteer'
import { config } from '../config.js'
import { pool } from '../db.js'
import { queryStoreProducts } from './catalog-products.js'
import {
  buildHtmlSections,
  renderCatalogHtml,
  type PdfCategory,
} from './catalog-pdf-html.js'

const here = path.dirname(fileURLToPath(import.meta.url))
/** RosverSac/ (lib → src → server → RosverSac) */
const sacRoot = path.resolve(here, '../../..')
const COVER_PATH = path.join(sacRoot, 'public', 'CatalagoPDF', 'Caratula.pdf')

function mediaBase() {
  return (config.apiUrl || `http://127.0.0.1:${config.port}`).replace(/\/$/, '')
}

async function loadCategories(): Promise<PdfCategory[]> {
  const { rows } = await pool.query(
    `SELECT id, parent_id, slug, name, image_url, tagline, sort_order
     FROM categories WHERE visible = true
     ORDER BY sort_order, name`,
  )
  return rows.map((r) => ({
    id: String(r.id),
    parentId: r.parent_id ? String(r.parent_id) : null,
    slug: String(r.slug),
    name: String(r.name),
    imageUrl: r.image_url ? String(r.image_url) : null,
    tagline: r.tagline ? String(r.tagline) : null,
    sortOrder: Number(r.sort_order ?? 999),
  }))
}

/**
 * Genera catálogo PDF (HTML + Chromium) y antepone Caratula.pdf.
 */
export async function generateCatalogPdfBuffer(): Promise<Uint8Array> {
  const base = mediaBase()
  const [categories, products] = await Promise.all([
    loadCategories(),
    queryStoreProducts(1000),
  ])

  const sections = buildHtmlSections(categories, products, base)
  if (sections.length === 0) {
    throw new Error('No hay productos visibles para el catálogo.')
  }

  const logoUrl = `${base}/api/media/brand/logo-sinfondo.png`
  const year = new Date().getFullYear()
  const html = renderCatalogHtml({
    year,
    sections,
    logoUrl,
    company: {
      localAddress: 'Jirón Cusco 774, Lima 15001',
      phones: '980 202 591 / 960 106 901',
      email: 'ventas@rosver.pe',
      web: config.appUrl.replace(/\/$/, ''),
      legalName: 'ROSVER S.A.C.',
    },
  })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  })

  let bodyPdf: Uint8Array
  try {
    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 120_000,
    })
    const buf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    })
    bodyPdf = new Uint8Array(buf)
  } finally {
    await browser.close()
  }

  const out = await PDFDocument.create()
  try {
    const coverBytes = await fs.readFile(COVER_PATH)
    const coverDoc = await PDFDocument.load(coverBytes, {
      ignoreEncryption: true,
    })
    const coverPages = await out.copyPages(coverDoc, coverDoc.getPageIndices())
    coverPages.forEach((p) => out.addPage(p))
    console.log(`[catalog-pdf] Carátula OK (${coverPages.length} pág.) ← ${COVER_PATH}`)
  } catch (err) {
    console.error('[catalog-pdf] No se pudo unir Caratula.pdf:', COVER_PATH, err)
    throw new Error(
      'No se encontró o no se pudo leer la carátula (public/CatalagoPDF/Caratula.pdf).',
    )
  }

  const bodyDoc = await PDFDocument.load(bodyPdf)
  const bodyPages = await out.copyPages(bodyDoc, bodyDoc.getPageIndices())
  bodyPages.forEach((p) => out.addPage(p))

  return out.save()
}
