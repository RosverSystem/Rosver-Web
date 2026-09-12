export type ClientListItem = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  documentType: string | null
  documentNumber: string | null
  status: string
  emailVerified: boolean
  createdAt: string
  viewProductCount: number
  totalViews: number
  lastViewedAt: string | null
  orderCount: number
  quoteCount: number
}

export type ClientInterestProduct = {
  id: string
  slug: string
  name: string
  sku: string
  imageUrl?: string
  rating: number
  price: number | null
  viewCount: number
  lastViewedAt: string
  firstViewedAt: string
}

export type ClientDetail = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  documentType: string | null
  documentNumber: string | null
  status: string
  avatarUrl: string | null
  emailVerified: boolean
  createdAt: string
  frequentProducts: ClientInterestProduct[]
  recentProducts: ClientInterestProduct[]
  orders: {
    id: string
    code: string
    status: string
    totalEstimated: number | null
    createdAt: string
    businessName: string | null
  }[]
  quotes: {
    id: string
    code: string
    status: string
    totalEstimated: number | null
    createdAt: string
    businessName: string | null
    publicSlug: string | null
  }[]
}
