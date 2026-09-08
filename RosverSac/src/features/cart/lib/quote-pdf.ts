import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { ROSVER_COMPANY } from '@/shared/lib/company'

export type QuotePdfCustomer = {
  name: string
  document: string
  phone: string
  city: string
}

export type QuotePdfLine = {
  quantity: number
  unit: string
  description: string
  sku: string
  unitPrice: number | null
}

export type QuotePdfInput = {
  customer: QuotePdfCustomer
  lines: QuotePdfLine[]
  docNumber?: string
  currency?: string
}

function money(n: number) {
  return n.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function nextDocNumber() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `COT-${y}${m}${day}-${seq}`
}

let logoDataUrlPromise: Promise<string | null> | null = null

function loadLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = (async () => {
      try {
        const res = await fetch('/logo_sinfondo.png')
        if (!res.ok) return null
        const blob = await res.blob()
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('logo read'))
          reader.readAsDataURL(blob)
        })
      } catch {
        return null
      }
    })()
  }
  return logoDataUrlPromise
}

/** URL personalizada por cotización (QR funcional). */
export function quoteLandingUrl(docNumber: string) {
  const base = ROSVER_COMPANY.web.replace(/\/$/, '')
  return `${base}/cotizar?ref=${encodeURIComponent(docNumber)}`
}

/**
 * PDF de cotización comercial (no factura / no comprobante).
 * Logo + lista de productos + total estimado + pie web + QR.
 */
export async function buildQuotePdf(input: QuotePdfInput): Promise<{
  blob: Blob
  fileName: string
  docNumber: string
  total: number
}> {
  const docNumber = input.docNumber ?? nextDocNumber()
  const co = ROSVER_COMPANY
  const lines = input.lines.filter((l) => l.description.trim())
  const landingUrl = quoteLandingUrl(docNumber)
  const issued = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const total = lines.reduce((sum, l) => {
    if (l.unitPrice == null) return sum
    return sum + l.unitPrice * l.quantity
  }, 0)
  const hasConsult = lines.some((l) => l.unitPrice == null)

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadLogoDataUrl(),
    QRCode.toDataURL(landingUrl, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: 'M',
      color: { dark: '#0D0D0D', light: '#FFFFFF' },
    }).catch(() => null as string | null),
  ])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  let y = 14

  // ── Cabecera comercial ──
  const logoSize = 26
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, y - 2, logoSize, logoSize)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(227, 6, 19)
    doc.text('ROSVER', margin, y + 10)
  }

  const textX = margin + (logoDataUrl ? logoSize + 5 : 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(13, 13, 13)
  doc.text(co.tradeName, textX, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 90)
  doc.text('Importaciones · Catálogo B2B', textX, y + 10)
  doc.setFontSize(7)
  doc.text(`${co.phones}  ·  ${co.email}`, textX, y + 15)
  doc.text(co.address, textX, y + 19, { maxWidth: 95 })

  // Título cotización (derecha, sin caja tipo SUNAT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(227, 6, 19)
  doc.text('COTIZACIÓN', pageW - margin, y + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(13, 13, 13)
  doc.text(`N.º ${docNumber}`, pageW - margin, y + 12, { align: 'right' })
  doc.setTextColor(100, 100, 100)
  doc.text(issued, pageW - margin, y + 17, { align: 'right' })
  doc.text('Vigencia: 48 h hábiles', pageW - margin, y + 21, { align: 'right' })

  y = Math.max(y + logoSize + 2, y + 26) + 4

  doc.setDrawColor(227, 6, 19)
  doc.setLineWidth(1)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Destinatario ──
  const c = input.customer
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(227, 6, 19)
  doc.text('COTIZADO PARA', margin, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(13, 13, 13)
  doc.text(c.name || 'Cliente', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  const meta: string[] = []
  if (c.document.trim()) meta.push(`Doc. ${c.document.trim()}`)
  if (c.phone.trim()) meta.push(`WhatsApp ${c.phone.trim()}`)
  if (c.city.trim()) meta.push(c.city.trim())
  if (meta.length) {
    doc.text(meta.join('  ·  '), margin, y, { maxWidth: pageW - margin * 2 })
    y += 5
  }
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(13, 13, 13)
  doc.text('Productos de esta cotización', margin, y)
  y += 5

  // Cabecera lista (suave, no grilla de factura)
  const colProd = margin
  const colQty = pageW - margin - 72
  const colUnit = pageW - margin - 48
  const colPrice = pageW - margin - 28

  doc.setFillColor(243, 244, 246)
  doc.roundedRect(margin, y, pageW - margin * 2, 7, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(90, 90, 90)
  doc.text('PRODUCTO', colProd + 3, y + 4.5)
  doc.text('CANT.', colQty, y + 4.5)
  doc.text('UND.', colUnit, y + 4.5)
  doc.text('TOTAL', colPrice + 20, y + 4.5, { align: 'right' })
  y += 9

  doc.setFont('helvetica', 'normal')
  lines.forEach((line, idx) => {
    if (y > 205) {
      doc.addPage()
      y = 18
    }
    const lineTotal =
      line.unitPrice != null ? line.unitPrice * line.quantity : null
    const title = line.description
    const sku = line.sku ? `SKU ${line.sku}` : ''
    const titleLines = doc.splitTextToSize(title, colQty - colProd - 8) as string[]
    const h = Math.max(10, titleLines.length * 4 + (sku ? 4 : 0) + 3)

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y - 1, pageW - margin * 2, h, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(13, 13, 13)
    doc.text(titleLines, colProd + 3, y + 3.5)
    if (sku) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(120, 120, 120)
      doc.text(sku, colProd + 3, y + 3.5 + titleLines.length * 4)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(13, 13, 13)
    doc.text(String(line.quantity), colQty + 2, y + 4)
    doc.text(line.unit.slice(0, 10), colUnit, y + 4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(227, 6, 19)
    doc.text(
      lineTotal != null ? `S/ ${money(lineTotal)}` : 'Consultar',
      pageW - margin - 3,
      y + 4,
      { align: 'right' },
    )
    y += h
  })

  y += 6
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Total estimado (una sola cifra — no desglose IGV de factura)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text('Total estimado', pageW - margin - 55, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(227, 6, 19)
  doc.text(
    total > 0 ? `S/ ${money(total)}` : 'A consultar',
    pageW - margin,
    y,
    { align: 'right' },
  )
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 110)
  doc.text(
    hasConsult
      ? 'Algunos ítems quedan “Consultar”: confirmamos precio al responderte.'
      : 'Montos referenciales. Confirmamos stock, precio y tipo de cambio al cerrar el pedido.',
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  )
  y += 10

  // ── Pie visita web + QR ──
  const footerH = 46
  const footerTop = Math.min(Math.max(y, pageH - 58), pageH - footerH - 8)
  doc.setFillColor(13, 13, 13)
  doc.roundedRect(margin, footerTop, pageW - margin * 2, footerH, 2, 2, 'F')

  const qrSize = 30
  const qrX = margin + 5
  const qrY = footerTop + (footerH - qrSize) / 2
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 1, 1, 'F')
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  }

  const footTextX = qrX + qrSize + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(227, 6, 19)
  doc.text('¡Visítanos en la web!', footTextX, footerTop + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(
    'Mira el catálogo completo, ofertas y más productos.',
    footTextX,
    footerTop + 18,
    { maxWidth: pageW - footTextX - margin - 4 },
  )
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(242, 183, 5)
  doc.text(co.web.replace(/^https?:\/\//, ''), footTextX, footerTop + 25)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(200, 200, 200)
  doc.text(
    `Escanea el QR · abre tu cotización ${docNumber} en línea`,
    footTextX,
    footerTop + 32,
    { maxWidth: pageW - footTextX - margin - 4 },
  )

  doc.setFontSize(6)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'Esta cotización es informativa. No es boleta, factura ni comprobante SUNAT.',
    pageW / 2,
    pageH - 5,
    { align: 'center', maxWidth: pageW - margin * 2 },
  )

  const blob = doc.output('blob')
  const fileName = `Cotizacion-Rosver-${docNumber}.pdf`
  return { blob, fileName, docNumber, total }
}

export function downloadBlob(blob: Blob, fileName: string) {
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
