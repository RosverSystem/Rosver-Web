import type { StoreProductDto } from './catalog-products.js'

export type PdfCategory = {
  id: string
  parentId: string | null
  slug: string
  name: string
  imageUrl?: string | null
  tagline?: string | null
  sortOrder: number
}

export type CatalogPdfSectionHtml = {
  title: string
  slug: string
  tagline: string
  imageUrl: string
  brands: string[]
  subsections: {
    title: string
    slug: string
    products: CatalogPdfProductHtml[]
  }[]
}

export type CatalogPdfProductHtml = {
  name: string
  codeLabel: string
  packKind: string
  packQty: string
  imageUrl: string
}

function absUrl(base: string, url: string | null | undefined): string {
  if (!url?.trim()) return ''
  if (/^https?:\/\//i.test(url)) return url
  const b = base.replace(/\/$/, '')
  return url.startsWith('/') ? `${b}${url}` : `${b}/${url}`
}

function packInfo(p: StoreProductDto): { packKind: string; packQty: string } {
  const packs = p.packagings ?? []
  const def = packs.find((x) => x.isDefault) ?? packs[0]
  if (!def) {
    return {
      packKind: 'Unidad',
      packQty: p.moq > 1 ? `${p.moq} UND` : '1 UND',
    }
  }
  const kind = /caja|paquete|fardo|docena/i.test(def.label)
    ? def.label.split(/\s+/)[0] || 'Paquete'
    : 'Paquete'
  const qty =
    def.contentQty > 1
      ? `${def.contentQty} ${(def.unitName || 'UND').toUpperCase()}`
      : `1 ${(def.unitName || 'UND').toUpperCase()}`
  return { packKind: kind, packQty: qty }
}

function isRoot(c: PdfCategory) {
  return c.parentId == null || c.parentId === ''
}

export function buildHtmlSections(
  categories: PdfCategory[],
  products: StoreProductDto[],
  mediaBase: string,
): CatalogPdfSectionHtml[] {
  const cats = categories
    .slice()
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'),
    )
  const roots = cats.filter(isRoot)
  const byParent = new Map<string, PdfCategory[]>()
  for (const c of cats) {
    if (isRoot(c)) continue
    const list = byParent.get(c.parentId!) ?? []
    list.push(c)
    byParent.set(c.parentId!, list)
  }

  const visible = products
    .filter((p) => p.visible !== false)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const used = new Set<string>()
  const sections: CatalogPdfSectionHtml[] = []

  for (const root of roots) {
    const children = (byParent.get(root.id) ?? []).slice().sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'),
    )
    const subsections: CatalogPdfSectionHtml['subsections'] = []

    for (const child of children) {
      const items = visible.filter((p) => p.category === child.slug)
      if (!items.length) continue
      items.forEach((p) => used.add(p.id))
      subsections.push({
        title: child.name,
        slug: child.slug,
        products: items.map((p) => mapProduct(p, mediaBase)),
      })
    }

    const rootItems = visible.filter((p) => p.category === root.slug)
    if (rootItems.length) {
      rootItems.forEach((p) => used.add(p.id))
      subsections.unshift({
        title: root.name,
        slug: root.slug,
        products: rootItems.map((p) => mapProduct(p, mediaBase)),
      })
    }

    if (!subsections.length) continue

    const brandSet = new Set<string>()
    for (const sub of subsections) {
      for (const p of visible) {
        if (p.category !== sub.slug) continue
        if (p.vendor?.trim()) brandSet.add(p.vendor.trim())
      }
    }

    sections.push({
      title: root.name,
      slug: root.slug,
      tagline: root.tagline ?? '',
      imageUrl: absUrl(mediaBase, root.imageUrl),
      brands: [...brandSet].slice(0, 14),
      subsections,
    })
  }

  const orphan = visible.filter((p) => !used.has(p.id))
  if (orphan.length) {
    sections.push({
      title: 'Otros productos',
      slug: '_otros',
      tagline: '',
      imageUrl: '',
      brands: [],
      subsections: [
        {
          title: 'Varios',
          slug: '_otros',
          products: orphan.map((p) => mapProduct(p, mediaBase)),
        },
      ],
    })
  }

  return sections
}

function mapProduct(p: StoreProductDto, mediaBase: string): CatalogPdfProductHtml {
  const pack = packInfo(p)
  return {
    name: p.name,
    codeLabel: p.codeLabel || String(p.code).padStart(8, '0') || p.sku,
    packKind: pack.packKind,
    packQty: pack.packQty,
    imageUrl: absUrl(mediaBase, p.imageUrl),
  }
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

/**
 * HTML listo para Puppeteer → PDF A4 (print CSS).
 * Carátula general se fusiona aparte (Caratula.pdf).
 */
export function renderCatalogHtml(input: {
  year: number
  sections: CatalogPdfSectionHtml[]
  logoUrl: string
  company: {
    localAddress: string
    phones: string
    email: string
    web: string
    legalName: string
  }
}): string {
  const { year, sections, logoUrl, company } = input
  const webHost = company.web.replace(/^https?:\/\//, '')

  const pages: string[] = []

  for (const sec of sections) {
    const subs = sec.subsections
      .map(
        (sub) => `
        <div class="sub-row">
          <span class="plus">+</span>
          <span class="sub-name">${esc(sub.title)}</span>
        </div>`,
      )
      .join('')

    const brandsBlock =
      sec.brands.length > 0
        ? `<h2 class="brands-title">Marcas en esta categoría</h2>
           <div class="brands-grid">${sec.brands
             .map((b) => `<span class="brand-chip">${esc(b.toUpperCase())}</span>`)
             .join('')}</div>`
        : `<h2 class="brands-title">Rosver</h2>
           <p class="brand-fallback">${esc(sec.tagline || 'Herramientas y soluciones para profesionales')}</p>`

    const heroBg = sec.imageUrl
      ? `style="background-image:url('${esc(sec.imageUrl)}')"`
      : ''

    const circleImg = sec.imageUrl
      ? `<img src="${esc(sec.imageUrl)}" alt="" />`
      : logoUrl
        ? `<img src="${esc(logoUrl)}" alt="" class="logo-in-circle" />`
        : ''

    pages.push(`
      <section class="page category-cover">
        <div class="hero" ${heroBg}>
          <div class="hero-overlay"></div>
          <aside class="side">
            <h1>${esc(sec.title)}</h1>
            <div class="circle">${circleImg}</div>
          </aside>
          <div class="subs">${subs || `<div class="sub-row"><span class="plus">+</span><span class="sub-name">${esc(sec.title)}</span></div>`}</div>
        </div>
        <div class="brands">${brandsBlock}</div>
        <footer class="cover-foot">
          <span>${esc(webHost)} · ${esc(company.phones)}</span>
          <span class="edition">EDICIÓN ${year}</span>
        </footer>
      </section>
    `)

    for (const sub of sec.subsections) {
      for (const group of chunk(sub.products, 4)) {
        const cells = group
          .map((p) => {
            const img = p.imageUrl
              ? `<img src="${esc(p.imageUrl)}" alt="" />`
              : `<div class="no-img">Sin imagen</div>`
            return `
              <article class="cell">
                <h3>${esc(p.name)}${p.name.trim().endsWith(':') ? '' : ':'}</h3>
                <p class="code">CODIGO: ${esc(p.codeLabel)}</p>
                <div class="badge">
                  <span class="b-l">${esc(p.packKind)}</span>
                  <span class="b-r">${esc(p.packQty)}</span>
                </div>
                <div class="img">${img}</div>
              </article>`
          })
          .join('')

        pages.push(`
          <section class="page products-page">
            <header class="top">
              <span class="cat">${esc(sec.title)}</span>
              ${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" alt="Rosver" />` : `<span class="logo-txt">ROSVER</span>`}
              <span class="pill">${esc(sub.title)}</span>
            </header>
            <div class="grid">${cells}</div>
            <footer class="prod-foot">
              <p>${esc(company.localAddress)} · Cel. ${esc(company.phones)} · ${esc(company.email)}</p>
              <div class="bar">
                <span>ROSVER SAC</span>
                <span>${esc(webHost)}</span>
              </div>
            </footer>
          </section>
        `)
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Catálogo Rosver ${year}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: "Segoe UI", system-ui, Helvetica, Arial, sans-serif;
    color: #0D0D0D;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    break-after: page;
    position: relative;
    overflow: hidden;
    background: #fff;
  }
  .page:last-child { page-break-after: auto; }

  /* —— Portada categoría (A4 completa) —— */
  .category-cover {
    display: flex;
    flex-direction: column;
    height: 297mm;
  }
  .hero {
    flex: 1 1 auto;
    min-height: 195mm;
    position: relative;
    background: #0D0D0D center/cover no-repeat;
    display: flex;
  }
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(13,13,13,.35) 0%, rgba(13,13,13,.65) 40%, rgba(13,13,13,.75) 100%);
  }
  .side {
    position: relative;
    z-index: 2;
    width: 52mm;
    background: #E30613;
    padding: 14mm 5mm 10mm;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8mm;
  }
  .side h1 {
    color: #fff;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.2;
    overflow-wrap: anywhere;
    hyphens: manual;
  }
  .circle {
    width: 34mm;
    height: 34mm;
    border-radius: 50%;
    border: 3px solid #fff;
    overflow: hidden;
    background: #0D0D0D;
    flex-shrink: 0;
  }
  .circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .circle img.logo-in-circle {
    object-fit: contain;
    padding: 4mm;
    background: #fff;
  }
  .subs {
    position: relative;
    z-index: 2;
    flex: 1;
    padding: 18mm 12mm 12mm 10mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
  }
  .sub-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 0;
    border-bottom: 1px solid rgba(255,255,255,.4);
  }
  .plus {
    width: 22px;
    height: 22px;
    border: 1.5px solid #fff;
    border-radius: 50%;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .sub-name {
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .brands {
    flex: 0 0 72mm;
    padding: 7mm 10mm 5mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #F3F4F6;
    border-top: 3px solid #E30613;
  }
  .brands-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #0D0D0D;
    margin-bottom: 5mm;
    text-align: center;
  }
  .brands-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    gap: 8px;
  }
  .brand-chip {
    border: 1.5px solid #0D0D0D;
    background: #fff;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    min-width: 28mm;
    text-align: center;
  }
  .brand-fallback {
    color: #6B7280;
    font-size: 13px;
    text-align: center;
  }
  .cover-foot {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4mm 10mm 5mm;
    font-size: 10px;
    color: #6B7280;
    background: #fff;
  }
  .edition {
    background: #E30613;
    color: #fff;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 0.08em;
    padding: 6px 12px;
  }

  /* —— Productos —— */
  .products-page {
    display: flex;
    flex-direction: column;
  }
  .top {
    flex: 0 0 auto;
    height: 14mm;
    background: #0D0D0D;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 7mm;
  }
  .top .cat {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    max-width: 55mm;
  }
  .top .logo { height: 7mm; width: auto; object-fit: contain; }
  .top .logo-txt { font-weight: 800; letter-spacing: 0.15em; font-size: 12px; }
  .top .pill {
    background: #E30613;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    max-width: 55mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .grid {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
    padding: 6mm 7mm 4mm;
    align-content: start;
  }
  .cell {
    border: 1px dashed #FECACA;
    padding: 4mm;
    min-height: 95mm;
  }
  .cell h3 {
    color: #E30613;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    line-height: 1.25;
    min-height: 8mm;
    margin-bottom: 2mm;
  }
  .cell .code {
    font-size: 10px;
    font-weight: 700;
    margin-bottom: 3mm;
  }
  .badge {
    display: inline-flex;
    margin-bottom: 3mm;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid #E30613;
  }
  .b-l {
    background: #E30613;
    color: #fff;
    font-size: 8px;
    font-weight: 800;
    padding: 3px 8px;
  }
  .b-r {
    background: #fff;
    color: #E30613;
    font-size: 8px;
    font-weight: 800;
    padding: 3px 8px;
  }
  .img {
    height: 55mm;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .img img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .no-img { color: #6B7280; font-size: 10px; }
  .prod-foot {
    flex: 0 0 auto;
    margin-top: auto;
  }
  .prod-foot > p {
    text-align: center;
    color: #E30613;
    font-size: 8px;
    padding: 2mm 6mm;
  }
  .prod-foot .bar {
    background: #0D0D0D;
    color: #fff;
    display: flex;
    justify-content: space-around;
    padding: 3mm 6mm;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}
