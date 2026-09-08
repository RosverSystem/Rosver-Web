import { AuthLayout } from '@/app/layout/AuthLayout'
import { AdminDashboardPage } from '@/app/pages/AdminDashboardPage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { AdminShell } from '@/app/layout/AdminShell'
import { Footer } from '@/app/layout/Footer'
import { IntroTransition } from '@/app/layout/IntroTransition'
import { PublicNavbar } from '@/app/layout/PublicNavbar'
import { DocumentTitle } from '@/app/providers/DocumentTitle'
import { SmoothScroll } from '@/app/providers/SmoothScroll'
import {
  AccountLayout,
  AccountOrderDetailPage,
  AccountOrdersPage,
  AccountOverviewPage,
  AccountProfilePage,
} from '@/features/account'
import {
  AdminBrandsPage,
  AdminCategoriesPage,
  AdminOffersPage,
  AdminPriceListPage,
  AdminProductsPage,
} from '@/features/admin-catalog'
import { AdminStoragePage } from '@/features/admin-media'
import { AdminUsersPage } from '@/features/admin-users'
import {
  AuthProvider,
  LoginPage,
  RegisterPage,
  RequireAdmin,
  RequireAuth,
  ResetPasswordPage,
} from '@/features/auth'
import { CartPage, CartProvider, CartCatalogSync } from '@/features/cart'
import {
  CatalogPage,
  CatalogProvider,
  HomePage,
  OffersPage,
  ProductPage,
} from '@/features/catalog'
import { ContactPage } from '@/features/contact'
import { ClientQuotesPage, QuoteRequestPage } from '@/features/quotes'
import { PageTransition } from '@/shared/ui/page-transition'
import { WhatsAppFloatingButton } from '@/shared/ui/whatsapp-floating-button'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

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
                <Route path="producto/:slug" element={<ProductPage />} />
                <Route path="carrito" element={<CartPage />} />
                <Route path="contacto" element={<ContactPage />} />
                <Route path="cotizar" element={<QuoteRequestPage />} />

                <Route path="cuenta" element={<AccountGate />}>
                  <Route index element={<AccountOverviewPage />} />
                  <Route path="pedidos" element={<AccountOrdersPage />} />
                  <Route path="pedidos/:id" element={<AccountOrderDetailPage />} />
                  <Route path="cotizaciones" element={<ClientQuotesPage />} />
                  <Route path="perfil" element={<AccountProfilePage />} />
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
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminShell />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="usuarios" element={<AdminUsersPage />} />
                <Route path="productos" element={<AdminProductsPage />} />
                <Route path="listado-precios" element={<AdminPriceListPage />} />
                <Route path="almacenamiento" element={<AdminStoragePage />} />
                <Route path="categorias" element={<AdminCategoriesPage />} />
                <Route path="marcas" element={<AdminBrandsPage />} />
                <Route
                  path="unidades"
                  element={<Navigate to="/admin/listado-precios" replace />}
                />
                <Route path="ofertas" element={<AdminOffersPage />} />
              </Route>
            </Routes>
          </CatalogProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
