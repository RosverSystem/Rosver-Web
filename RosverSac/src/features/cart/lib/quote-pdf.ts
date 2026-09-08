import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { ROSVER_COMPANY } from '@/shared/lib/company'
import { amountToWordsEs } from '@/shared/lib/number-to-words-es'

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
  /** Número documento ej. C001-00001234 */
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
  return `C001-${y}${m}${day}-${seq}`
}

/**
 * PDF cotización estilo factura impresa Rosver (A4).
 * WhatsApp no permite adjuntar PDF por enlace: el PDF se descarga aparte.
 */
export async function buildQuotePdf(input: QuotePdfInput): Promise<{
  blob: Blob
  fileName: string
  docNumber: string
  total: number
}> {
  const docNumber = input.docNumber ?? nextDocNumber()
  const currency = input.currency ?? 'SOLES'
  const co = ROSVER_COMPANY
  const lines = input.lines.filter((l) => l.description.trim())

  const subtotal = lines.reduce((sum, l) => {
    if (l.unitPrice == null) return sum
    return sum + l.unitPrice * l.quantity
  }, 0)
  /** Precios de tienda se tratan como inc. IGV 18%. */
  const base = subtotal / 1.18
  const igv = subtotal - base
  const total = subtotal

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 12
  let y = 14

  // Header left — empresa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(227, 6, 19)
  doc.text('ROSVER', margin, y)
  doc.setTextColor(13, 13, 13)
  doc.setFontSize(9)
  doc.text('SAC', margin + 28, y)

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(60, 60, 60)
  const leftInfo = [
    co.address,
    `DIR. LOCAL: ${co.localAddress}`,
    `TELF.: ${co.phones}`,
    `EMAIL: ${co.email}`,
  ]
  for (const line of leftInfo) {
    doc.text(line, margin, y, { maxWidth: 95 })
    y += 3.5
  }

  // Header right — caja documento
  const boxX = pageW - margin - 72
  const boxY = 10
  doc.setDrawColor(13, 13, 13)
  doc.setLineWidth(0.6)
  doc.rect(boxX, boxY, 72, 28)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(13, 13, 13)
  doc.text(`R.U.C. ${co.ruc}`, boxX + 36, boxY + 8, { align: 'center' })
  doc.setFontSize(11)
  doc.text('COTIZACIÓN', boxX + 36, boxY + 16, { align: 'center' })
  doc.setFontSize(10)
  doc.text(docNumber, boxX + 36, boxY + 23, { align: 'center' })

  y = Math.max(y, boxY + 32) + 4

  // Cliente
  const c = input.customer
  const issued = new Date().toISOString().slice(0, 10)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`RUC/DNI: ${c.document || '—'}`, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`FECHA EMISIÓN: ${issued}`, pageW / 2 + 4, y)
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text(`SEÑOR(ES): ${c.name || '—'}`, margin, y, { maxWidth: 95 })
  doc.setFont('helvetica', 'normal')
  doc.text(`MONEDA: ${currency}`, pageW / 2 + 4, y)
  y += 4
  doc.text(`TEL/WHATSAPP: ${c.phone || '—'}`, margin, y)
  doc.text(`CIUDAD/AGENCIA: ${c.city || '—'}`, pageW / 2 + 4, y, {
    maxWidth: 90,
  })
  y += 4
  doc.text('FORMA PAGO: POR CONFIRMAR', margin, y)
  doc.text('DOC.: COTIZACIÓN (NO ES COMPROBANTE)', pageW / 2 + 4, y)
  y += 6

  // Tabla
  const cols = {
    it: margin,
    cant: margin + 10,
    und: margin + 26,
    desc: margin + 40,
    pu: pageW - margin - 44,
    pt: pageW - margin - 22,
  }
  const rowH = 7
  doc.setFillColor(243, 244, 246)
  doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
  doc.setDrawColor(13, 13, 13)
  doc.rect(margin, y, pageW - margin * 2, rowH)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('IT.', cols.it + 1, y + 4.5)
  doc.text('CANT', cols.cant + 1, y + 4.5)
  doc.text('UND', cols.und + 1, y + 4.5)
  doc.text('DESCRIPCIÓN', cols.desc + 1, y + 4.5)
  doc.text('P. UNIT', cols.pu + 1, y + 4.5)
  doc.text('P. TOTAL', cols.pt + 1, y + 4.5)
  y += rowH

  doc.setFont('helvetica', 'normal')
  lines.forEach((line, idx) => {
    if (y > 250) {
      doc.addPage()
      y = 16
    }
    const lineTotal =
      line.unitPrice != null ? line.unitPrice * line.quantity : null
    const desc = `${line.description}${line.sku ? ` (${line.sku})` : ''}`
    const descLines = doc.splitTextToSize(desc, cols.pu - cols.desc - 2) as string[]
    const h = Math.max(rowH, descLines.length * 3.5 + 2)

    doc.rect(margin, y, pageW - margin * 2, h)
    doc.text(String(idx + 1), cols.it + 1, y + 4)
    doc.text(line.quantity.toFixed(2), cols.cant + 1, y + 4)
    doc.text(line.unit.slice(0, 6), cols.und + 1, y + 4)
    doc.text(descLines, cols.desc + 1, y + 4)
    doc.text(
      line.unitPrice != null ? money(line.unitPrice) : 'Consultar',
      cols.pu + 1,
      y + 4,
    )
    doc.text(
      lineTotal != null ? money(lineTotal) : '—',
      cols.pt + 1,
      y + 4,
    )
    y += h
  })

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const words = amountToWordsEs(total)
  doc.text(`SON: ${words}`, margin, y, { maxWidth: pageW - margin * 2 })
  y += 6

  // Totales
  const totW = 110
  const totX = pageW - margin - totW
  const cellW = totW / 3
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  const totLabels = ['OP. GRAVADA', 'IGV (18%)', 'PRECIO TOTAL']
  const totValues = [money(base), money(igv), money(total)]
  totLabels.forEach((lab, i) => {
    const x = totX + i * cellW
    doc.rect(x, y, cellW, 6)
    doc.text(lab, x + cellW / 2, y + 4, { align: 'center' })
  })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  totValues.forEach((val, i) => {
    const x = totX + i * cellW
    doc.rect(x, y, cellW, 8)
    doc.setFont('helvetica', i === 2 ? 'bold' : 'normal')
    doc.text(val, x + cellW / 2, y + 5.5, { align: 'center' })
  })
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text(
    'Documento de cotización referencial — no es comprobante de pago SUNAT.',
    margin,
    y,
  )
  y += 4
  doc.text(
    'Precios sujetos a confirmación de stock y TC. Vigencia orientativa: 48 h hábiles.',
    margin,
    y,
  )
  y += 8

  try {
    const qrDataUrl = await QRCode.toDataURL(co.web, {
      margin: 1,
      width: 120,
      color: { dark: '#0D0D0D', light: '#FFFFFF' },
    })
    doc.addImage(qrDataUrl, 'PNG', pageW / 2 - 14, y, 28, 28)
    y += 32
  } catch {
    y += 4
  }

  doc.setFontSize(6.5)
  doc.setTextColor(13, 13, 13)
  doc.text(
    'NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES CON DAÑOS FÍSICOS O ACCESORIOS FALTANTES, SOLO POR FALLAS DE FABRICACIÓN.',
    pageW / 2,
    Math.min(y + 4, 285),
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
