export { HomePage } from './ui/HomePage'
export { CatalogPage } from './ui/CatalogPage'
export { OffersPage } from './ui/OffersPage'
export { RankingPage } from './ui/RankingPage'
export { ProductPage } from './ui/ProductPage'
export { ProductCard } from './ui/ProductCard'
export { CategoryHomeCard } from './ui/CategoryHomeCard'
export { CatalogProvider, useCatalog } from './model/catalog-store'
export {
  filterProductsByQuery,
  findExactSkuProduct,
  normalizeSearchText,
  productMatchesQuery,
} from './model/catalog-search'
export { CATEGORIES, PRODUCTS, getWholesalePrice } from './model/mocks'
export type { Category, Product, ProductPackaging, ProductSpec } from './model/mocks'
export type {
  OfferCombo,
  OfferComboItem,
  OfferComboKind,
} from './model/offer-combo'
