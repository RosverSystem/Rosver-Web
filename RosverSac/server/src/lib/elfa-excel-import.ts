import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

export type ImportPriceLine = {
  unitCode: 'unidad' | 'docena' | 'caja'
  contentQty: number
  label: string
  listAmount: number | null
  wholesaleAmount: number | null
}

export type ImportProductDraft = {
  sku: string
  /** Código interno opcional (JSON); si coincide, se sobrescribe el producto. */
  code?: number | null
  name: string
  brandName: string
  contentPerBox: number | null
  prices: ImportPriceLine[]
  sourceSheet: string
  warnings: string[]
}

export type ImportSkipIssue = {
  row: number
  /** Celda Excel tipo B4 */
  cell?: string
  sheet?: string
  reason: string
  raw?: string
}

export type ElfaParseResult = {
  sourceFileName: string
  sheetUsed: string
  format: 'elfa-xlsx' | 'rosver-json-v1' | 'rosver-csv-v1'
  products: ImportProductDraft[]
  skipped: ImportSkipIssue[]
  stats: {
    totalRows: number
    products: number
    withPrices: number
    warnings: number
  }
}

/** Contrato oficial de importación (JSON). */
export const ROSVER_IMPORT_FORMAT = 'rosver-products-import' as const
export const ROSVER_IMPORT_VERSION = 1 as const

export type RosverProductsImportFile = {
  version: typeof ROSVER_IMPORT_VERSION
  format: typeof ROSVER_IMPORT_FORMAT
  brandName?: string
  products: Array<{
    sku: string
    /** Código interno Rosver (opcional). Si coincide, se sobrescribe. */
    code?: number | null
    name: string
    brandName?: string
    contentPerBox?: number | null
    prices?: Array<{
      unitCode: 'unidad' | 'docena' | 'caja'
      contentQty?: number
      label?: string
      listAmount?: number | null
      wholesaleAmount?: number | null
    }>
  }>
}

function colLetter(index: number): string {
  let n = index
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

function cellRef(colIndex: number, row1Based: number): string {
  return `${colLetter(colIndex)}${row1Based}`
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

/** Acepta 65, "65", "S/ 65.00", "S/ 65,00". */
export function cellNum(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') {
    return Number.isFinite(v) && v >= 0 ? v : null
  }
  let s = String(v).trim()
  if (!s) return null
  s = s.replace(/S\/\s*/gi, '').replace(/\s/g, '')
  // quitar símbolo moneda residual
  s = s.replace(/[^\d,.-]/g, '')
  if (!s || s === '-' || s === '.' || s === ',') return null

  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }

  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function looksLikeSku(code: string): boolean {
  if (!code || code.length < 3) return false
  const upper = code.toUpperCase()
  if (
    [
      'CODIGO',
      'CÓDIGO',
      'DESCRIPCIÓN',
      'DESCRIPCION',
      'CONTENIDO',
      'PRODUCTO ELFA PACK',
    ].includes(upper)
  ) {
    return false
  }
  // "CI" u otros flags cortos
  if (upper.length <= 2) return false
  return /[A-Z]/i.test(code) && /[\d-]/.test(code)
}

function looksLikeSizeGroup(s: string): boolean {
  if (!s) return false
  return /^[\d]+["']?\s*(negro)?$/i.test(s.trim())
}

/** Inferir nombre legible desde códigos ELFA / FILT / FILN. */
export function synthesizeNameFromSku(sku: string, hint = ''): string {
  const s = sku.trim().toUpperCase()
  const hintClean = hint.replace(/^#\s*/i, '').trim()

  if (s.startsWith('ELFA')) {
    if (
      hintClean &&
      !looksLikeSizeGroup(hintClean) &&
      !/#\s*comercial/i.test(hintClean)
    ) {
      return hintClean
    }
    return `Cinta embalaje ${s}`
  }

  const m = s.match(/^(FIL)([TN])(\d+)-(.+)$/i)
  if (m) {
    const color = m[2].toUpperCase() === 'N' ? 'Negro' : 'Transparente'
    const inches = m[3]
    let size = m[4].replace(/\.$/, '')
    if (/^COM/i.test(size)) size = 'Comercial'
    else if (/K$/i.test(size))
      size = size.replace(/K$/i, ' kg').replace('.', ',')
    else if (/G$/i.test(size)) size = size.replace(/G$/i, ' g')
    return `Stretch Film ${inches}" ${color} ${size}`
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (
    hintClean &&
    !/#\s*comercial/i.test(hintClean) &&
    !looksLikeSizeGroup(hintClean) &&
    hintClean.length > 2
  ) {
    return hintClean
  }
  return s
}

function isWeakDescription(desc: string): boolean {
  if (!desc) return true
  if (/#\s*comercial/i.test(desc)) return true
  if (looksLikeSizeGroup(desc)) return true
  return false
}

function buildPrices(input: {
  content: number | null
  cajaPub: number | null
  docenaPub: number | null
  unidPub: number | null
  cajaZona: number | null
  docenaZona: number | null
}): ImportPriceLine[] {
  const lines: ImportPriceLine[] = []
  const content = input.content && input.content > 0 ? input.content : 1

  if (input.unidPub != null) {
    lines.push({
      unitCode: 'unidad',
      contentQty: 1,
      label: 'Unidad',
      listAmount: input.unidPub,
      wholesaleAmount: null,
    })
  }

  if (input.docenaPub != null || input.docenaZona != null) {
    lines.push({
      unitCode: 'docena',
      contentQty: 12,
      label: 'Docena',
      listAmount: input.docenaPub,
      wholesaleAmount: input.docenaZona,
    })
  }

  if (input.cajaPub != null || input.cajaZona != null) {
    lines.push({
      unitCode: 'caja',
      contentQty: content,
      label: content > 1 ? `Caja x${content}` : 'Caja',
      listAmount: input.cajaPub,
      wholesaleAmount: input.cajaZona,
    })
  }

  return lines.filter((l) => l.listAmount != null || l.wholesaleAmount != null)
}

function resolveDescription(row: unknown[]): {
  name: string
  warnings: string[]
  sku: string
} {
  // Layout ELFA: [?, CODIGO, DESCRIP|size, DESCRIP?, CONTENIDO, precios…]
  let code = cellStr(row[1])
  let colA = cellStr(row[0])
  if (!looksLikeSku(code) && looksLikeSku(colA)) code = colA
  const sku = code.toUpperCase()

  const c2 = cellStr(row[2])
  const c3 = cellStr(row[3])
  const warnings: string[] = []

  let desc = ''
  if (!isWeakDescription(c2) && c2.toUpperCase() !== sku) {
    desc = c2
  } else if (!isWeakDescription(c3) && c3.toUpperCase() !== sku) {
    desc = c3
    if (c2) warnings.push(`Grupo: ${c2}`)
  } else if (!isWeakDescription(c2)) {
    desc = c2
  }

  let name = desc.replace(/\s+/g, ' ').trim()
  if (isWeakDescription(name) || name.toUpperCase() === sku) {
    name = synthesizeNameFromSku(sku, c2 || c3)
    warnings.push('Nombre inferido desde el código')
  }

  return { sku, name, warnings }
}

function parseMainSheet(
  rows: unknown[][],
  sheetName: string,
  nameOverrides: Map<string, string>,
): { products: ImportProductDraft[]; skipped: ImportSkipIssue[] } {
  const products: ImportProductDraft[] = []
  const skipped: ImportSkipIssue[] = []
  const seen = new Set<string>()

  let headerIdx = -1
  let codeCol = 1
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i] ?? []
    for (let c = 0; c < Math.min(row.length, 8); c++) {
      const v = cellStr(row[c]).toUpperCase()
      if (v === 'CODIGO' || v === 'CÓDIGO' || v === 'SKU') {
        headerIdx = i
        codeCol = c
        break
      }
    }
    if (headerIdx >= 0) break
  }

  if (headerIdx < 0) {
    skipped.push({
      row: 2,
      cell: 'B2',
      sheet: sheetName,
      reason:
        'No se encontró la cabecera CODIGO. Usa el Excel ELFA (hoja PRODUCTOS ELFA PACK) o el JSON rosver-products-import.',
    })
    return { products, skipped }
  }

  const start = headerIdx + 1

  for (let i = start; i < rows.length; i++) {
    const row = rows[i] ?? []
    const excelRow = i + 1
    const codeCandidate = cellStr(row[codeCol]) || cellStr(row[1]) || cellStr(row[0])
    const codeCell =
      cellStr(row[codeCol])
        ? cellRef(codeCol, excelRow)
        : cellStr(row[1])
          ? cellRef(1, excelRow)
          : cellRef(0, excelRow)

    if (!looksLikeSku(codeCandidate)) {
      // Filas vacías o subcabeceras (CAJA/DOCENA) — no reportar ruido
      const joined = row.map(cellStr).filter(Boolean).join(' ')
      if (!joined) continue
      if (/^(CAJA|DOCENA|UNID)/i.test(joined)) continue
      if (/VENTA\s*PUBLICO|VENTA\s*PÚBLICO|VENTA\s*ZONA|DATOS DEL PRODUCTO/i.test(joined)) continue
      // Filas de tamaño/contenido sueltas (ej. «28», «120») — no son SKU
      if (/^\d+([.,]\d+)?$/.test(codeCandidate)) continue
      if (looksLikeSizeGroup(codeCandidate)) continue
      skipped.push({
        row: excelRow,
        cell: codeCell,
        sheet: sheetName,
        reason: `Código no válido en ${codeCell}. Se esperaba un SKU (ej. ELFA-14M, FILT20-1K).`,
        raw: codeCandidate || joined.slice(0, 40),
      })
      continue
    }

    const resolved = resolveDescription(row)
    let { sku, name, warnings } = resolved
    if (seen.has(sku)) {
      skipped.push({
        row: excelRow,
        cell: codeCell,
        sheet: sheetName,
        reason: `SKU duplicado «${sku}» en ${codeCell}. Ya apareció antes en el archivo.`,
        raw: sku,
      })
      continue
    }

    const override = nameOverrides.get(sku)
    if (override) {
      name = override
      warnings = warnings.filter((w) => !w.includes('inferido'))
    }

    let content = cellNum(row[4])
    let contentCell = cellRef(4, excelRow)
    if (content == null) {
      for (let c = 3; c <= 6; c++) {
        const n = cellNum(row[c])
        if (n != null && n >= 1 && n <= 500 && Number.isInteger(n)) {
          const raw = cellStr(row[c])
          if (!/S\//i.test(raw) && n <= 200) {
            content = n
            contentCell = cellRef(c, excelRow)
            break
          }
        }
      }
    }

    const priceCells = {
      cajaPub: { col: 5, v: cellNum(row[5]) },
      docenaPub: { col: 6, v: cellNum(row[6]) },
      unidPub: { col: 7, v: cellNum(row[7]) },
      cajaZona: { col: 8, v: cellNum(row[8]) },
      docenaZona: { col: 9, v: cellNum(row[9]) },
    }

    // Si hay texto de precio que no se pudo parsear
    for (const [key, info] of Object.entries(priceCells)) {
      const raw = cellStr(row[info.col])
      if (raw && info.v == null && /[\dS/]/i.test(raw)) {
        skipped.push({
          row: excelRow,
          cell: cellRef(info.col, excelRow),
          sheet: sheetName,
          reason: `Precio ilegible en ${cellRef(info.col, excelRow)} (${key}). Usa número o formato «S/ 65.00».`,
          raw,
        })
      }
    }

    const prices = buildPrices({
      content,
      cajaPub: priceCells.cajaPub.v,
      docenaPub: priceCells.docenaPub.v,
      unidPub: priceCells.unidPub.v,
      cajaZona: priceCells.cajaZona.v,
      docenaZona: priceCells.docenaZona.v,
    })
    if (prices.length === 0) {
      warnings.push(`Sin precios en F–J (fila ${excelRow})`)
    }
    if (content == null) {
      warnings.push(`Contenido vacío (${contentCell})`)
    }

    seen.add(sku)
    products.push({
      sku,
      name,
      brandName: 'ELFA',
      contentPerBox: content,
      prices,
      sourceSheet: sheetName,
      warnings,
    })
  }

  return { products, skipped }
}

function parseHoja1Names(rows: unknown[][]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of rows) {
    const sku = (cellStr(row[0]) || cellStr(row[1])).toUpperCase()
    const desc = cellStr(row[2]) || cellStr(row[3])
    if (!looksLikeSku(sku) || isWeakDescription(desc)) continue
    map.set(sku, desc.replace(/\s+/g, ' ').trim())
  }
  return map
}

export function draftsToRosverImportJson(
  products: ImportProductDraft[],
  brandName = 'ELFA',
): RosverProductsImportFile {
  return {
    version: ROSVER_IMPORT_VERSION,
    format: ROSVER_IMPORT_FORMAT,
    brandName,
    products: products.map((p) => ({
      sku: p.sku,
      name: p.name,
      brandName: p.brandName || brandName,
      contentPerBox: p.contentPerBox,
      prices: p.prices.map((pr) => ({
        unitCode: pr.unitCode,
        contentQty: pr.contentQty,
        label: pr.label,
        listAmount: pr.listAmount,
        wholesaleAmount: pr.wholesaleAmount,
      })),
    })),
  }
}

export function parseRosverImportJson(
  raw: unknown,
  fileName: string,
): ElfaParseResult {
  const skipped: ElfaParseResult['skipped'] = []
  if (!raw || typeof raw !== 'object') {
    return {
      sourceFileName: fileName,
      sheetUsed: 'json',
      format: 'rosver-json-v1',
      products: [],
      skipped: [{ row: 0, reason: 'JSON inválido' }],
      stats: { totalRows: 0, products: 0, withPrices: 0, warnings: 0 },
    }
  }

  const data = raw as Partial<RosverProductsImportFile>
  const list = Array.isArray(data.products) ? data.products : []
  const defaultBrand =
    typeof data.brandName === 'string' && data.brandName.trim()
      ? data.brandName.trim()
      : 'ELFA'

  const products: ImportProductDraft[] = []
  const seen = new Set<string>()

  list.forEach((item, idx) => {
    const sku = cellStr(item?.sku).toUpperCase()
    const name = cellStr(item?.name)
    if (!sku || !name) {
      skipped.push({
        row: idx + 1,
        cell: `products[${idx}]`,
        sheet: 'json',
        reason: 'Falta sku o name en el objeto del JSON.',
        raw: sku || name,
      })
      return
    }
    if (seen.has(sku)) {
      skipped.push({
        row: idx + 1,
        cell: `products[${idx}].sku`,
        sheet: 'json',
        reason: `SKU duplicado «${sku}».`,
        raw: sku,
      })
      return
    }
    seen.add(sku)

    const content =
      item.contentPerBox == null ? null : cellNum(item.contentPerBox)
    const prices: ImportPriceLine[] = []
    for (const pr of item.prices ?? []) {
      const unitCode = pr.unitCode
      if (
        unitCode !== 'unidad' &&
        unitCode !== 'docena' &&
        unitCode !== 'caja'
      ) {
        continue
      }
      const contentQty =
        cellNum(pr.contentQty) ??
        (unitCode === 'docena' ? 12 : unitCode === 'caja' ? content || 1 : 1)
      prices.push({
        unitCode,
        contentQty: contentQty || 1,
        label:
          cellStr(pr.label) ||
          (unitCode === 'caja' && contentQty && contentQty > 1
            ? `Caja x${contentQty}`
            : unitCode === 'docena'
              ? 'Docena'
              : 'Unidad'),
        listAmount: cellNum(pr.listAmount ?? null),
        wholesaleAmount: cellNum(pr.wholesaleAmount ?? null),
      })
    }

    products.push({
      sku,
      code:
        item.code == null
          ? null
          : Number.isFinite(Number(item.code))
            ? Math.floor(Number(item.code))
            : null,
      name,
      brandName: cellStr(item.brandName) || defaultBrand,
      contentPerBox: content,
      prices: prices.filter(
        (p) => p.listAmount != null || p.wholesaleAmount != null,
      ),
      sourceSheet: 'json',
      warnings: [],
    })
  })

  return {
    sourceFileName: fileName,
    sheetUsed: 'json',
    format: 'rosver-json-v1',
    products,
    skipped,
    stats: {
      totalRows: list.length,
      products: products.length,
      withPrices: products.filter((p) => p.prices.length > 0).length,
      warnings: skipped.length,
    },
  }
}

/**
 * CSV headers → ImportProductDraft[].
 * Expected columns (case-insensitive, order flexible):
 *   sku, name, brandName?, code?, contentPerBox?,
 *   unidad_list, unidad_wholesale,
 *   docena_list, docena_wholesale,
 *   caja_list, caja_wholesale
 */
function parseRosverCsv(buffer: Buffer, fileName: string): ElfaParseResult {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)
  const products: ImportProductDraft[] = []
  const skipped: ElfaParseResult['skipped'] = []

  if (lines.length < 2) {
    return {
      sourceFileName: fileName,
      sheetUsed: 'csv',
      format: 'rosver-csv-v1' as ElfaParseResult['format'],
      products: [],
      skipped: [{ row: 0, reason: 'CSV vacío o sin encabezado.' }],
      stats: { totalRows: 0, products: 0, withPrices: 0, warnings: 0 },
    }
  }

  // Parse header
  const rawHeader = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
  const col = (name: string) => rawHeader.indexOf(name)

  const iSku = col('sku')
  const iName = col('name')
  if (iSku === -1 || iName === -1) {
    return {
      sourceFileName: fileName,
      sheetUsed: 'csv',
      format: 'rosver-csv-v1' as ElfaParseResult['format'],
      products: [],
      skipped: [{ row: 0, reason: 'CSV no tiene columnas «sku» y «name». Usa la plantilla rosver-csv-v1.' }],
      stats: { totalRows: 0, products: 0, withPrices: 0, warnings: 0 },
    }
  }

  const iBrand = col('brandname')
  const iCode = col('code')
  const iContent = col('contentperbox')
  const iUL = col('unidad_list')
  const iUW = col('unidad_wholesale')
  const iDL = col('docena_list')
  const iDW = col('docena_wholesale')
  const iCL = col('caja_list')
  const iCW = col('caja_wholesale')

  function field(row: string[], idx: number): string {
    if (idx === -1) return ''
    return (row[idx] ?? '').replace(/"/g, '').trim()
  }

  const seen = new Set<string>()
  const dataLines = lines.slice(1).filter((l) => l.trim())

  for (let i = 0; i < dataLines.length; i++) {
    const row = dataLines[i].split(',')
    const sku = field(row, iSku).toUpperCase()
    const name = field(row, iName)
    if (!sku || !name) {
      skipped.push({ row: i + 2, reason: 'Falta sku o name.', raw: dataLines[i] })
      continue
    }
    if (seen.has(sku)) {
      skipped.push({ row: i + 2, reason: `SKU duplicado «${sku}».`, raw: sku })
      continue
    }
    seen.add(sku)

    const brandName = field(row, iBrand) || 'ELFA'
    const codeRaw = field(row, iCode)
    const code = codeRaw && /^\d+$/.test(codeRaw) ? parseInt(codeRaw, 10) : null
    const contentPerBox = cellNum(field(row, iContent))

    const prices: ImportPriceLine[] = []
    const uL = cellNum(field(row, iUL))
    const uW = cellNum(field(row, iUW))
    if (uL != null || uW != null) {
      prices.push({ unitCode: 'unidad', contentQty: 1, label: 'Unidad', listAmount: uL, wholesaleAmount: uW })
    }
    const dL = cellNum(field(row, iDL))
    const dW = cellNum(field(row, iDW))
    if (dL != null || dW != null) {
      prices.push({ unitCode: 'docena', contentQty: 12, label: 'Docena', listAmount: dL, wholesaleAmount: dW })
    }
    const cL = cellNum(field(row, iCL))
    const cW = cellNum(field(row, iCW))
    if (cL != null || cW != null) {
      const qty = contentPerBox ?? 1
      prices.push({
        unitCode: 'caja',
        contentQty: qty,
        label: qty > 1 ? `Caja x${qty}` : 'Caja',
        listAmount: cL,
        wholesaleAmount: cW,
      })
    }

    products.push({ sku, code, name, brandName, contentPerBox, prices, sourceSheet: 'csv', warnings: [] })
  }

  return {
    sourceFileName: fileName,
    sheetUsed: 'csv',
    format: 'rosver-csv-v1' as ElfaParseResult['format'],
    products,
    skipped,
    stats: {
      totalRows: dataLines.length,
      products: products.length,
      withPrices: products.filter((p) => p.prices.length > 0).length,
      warnings: skipped.length,
    },
  }
}

/**
 * Parsea Excel ELFA (lista comercial), JSON Rosver v1 o CSV Rosver v1.
 */
export function parseElfaProductWorkbook(
  buffer: Buffer,
  fileName: string,
): ElfaParseResult {
  if (/\.csv$/i.test(fileName)) {
    return parseRosverCsv(buffer, fileName)
  }
  if (/\.json$/i.test(fileName)) {
    try {
      const text = buffer.toString('utf8').replace(/^\uFEFF/, '')
      return parseRosverImportJson(JSON.parse(text), fileName)
    } catch {
      return {
        sourceFileName: fileName,
        sheetUsed: 'json',
        format: 'rosver-json-v1',
        products: [],
        skipped: [{ row: 0, reason: 'No se pudo leer el JSON' }],
        stats: { totalRows: 0, products: 0, withPrices: 0, warnings: 0 },
      }
    }
  }

  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const preferred = pickImportSheetName(wb)
  if (!preferred) {
    return {
      sourceFileName: fileName,
      sheetUsed: '',
      format: 'elfa-xlsx',
      products: [],
      skipped: [
        {
          row: 0,
          reason:
            'No se encontró una hoja de importación con cabecera CODIGO. Usa la plantilla Rosver (hoja «Tabla de importacion»).',
        },
      ],
      stats: { totalRows: 0, products: 0, withPrices: 0, warnings: 0 },
    }
  }

  const nameOverrides = new Map<string, string>()
  for (const name of wb.SheetNames) {
    if (isHelpSheetName(name)) continue
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {
      header: 1,
      defval: null,
      raw: false,
    }) as unknown[][]
    for (const [k, v] of parseHoja1Names(rows)) {
      if (!nameOverrides.has(k)) nameOverrides.set(k, v)
    }
  }

  const mainRows = XLSX.utils.sheet_to_json(wb.Sheets[preferred], {
    header: 1,
    defval: null,
    raw: false,
  }) as unknown[][]
  const { products, skipped } = parseMainSheet(
    mainRows,
    preferred,
    nameOverrides,
  )

  return {
    sourceFileName: fileName,
    sheetUsed: preferred,
    format: 'elfa-xlsx',
    products,
    skipped,
    stats: {
      totalRows: mainRows.length,
      products: products.length,
      withPrices: products.filter((p) => p.prices.length > 0).length,
      warnings:
        products.reduce((n, p) => n + p.warnings.length, 0) + skipped.length,
    },
  }
}

function isHelpSheetName(name: string) {
  return /notas|ayuda|instrucc|recomend|observ/i.test(name)
}

/** Elige la hoja de datos (ignora notas/ayuda; busca cabecera CODIGO). */
function pickImportSheetName(wb: XLSX.WorkBook): string | null {
  const names = wb.SheetNames
  if (names.length === 0) return null

  const ranked = [...names].sort((a, b) => {
    const score = (n: string) => {
      if (isHelpSheetName(n)) return -100
      if (/import|tabla|productos|elfa|pack/i.test(n)) return 50
      return 0
    }
    return score(b) - score(a)
  })

  for (const name of ranked) {
    if (isHelpSheetName(name)) continue
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {
      header: 1,
      defval: null,
      raw: false,
    }) as unknown[][]
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] ?? []
      for (let c = 0; c < Math.min(row.length, 10); c++) {
        const v = cellStr(row[c]).toUpperCase()
        if (v === 'CODIGO' || v === 'CÓDIGO' || v === 'SKU') return name
      }
    }
  }

  return (
    names.find((n) => /PRODUCTOS|ELFA|PACK|IMPORT|TABLA/i.test(n)) ??
    names.find((n) => !isHelpSheetName(n)) ??
    null
  )
}

export function emptyRosverImportTemplate(): RosverProductsImportFile {
  return {
    version: ROSVER_IMPORT_VERSION,
    format: ROSVER_IMPORT_FORMAT,
    brandName: 'ELFA',
    products: [
      {
        sku: 'ELFA-14M',
        name: 'CINTA EMBALAJE TRANSPARENTE 14 mts',
        contentPerBox: 120,
        prices: [
          {
            unitCode: 'caja',
            contentQty: 120,
            label: 'Caja x120',
            listAmount: 65,
            wholesaleAmount: 60,
          },
          {
            unitCode: 'docena',
            contentQty: 12,
            label: 'Docena',
            listAmount: 8,
            wholesaleAmount: 7,
          },
          {
            unitCode: 'unidad',
            contentQty: 1,
            label: 'Unidad',
            listAmount: 2,
            wholesaleAmount: null,
          },
        ],
      },
      {
        sku: 'FILT20-1K',
        name: 'STRETCH FILM 20" TRANSP. 1KG',
        contentPerBox: 4,
        prices: [
          {
            unitCode: 'caja',
            contentQty: 4,
            label: 'Caja x4',
            listAmount: 45,
            wholesaleAmount: 40,
          },
          {
            unitCode: 'unidad',
            contentQty: 1,
            label: 'Unidad',
            listAmount: 15,
            wholesaleAmount: null,
          },
        ],
      },
    ],
  }
}

/** Un solo ejemplo claro para la plantilla (compatible con el parser). */
const EXCEL_TEMPLATE_EXAMPLE = {
  sku: 'ELFA-14M',
  name: 'CINTA EMBALAJE TRANSPARENTE 14 mts',
  content: 120,
  cajaPub: 65,
  docenaPub: 8,
  unidPub: 2,
  cajaZona: 60,
  docenaZona: 7,
}

const ROSVER_XLS = {
  red: 'FFE30613',
  redDark: 'FF90040D',
  ink: 'FF0D0D0D',
  blue: 'FF1E3A5F',
  soft: 'FFF3F4F6',
  line: 'FFE5E7EB',
  yellow: 'FFF2B705',
  white: 'FFFFFFFF',
  muted: 'FF6B7280',
}

/**
 * Plantilla Excel Rosver — 2 hojas, con color y celdas combinadas.
 * Layout de columnas idéntico al Excel ELFA (B=CODIGO … J=precios).
 */
export async function buildRosverExcelTemplateBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Rosver'
  wb.created = new Date()

  // —— Hoja 1: notas ——
  const notes = wb.addWorksheet('Notas y recomendaciones', {
    properties: { defaultRowHeight: 18 },
    views: [{ showGridLines: false }],
  })
  notes.columns = [
    { width: 12 },
    { width: 20 },
    { width: 72 },
  ]

  notes.mergeCells('A1:C1')
  const nTitle = notes.getCell('A1')
  nTitle.value = 'ROSVER — Notas, observaciones y recomendaciones'
  nTitle.font = { bold: true, color: { argb: ROSVER_XLS.white }, size: 14 }
  nTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.red },
  }
  nTitle.alignment = { vertical: 'middle', horizontal: 'left' }
  notes.getRow(1).height = 28

  notes.mergeCells('A2:C2')
  notes.getCell('A2').value =
    'Esta hoja es solo de ayuda. Los productos se cargan en «Tabla de importacion».'
  notes.getCell('A2').font = { italic: true, color: { argb: ROSVER_XLS.muted } }
  notes.getCell('A2').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.soft },
  }

  const section = (row: number, title: string) => {
    notes.mergeCells(`A${row}:C${row}`)
    const cell = notes.getCell(`A${row}`)
    cell.value = title
    cell.font = { bold: true, color: { argb: ROSVER_XLS.white }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ROSVER_XLS.ink },
    }
  }

  section(4, 'Cómo importar')
  const howTo = [
    ['1', 'Abre la hoja «Tabla de importacion».'],
    ['2', 'La fila marcada como ejemplo puedes editarla o reemplazarla.'],
    ['3', 'Agrega un producto por fila (sin filas vacías en medio).'],
    ['4', 'Guarda como .xlsx y súbelo en Admin → Productos → Importar.'],
    [
      '5',
      'También puedes subir el Excel comercial ELFA (PRODUCTOS ELFA PACK).',
    ],
  ]
  howTo.forEach((pair, i) => {
    const r = 5 + i
    notes.getCell(`A${r}`).value = pair[0]
    notes.getCell(`A${r}`).font = { bold: true, color: { argb: ROSVER_XLS.red } }
    notes.mergeCells(`B${r}:C${r}`)
    notes.getCell(`B${r}`).value = pair[1]
  })

  section(11, 'Columnas de la tabla')
  const colHeaders = ['Columna', 'Nombre', 'Qué poner']
  colHeaders.forEach((h, i) => {
    const cell = notes.getCell(12, i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: ROSVER_XLS.ink } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ROSVER_XLS.line },
    }
  })
  const colsHelp: [string, string, string][] = [
    ['B', 'CODIGO', 'SKU obligatorio. Ej: ELFA-14M (letras + números).'],
    ['C', 'DESCRIPCION', 'Nombre comercial del producto.'],
    ['D', 'NOTA', 'Opcional (grupo o comentario).'],
    ['E', 'CONTENIDO', 'Unidades por caja (ej. 120, 72, 4).'],
    ['F–H', 'VENTA PÚBLICO', 'Precios lista en soles (S/): CAJA, DOCENA, UNID.'],
    ['I–J', 'VENTA ZONA', 'Precios mayorista en soles (S/): CAJA, DOCENA.'],
  ]
  colsHelp.forEach((row, i) => {
    const r = 13 + i
    notes.getCell(`A${r}`).value = row[0]
    notes.getCell(`B${r}`).value = row[1]
    notes.getCell(`C${r}`).value = row[2]
    if (i % 2 === 0) {
      ;['A', 'B', 'C'].forEach((col) => {
        notes.getCell(`${col}${r}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ROSVER_XLS.soft },
        }
      })
    }
  })

  section(20, 'Recomendaciones')
  const tips = [
    'No uses solo números en CODIGO (ej. 28).',
    'Si el SKU ya existe, se actualiza nombre y precios (se conserva el código interno).',
    'DOCENA puede quedar vacío si no aplica.',
    'No borres la fila de cabecera CODIGO / DESCRIPCION / CONTENIDO.',
    'No cambies el orden de columnas F–J.',
    'El Excel ELFA original también se acepta sin convertir a esta plantilla.',
  ]
  tips.forEach((t, i) => {
    const r = 21 + i
    notes.getCell(`A${r}`).value = '•'
    notes.getCell(`A${r}`).font = { color: { argb: ROSVER_XLS.red } }
    notes.mergeCells(`B${r}:C${r}`)
    notes.getCell(`B${r}`).value = t
  })

  // —— Hoja 2: tabla ——
  const sheet = wb.addWorksheet('Tabla de importacion', {
    views: [{ state: 'frozen', ySplit: 5 }],
  })
  sheet.columns = [
    { width: 3 }, // A spacer (mismo layout ELFA)
    { width: 14 }, // B CODIGO
    { width: 42 }, // C DESCRIPCION
    { width: 12 }, // D NOTA
    { width: 12 }, // E CONTENIDO
    { width: 11 }, // F CAJA pub
    { width: 11 }, // G DOCENA pub
    { width: 11 }, // H UNID pub
    { width: 11 }, // I CAJA zona
    { width: 11 }, // J DOCENA zona
  ]

  // Fila 1 — título
  sheet.mergeCells('A1:J1')
  const title = sheet.getCell('A1')
  title.value = 'TABLA DE IMPORTACIÓN — Rosver'
  title.font = { bold: true, color: { argb: ROSVER_XLS.white }, size: 14 }
  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.red },
  }
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(1).height = 30

  // Fila 2 — ayuda
  sheet.mergeCells('A2:J2')
  const help = sheet.getCell('A2')
  help.value =
    'Una fila = un producto. La fila 6 es un ejemplo (fondo amarillo): edítala o borra y agrega los tuyos debajo. Compatible también con el Excel ELFA comercial.'
  help.font = { size: 10, color: { argb: ROSVER_XLS.ink } }
  help.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.soft },
  }
  help.alignment = { vertical: 'middle', wrapText: true }
  sheet.getRow(2).height = 32

  // Fila 3 vacía
  sheet.getRow(3).height = 8

  // Fila 4 — grupos de precios (combinaciones)
  sheet.mergeCells('B4:E4')
  const metaGroup = sheet.getCell('B4')
  metaGroup.value = 'DATOS DEL PRODUCTO'
  metaGroup.font = { bold: true, color: { argb: ROSVER_XLS.white }, size: 10 }
  metaGroup.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.ink },
  }
  metaGroup.alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('F4:H4')
  const pubGroup = sheet.getCell('F4')
  pubGroup.value = 'VENTA PÚBLICO (lista)'
  pubGroup.font = { bold: true, color: { argb: ROSVER_XLS.white }, size: 10 }
  pubGroup.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.blue },
  }
  pubGroup.alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('I4:J4')
  const zonaGroup = sheet.getCell('I4')
  zonaGroup.value = 'VENTA ZONA (mayorista)'
  zonaGroup.font = { bold: true, color: { argb: ROSVER_XLS.white }, size: 10 }
  zonaGroup.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ROSVER_XLS.redDark },
  }
  zonaGroup.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(4).height = 22

  // Fila 5 — cabeceras (el parser busca CODIGO aquí)
  const headers = [
    '',
    'CODIGO',
    'DESCRIPCION',
    'NOTA',
    'CONTENIDO',
    'CAJA',
    'DOCENA',
    'UNID',
    'CAJA',
    'DOCENA',
  ]
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 1)
    cell.value = h
    if (!h) return
    cell.font = { bold: true, color: { argb: ROSVER_XLS.ink }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: ROSVER_XLS.line } },
      left: { style: 'thin', color: { argb: ROSVER_XLS.line } },
      bottom: { style: 'thin', color: { argb: ROSVER_XLS.line } },
      right: { style: 'thin', color: { argb: ROSVER_XLS.line } },
    }
    if (i >= 1 && i <= 4) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1D5DB' },
      }
    } else if (i >= 5 && i <= 7) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' },
      }
    } else if (i >= 8) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' },
      }
    }
  })
  sheet.getRow(5).height = 20

  // Fila 6 — ejemplo (precios en formato moneda PEN)
  const penFmt = '"S/"#,##0.00'
  const e = EXCEL_TEMPLATE_EXAMPLE
  const exampleVals: (string | number | null)[] = [
    '',
    e.sku,
    e.name,
    'ejemplo',
    e.content,
    e.cajaPub,
    e.docenaPub,
    e.unidPub,
    e.cajaZona,
    e.docenaZona,
  ]
  exampleVals.forEach((v, i) => {
    const cell = sheet.getCell(6, i + 1)
    cell.value = v
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: ROSVER_XLS.line } },
      left: { style: 'thin', color: { argb: ROSVER_XLS.line } },
      bottom: { style: 'thin', color: { argb: ROSVER_XLS.line } },
      right: { style: 'thin', color: { argb: ROSVER_XLS.line } },
    }
    if (i === 1) cell.font = { bold: true, color: { argb: ROSVER_XLS.red } }
    if (i === 4) cell.alignment = { horizontal: 'center' }
    // F–J = precios (CAJA / DOCENA / UNID público y zona)
    if (i >= 5 && typeof v === 'number') {
      cell.numFmt = penFmt
      cell.alignment = { horizontal: 'right' }
    }
  })

  // Filas vacías con borde suave + formato PEN en columnas de precio (7–16)
  for (let r = 7; r <= 16; r++) {
    for (let c = 2; c <= 10; c++) {
      const cell = sheet.getCell(r, c)
      cell.border = {
        top: { style: 'hair', color: { argb: ROSVER_XLS.line } },
        left: { style: 'hair', color: { argb: ROSVER_XLS.line } },
        bottom: { style: 'hair', color: { argb: ROSVER_XLS.line } },
        right: { style: 'hair', color: { argb: ROSVER_XLS.line } },
      }
      if (r % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ROSVER_XLS.soft },
        }
      }
      if (c >= 6 && c <= 10) {
        cell.numFmt = penFmt
        cell.alignment = { horizontal: 'right' }
      }
    }
  }

  const out = await wb.xlsx.writeBuffer()
  return Buffer.from(out)
}
