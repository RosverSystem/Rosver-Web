import { AuthLayout } from '@/app/layout/AuthLayout'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { AdminShell } from '@/app/layout/AdminShell'
import { Footer } from '@/app/layout/Footer'
import { IntroTransition } from '@/app/layout/IntroTransition'
import { PublicNavbar } from '@/app/layout/PublicNavbar'
import { DocumentTitle } from '@/app/providers/DocumentTitle'
import { SmoothScroll } from '@/app/providers/SmoothScroll'
import {
  AccountCompanyPage,
  AccountLayout,
  AccountOrderDetailPage,
  AccountOrdersPage,
  AccountOverviewPage,
  AccountProfilePage,
  AccountReviewsPage,
} from '@/features/account'
import {
  AuthProvider,
  LoginPage,
  RegisterPage,
  RequireAdmin,
  RequireAuth,
  ResetPasswordPage,
} from '@/features/auth'
import { CartPage, CartProvider, CartCatalogSync, PublicOrderPage } from '@/features/cart'
import {
  CatalogPage,
  CatalogProvider,
  HomePage,
  OffersPage,
  ProductPage,
  RankingPage,
} from '@/features/catalog'
import { ContactPage } from '@/features/contact'
import { ComplaintsBookPage } from '@/features/complaints-book'
import { ClientQuotesPage, PublicQuotePage, QuoteRequestPage, AdminQuoteWorkspacePage } from '@/features/quotes'
import { AdminOrdersPage, AdminOrderWorkspacePage } from '@/features/admin-orders'
import { PageTransition } from '@/shared/ui/page-transition'
import { ToastProvider } from '@/shared/ui/toast-provider'
import { WhatsAppFloatingButton } from '@/shared/ui/whatsapp-floating-button'
import { CatalogPdfFloatingButton } from '@/shared/ui/catalog-pdf-floating-button'
import { lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

// ERP admin: se carga solo al entrar a /admin, no en el bundle inicial de la tienda.
const AdminDashboardPage = lazy(() =>
  import('@/app/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminAnalyticsPage = lazy(() =>
  import('@/features/admin-analytics').then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
)
const AdminClientsPage = lazy(() =>
  import('@/features/admin-clients').then((m) => ({
    default: m.AdminClientsPage,
  })),
)
const AdminClientDetailPage = lazy(() =>
  import('@/features/admin-clients').then((m) => ({
    default: m.AdminClientDetailPage,
  })),
)
const AdminBrandsPage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({ default: m.AdminBrandsPage })),
)
const AdminCategoriesPage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({ default: m.AdminCategoriesPage })),
)
const AdminOffersPage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({ default: m.AdminOffersPage })),
)
const AdminPriceListPage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({ default: m.AdminPriceListPage })),
)
const AdminSpecsPage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({ default: m.AdminSpecsPage })),
)
const AdminProductsPage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({ default: m.AdminProductsPage })),
)
const AdminProductWorkspacePage = lazy(() =>
  import('@/features/admin-catalog').then((m) => ({
    default: m.AdminProductWorkspacePage,
  })),
)
const AdminStoragePage = lazy(() =>
  import('@/features/admin-media').then((m) => ({ default: m.AdminStoragePage })),
)
const AdminUsersPage = lazy(() =>
  import('@/features/admin-users').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminRolesPage = lazy(() =>
  import('@/features/admin-users').then((m) => ({ default: m.AdminRolesPage })),
)
const AdminComplaintsPage = lazy(() =>
  import('@/features/complaints-book').then((m) => ({
    default: m.AdminComplaintsPage,
  })),
)
const AdminQuotesPage = lazy(() =>
  import('@/features/quotes').then((m) => ({ default: m.AdminQuotesPage })),
)
const AdminLeadsPage = lazy(() =>
  import('@/features/admin-leads').then((m) => ({ default: m.AdminLeadsPage })),
)
const AdminContentPage = lazy(() =>
  import('@/features/admin-content').then((m) => ({ default: m.AdminContentPage })),
)

function PublicLayout() {
  return (
    <div className="min-h-dvh max-w-[100vw] bg-white">
      <CartCatalogSync />
      <PublicNavbar />
      <div className="max-w-[100vw] overflow-x-hidden">
        <PageTransition>
          <Outlet />
        </PageTransition>
        <Footer />
      </div>
      <CatalogPdfFloatingButton />
      <WhatsAppFloatingButton />
    </div>
  )
}

function AccountGate() {
  return (
    <RequireAuth>
      <AccountLayout />
    </RequireAuth>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <CatalogProvider>
              <DocumentTitle />
              <SmoothScroll />
              <IntroTransition />
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="catalogo" element={<CatalogPage />} />
                  <Route path="catalogo/:categorySlug" element={<CatalogPage />} />
                  <Route path="ofertas" element={<OffersPage />} />
                  <Route path="ranking" element={<RankingPage />} />
                  <Route path="producto/:slug" element={<ProductPage />} />
                  <Route path="carrito" element={<CartPage />} />
                  <Route path="contacto" element={<ContactPage />} />
                  <Route
                    path="libro-reclamaciones"
                    element={<ComplaintsBookPage />}
                  />
                  <Route path="cotizar" element={<QuoteRequestPage />} />
                  <Route path="c/:slug" element={<PublicQuotePage />} />
                  <Route path="p/:slug" element={<PublicOrderPage />} />

                  <Route path="cuenta" element={<AccountGate />}>
                    <Route index element={<AccountOverviewPage />} />
                    <Route path="pedidos" element={<AccountOrdersPage />} />
                    <Route path="pedidos/:id" element={<AccountOrderDetailPage />} />
                    <Route path="cotizaciones" element={<ClientQuotesPage />} />
                    <Route path="reseñas" element={<AccountReviewsPage />} />
                    <Route path="perfil" element={<AccountProfilePage />} />
                    <Route path="empresa" element={<AccountCompanyPage />} />
                    <Route path="resenas" element={<AccountReviewsPage />} />
                  </Route>

                  {/* Catch-all: sin esto, cualquier URL sin match (typo, link
                      roto, o un sub-path de /admin o /cuenta que no existe)
                      renderiza una pantalla en blanco total. */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
                <Route path="/registro" element={<AuthLayout><RegisterPage /></AuthLayout>} />
                <Route
                  path="/recuperar"
                  element={<AuthLayout><ResetPasswordPage /></AuthLayout>}
                />

                <Route
                  path="/admin/cotizaciones/vista"
                  element={
                    <RequireAdmin>
                      <AdminQuoteWorkspacePage />
                    </RequireAdmin>
                  }
                />

                <Route
                  path="/admin/pedidos/vista"
                  element={
                    <RequireAdmin>
                      <AdminOrderWorkspacePage />
                    </RequireAdmin>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminShell />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="analitica" element={<AdminAnalyticsPage />} />
                  <Route path="clientes" element={<AdminClientsPage />} />
                  <Route path="clientes/:id" element={<AdminClientDetailPage />} />
                  <Route path="usuarios" element={<AdminUsersPage />} />
                  <Route path="productos" element={<AdminProductsPage />} />
                  <Route
                    path="productos/nuevo"
                    element={<AdminProductWorkspacePage />}
                  />
                  <Route
                    path="productos/:id"
                    element={<AdminProductWorkspacePage />}
                  />
                  <Route path="listado-precios" element={<AdminPriceListPage />} />
                  <Route path="especificaciones" element={<AdminSpecsPage />} />
                  <Route path="almacenamiento" element={<AdminStoragePage />} />
                  <Route path="categorias" element={<AdminCategoriesPage />} />
                  <Route path="marcas" element={<AdminBrandsPage />} />
                  <Route
                    path="unidades"
                    element={<Navigate to="/admin/listado-precios" replace />}
                  />
                  <Route path="ofertas" element={<AdminOffersPage />} />
                  <Route path="roles" element={<AdminRolesPage />} />
                  <Route path="leads" element={<AdminLeadsPage />} />
                  <Route path="contenido" element={<AdminContentPage />} />
                  <Route path="cotizaciones" element={<AdminQuotesPage />} />
                  <Route path="pedidos" element={<AdminOrdersPage />} />
                  <Route path="reclamaciones" element={<AdminComplaintsPage />} />
                </Route>
              </Routes>
            </CatalogProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
