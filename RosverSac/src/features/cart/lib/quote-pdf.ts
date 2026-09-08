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
  /** Número documento ej. C001 N°00001234 */
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
  const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(8, '0')
  return `C001 N°${seq}`
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
 * PDF cotización estilo factura impresa Rosver (A4) + pie web/QR.
 * No es comprobante SUNAT; el layout replica la plantilla comercial.
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
  const landingUrl = quoteLandingUrl(docNumber)

  const subtotal = lines.reduce((sum, l) => {
    if (l.unitPrice == null) return sum
    return sum + l.unitPrice * l.quantity
  }, 0)
  /** Precios de tienda se tratan como inc. IGV 18%. */
  const base = subtotal / 1.18
  const igv = subtotal - base
  const total = subtotal

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
  const margin = 12
  let y = 12

  // ── Cabecera izquierda: logo + datos empresa ──
  const logoW = 38
  const logoH = 22
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, y, logoW, logoH)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(227, 6, 19)
    doc.text('ROSVER', margin, y + 12)
  }

  y = 12 + logoH + 3
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(40, 40, 40)
  const leftInfo = [
    co.address,
    `DIR.LOCAL: ${co.localAddress}`,
    `TELF.: ${co.phones.replace(/\s*\/\s*/g, '-')}`,
    `E-MAIL: ${co.email}`,
  ]
  for (const line of leftInfo) {
    doc.text(line, margin, y, { maxWidth: 100 })
    y += 3.4
  }

  // ── Cabecera derecha: caja RUC / COTIZACIÓN / N° ──
  const boxW = 72
  const boxH = 30
  const boxX = pageW - margin - boxW
  const boxY = 10
  doc.setDrawColor(13, 13, 13)
  doc.setLineWidth(0.7)
  doc.rect(boxX, boxY, boxW, boxH)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(13, 13, 13)
  doc.text(`R.U.C. ${co.ruc}`, boxX + boxW / 2, boxY + 8, { align: 'center' })
  doc.setFontSize(12)
  doc.text('COTIZACIÓN', boxX + boxW / 2, boxY + 17, { align: 'center' })
  doc.setFontSize(10)
  doc.text(docNumber, boxX + boxW / 2, boxY + 25, { align: 'center' })

  y = Math.max(y, boxY + boxH) + 8

  // ── Datos cliente (2 columnas, estilo factura) ──
  const c = input.customer
  const issued = new Date().toISOString().slice(0, 10)
  const col2 = pageW / 2 + 2
  const rowGap = 4.2

  function metaRow(
    leftLabel: string,
    leftVal: string,
    rightLabel: string,
    rightVal: string,
  ) {
    const leftLab = `${leftLabel} : `
    const rightLab = `${rightLabel} : `
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(13, 13, 13)
    doc.text(leftLab, margin, y)
    const leftValX = margin + doc.getTextWidth(leftLab)
    doc.setFont('helvetica', 'normal')
    doc.text(leftVal || '—', leftValX, y, {
      maxWidth: col2 - leftValX - 4,
    })
    doc.setFont('helvetica', 'bold')
    doc.text(rightLab, col2, y)
    const rightValX = col2 + doc.getTextWidth(rightLab)
    doc.setFont('helvetica', 'normal')
    doc.text(rightVal || '—', rightValX, y, {
      maxWidth: pageW - margin - rightValX,
    })
    y += rowGap
  }

  metaRow('RUC', c.document.trim() || '—', 'FECHA EMISION', issued)
  metaRow('SEÑOR(ES)', c.name.trim() || '—', 'CLIENTE', c.phone.trim() || '—')
  metaRow('DIRECCIÓN', c.city.trim() || '—', 'MONEDA', currency)
  metaRow('CONTACTO', c.phone.trim() || '—', 'VIGENCIA', '48 H HÁBILES')
  metaRow('FORMA PAGO', 'POR CONFIRMAR', 'O/C', '—')
  y += 4

  // ── Tabla ítems (columnas con líneas verticales) ──
  const tableX = margin
  const tableW = pageW - margin * 2
  const colXs = [
    tableX,
    tableX + 10,
    tableX + 28,
    tableX + 42,
    tableX + tableW - 50,
    tableX + tableW - 25,
    tableX + tableW,
  ]
  const headerH = 7
  const footerReserve = 78
  const tableBottomMax = pageH - footerReserve

  function drawColLines(top: number, bottom: number) {
    doc.setDrawColor(13, 13, 13)
    doc.setLineWidth(0.35)
    for (const x of colXs) {
      doc.line(x, top, x, bottom)
    }
    doc.line(tableX, top, tableX + tableW, top)
    doc.line(tableX, bottom, tableX + tableW, bottom)
  }

  let tableTop = y

  function drawTableHeader() {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(13, 13, 13)
    doc.text('IT.', colXs[0]! + 2, y + 4.8)
    doc.text('CANT', colXs[1]! + 2, y + 4.8)
    doc.text('UND', colXs[2]! + 2, y + 4.8)
    doc.text('DESCRIPCIÓN', colXs[3]! + 2, y + 4.8)
    doc.text('PRECIO UNITARIO', colXs[5]! - 2, y + 4.8, { align: 'right' })
    doc.text('PRECIO TOTAL', colXs[6]! - 2, y + 4.8, { align: 'right' })
    y += headerH
    doc.setDrawColor(13, 13, 13)
    doc.setLineWidth(0.5)
    doc.line(tableX, y, tableX + tableW, y)
  }

  drawTableHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  lines.forEach((line, idx) => {
    if (y > tableBottomMax - 20) {
      drawColLines(tableTop, y)
      doc.addPage()
      y = 16
      tableTop = y
      drawTableHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
    }

    const lineTotal =
      line.unitPrice != null ? line.unitPrice * line.quantity : null
    const desc = `${line.description}${line.sku ? ` (${line.sku})` : ''}`
    const descW = colXs[4]! - colXs[3]! - 3
    const descLines = doc.splitTextToSize(desc, descW) as string[]
    const h = Math.max(7, descLines.length * 3.6 + 2)

    doc.setTextColor(13, 13, 13)
    doc.text(String(idx + 1), colXs[0]! + 3, y + 4.5)
    doc.text(line.quantity.toFixed(2), colXs[2]! - 2, y + 4.5, {
      align: 'right',
    })
    doc.text(line.unit.slice(0, 8).toUpperCase(), colXs[2]! + 2, y + 4.5)
    doc.text(descLines, colXs[3]! + 2, y + 4.5)
    doc.text(
      line.unitPrice != null ? money(line.unitPrice) : 'Consultar',
      colXs[5]! - 2,
      y + 4.5,
      { align: 'right' },
    )
    doc.text(
      lineTotal != null ? money(lineTotal) : '—',
      colXs[6]! - 2,
      y + 4.5,
      { align: 'right' },
    )
    y += h
  })

  // Cuerpo vacío hasta altura mínima (como factura impresa)
  const minTableBottom = Math.min(tableBottomMax - 8, Math.max(y + 8, tableTop + 55))
  if (y < minTableBottom) y = minTableBottom
  drawColLines(tableTop, y)
  y += 6

  // ── SON: ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(13, 13, 13)
  const words = total > 0 ? amountToWordsEs(total) : 'A CONSULTAR'
  doc.text(`SON: ${words}`, margin, y, { maxWidth: pageW - margin * 2 })
  y += 6

  // ── Totales (estilo factura) ──
  const totLabels = [
    'OP. GRABADA',
    'OP. GRATUITA',
    'OP. INAFECTA',
    'OP. EXONERADA',
    'DESCTO',
    'IGV (18%)',
    'PRECIO TOTAL',
  ]
  const totValues = [
    money(base),
    money(0),
    money(0),
    money(0),
    money(0),
    money(igv),
    money(total),
  ]
  const totW = pageW - margin * 2
  const cellW = totW / totLabels.length
  const totX = margin
  const labelH = 7
  const valueH = 8

  doc.setDrawColor(13, 13, 13)
  doc.setLineWidth(0.4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)
  totLabels.forEach((lab, i) => {
    const x = totX + i * cellW
    doc.rect(x, y, cellW, labelH)
    doc.text(lab, x + cellW / 2, y + 4.5, { align: 'center', maxWidth: cellW - 1 })
  })
  y += labelH
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  totValues.forEach((val, i) => {
    const x = totX + i * cellW
    doc.rect(x, y, cellW, valueH)
    if (i === totValues.length - 1) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(13, 13, 13)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(13, 13, 13)
    }
    doc.text(val, x + cellW / 2, y + 5.5, { align: 'center' })
  })
  y += valueH + 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(80, 80, 80)
  doc.text(
    'Documento de cotización referencial — no es boleta, factura ni comprobante SUNAT.',
    margin,
    y,
  )
  y += 3.5
  doc.text(
    'Precios sujetos a confirmación de stock y tipo de cambio. Vigencia orientativa: 48 h hábiles.',
    margin,
    y,
  )
  y += 6

  // ── Pie: visita web + QR personalizado (pedido previo) ──
  const footerH = 42
  const footerTop = Math.min(Math.max(y, pageH - footerH - 10), pageH - footerH - 8)
  doc.setFillColor(243, 244, 246)
  doc.setDrawColor(227, 6, 19)
  doc.setLineWidth(0.6)
  doc.rect(margin, footerTop, pageW - margin * 2, footerH, 'FD')

  const qrSize = 28
  const qrX = margin + 4
  const qrY = footerTop + (footerH - qrSize) / 2
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255)
    doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'F')
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  }

  const footTextX = qrX + qrSize + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(227, 6, 19)
  doc.text('¡Visítanos en la web!', footTextX, footerTop + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(40, 40, 40)
  doc.text(
    'Catálogo, ofertas y más productos importados en un solo lugar.',
    footTextX,
    footerTop + 16,
    { maxWidth: pageW - footTextX - margin - 4 },
  )
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(13, 13, 13)
  doc.text(co.web.replace(/^https?:\/\//, ''), footTextX, footerTop + 23)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(90, 90, 90)
  doc.text(
    `Escanea el QR para abrir tu cotización ${docNumber} en línea.`,
    footTextX,
    footerTop + 29,
    { maxWidth: pageW - footTextX - margin - 4 },
  )
  doc.text(
    'O escribe la referencia al contactarnos por WhatsApp / correo.',
    footTextX,
    footerTop + 34,
    { maxWidth: pageW - footTextX - margin - 4 },
  )

  doc.setFontSize(5.5)
  doc.setTextColor(110, 110, 110)
  doc.text(
    'NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES CON DAÑOS FÍSICOS O ACCESORIOS FALTANTES, SOLO POR FALLAS DE FABRICACIÓN.',
    pageW / 2,
    pageH - 5,
    { align: 'center', maxWidth: pageW - margin * 2 },
  )

  const blob = doc.output('blob')
  const safeName = docNumber.replace(/[^\w.-]+/g, '-')
  const fileName = `Cotizacion-Rosver-${safeName}.pdf`
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
