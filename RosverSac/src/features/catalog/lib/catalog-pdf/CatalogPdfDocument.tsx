import { ROSVER_COMPANY } from '@/shared/lib/company'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { PDF } from './colors'
import type {
  CatalogPdfPayload,
  CatalogPdfProduct,
  CatalogPdfSection,
  CatalogPdfSubsection,
} from './types'

/** Catálogo comercial estilo importador — paleta Rosver (rojo/negro). Sin índice. */
const s = StyleSheet.create({
  catCover: {
    fontFamily: 'Helvetica',
    padding: 0,
    backgroundColor: PDF.surface,
  },
  catHero: {
    height: 340,
    backgroundColor: PDF.ink,
    position: 'relative',
    overflow: 'hidden',
  },
  catHeroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  catHeroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,13,13,0.55)',
  },
  catSide: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 150,
    backgroundColor: PDF.red,
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  catSideTitle: {
    color: PDF.surface,
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  catSideCircle: {
    marginTop: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: PDF.surface,
    overflow: 'hidden',
    backgroundColor: PDF.ink,
  },
  catSideImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  catSubs: {
    position: 'absolute',
    left: 170,
    top: 48,
    right: 36,
  },
  catSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.35)',
  },
  catSubPlus: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: PDF.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catSubPlusText: {
    color: PDF.surface,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: -1,
  },
  catSubName: {
    color: PDF.surface,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  brandBand: {
    paddingVertical: 22,
    paddingHorizontal: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 120,
  },
  brandChip: {
    borderWidth: 1,
    borderColor: PDF.line,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  brandChipText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: PDF.ink,
    letterSpacing: 0.6,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 28,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverFooterText: {
    fontSize: 8,
    color: PDF.muted,
  },
  coverEdition: {
    backgroundColor: PDF.red,
    color: PDF.surface,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    paddingVertical: 5,
    paddingHorizontal: 10,
    letterSpacing: 1,
  },
  productsPage: {
    fontFamily: 'Helvetica',
    backgroundColor: PDF.surface,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  topBar: {
    height: 44,
    backgroundColor: PDF.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topBarCat: {
    color: PDF.surface,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    maxWidth: 160,
  },
  topBarLogo: {
    width: 64,
    height: 22,
    objectFit: 'contain',
  },
  topBarSub: {
    backgroundColor: PDF.red,
    color: PDF.surface,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    maxWidth: 160,
  },
  gridWrap: {
    flexGrow: 1,
    paddingTop: 16,
    paddingHorizontal: 22,
    paddingBottom: 70,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cell: {
    width: '48%',
    minHeight: 248,
    padding: 10,
    borderWidth: 0.75,
    borderColor: '#FECACA',
    borderStyle: 'dashed',
  },
  cellTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: PDF.red,
    textTransform: 'uppercase',
    marginBottom: 4,
    minHeight: 26,
    lineHeight: 1.25,
  },
  cellCode: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: PDF.ink,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  badgeLeft: {
    backgroundColor: PDF.red,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  badgeLeftText: {
    color: PDF.surface,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  badgeRight: {
    backgroundColor: PDF.surface,
    borderWidth: 1,
    borderColor: PDF.red,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  badgeRightText: {
    color: PDF.red,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  cellImgWrap: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PDF.soft,
  },
  cellImg: {
    width: '100%',
    height: 148,
    objectFit: 'contain',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pageFooterInfo: {
    fontSize: 7,
    color: PDF.red,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 22,
    lineHeight: 1.35,
  },
  pageFooterBar: {
    backgroundColor: PDF.ink,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pageFooterBarText: {
    color: PDF.surface,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
})

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function ProductCell({ p }: { p: CatalogPdfProduct }) {
  return (
    <View style={s.cell} wrap={false}>
      <Text style={s.cellTitle}>
        {p.name}
        {p.name.trim().endsWith(':') ? '' : ':'}
      </Text>
      <Text style={s.cellCode}>CODIGO: {p.codeLabel}</Text>
      <View style={s.badgeRow}>
        <View style={s.badgeLeft}>
          <Text style={s.badgeLeftText}>{p.packKind}</Text>
        </View>
        <View style={s.badgeRight}>
          <Text style={s.badgeRightText}>{p.packQty}</Text>
        </View>
      </View>
      <View style={s.cellImgWrap}>
        {p.imageDataUrl ? (
          <Image src={p.imageDataUrl} style={s.cellImg} />
        ) : (
          <Text style={{ fontSize: 8, color: PDF.muted }}>Sin imagen</Text>
        )}
      </View>
    </View>
  )
}

function CategoryCoverPage({
  section,
  logoDataUrl,
  year,
}: {
  section: CatalogPdfSection
  logoDataUrl: string | null
  year: number
}) {
  const co = ROSVER_COMPANY
  return (
    <Page size="A4" style={s.catCover}>
      <View style={s.catHero}>
        {section.imageDataUrl ? (
          <Image src={section.imageDataUrl} style={s.catHeroBg} />
        ) : null}
        <View style={s.catHeroOverlay} />
        <View style={s.catSide}>
          <Text style={s.catSideTitle}>{section.title}</Text>
          <View style={s.catSideCircle}>
            {section.imageDataUrl ? (
              <Image src={section.imageDataUrl} style={s.catSideImg} />
            ) : logoDataUrl ? (
              <Image src={logoDataUrl} style={s.catSideImg} />
            ) : null}
          </View>
        </View>
        <View style={s.catSubs}>
          {section.subsections.map((sub) => (
            <View key={sub.slug} style={s.catSubRow}>
              <View style={s.catSubPlus}>
                <Text style={s.catSubPlusText}>+</Text>
              </View>
              <Text style={s.catSubName}>{sub.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.brandBand}>
        {section.brands.length > 0 ? (
          section.brands.map((b) => (
            <View key={b} style={s.brandChip}>
              <Text style={s.brandChipText}>{b.toUpperCase()}</Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 9, color: PDF.muted, marginTop: 12 }}>
            {section.tagline || 'Productos seleccionados para profesionales'}
          </Text>
        )}
      </View>

      <View style={s.coverFooter}>
        <Text style={s.coverFooterText}>
          {co.web.replace(/^https?:\/\//, '')} · {co.phones}
        </Text>
        <Text style={s.coverEdition}>EDICIÓN {year}</Text>
      </View>
    </Page>
  )
}

function ProductsPage({
  categoryTitle,
  subsection,
  products,
  logoDataUrl,
}: {
  categoryTitle: string
  subsection: CatalogPdfSubsection
  products: CatalogPdfProduct[]
  logoDataUrl: string | null
}) {
  const co = ROSVER_COMPANY
  const rows = chunk(products, 2)
  return (
    <Page size="A4" style={s.productsPage}>
      <View style={s.topBar} fixed>
        <Text style={s.topBarCat}>{categoryTitle}</Text>
        {logoDataUrl ? (
          <Image src={logoDataUrl} style={s.topBarLogo} />
        ) : (
          <Text
            style={{
              color: PDF.surface,
              fontFamily: 'Helvetica-Bold',
              fontSize: 10,
            }}
          >
            ROSVER
          </Text>
        )}
        <Text style={s.topBarSub}>{subsection.title}</Text>
      </View>

      <View style={s.gridWrap}>
        {rows.map((row, ri) => (
          <View key={ri} style={s.gridRow} wrap={false}>
            {row.map((p) => (
              <ProductCell key={p.id} p={p} />
            ))}
            {row.length === 1 ? <View style={{ width: '48%' }} /> : null}
          </View>
        ))}
      </View>

      <View style={s.pageFooter} fixed>
        <Text style={s.pageFooterInfo}>
          {co.localAddress} · Cel. {co.phones} · {co.email}
        </Text>
        <View style={s.pageFooterBar}>
          <Text style={s.pageFooterBarText}>ROSVER SAC</Text>
          <Text style={s.pageFooterBarText}>
            {co.web.replace(/^https?:\/\//, '')}
          </Text>
          <Text
            style={s.pageFooterBarText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </View>
    </Page>
  )
}

export function CatalogPdfDocument({ data }: { data: CatalogPdfPayload }) {
  const co = ROSVER_COMPANY
  const pages: ReactElement[] = []

  for (const section of data.sections) {
    pages.push(
      <CategoryCoverPage
        key={`cover-${section.slug}`}
        section={section}
        logoDataUrl={data.logoDataUrl}
        year={data.year}
      />,
    )
    for (const sub of section.subsections) {
      chunk(sub.products, 4).forEach((pageProducts, pi) => {
        pages.push(
          <ProductsPage
            key={`prod-${sub.slug}-${pi}`}
            categoryTitle={section.title}
            subsection={sub}
            products={pageProducts}
            logoDataUrl={data.logoDataUrl}
          />,
        )
      })
    }
  }

  return (
    <Document
      title={`Catálogo Rosver ${data.year}`}
      author={co.legalName}
      subject="Catálogo de productos por categoría"
      creator="Rosver Web"
    >
      {pages}
    </Document>
  )
}
