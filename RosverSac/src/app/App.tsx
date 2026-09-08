import { AuthLayout } from '@/app/layout/AuthLayout'
import { AdminDashboardPage } from '@/app/pages/AdminDashboardPage'
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
  AdminCategoriesPage,
  AdminOffersPage,
  AdminProductsPage,
} from '@/features/admin-catalog'
import {
  AuthProvider,
  LoginPage,
  RegisterPage,
  RequireAdmin,
  RequireAuth,
} from '@/features/auth'
import { CartPage, CartProvider } from '@/features/cart'
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
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'

function PublicLayout() {
  return (
    <div className="min-h-dvh max-w-[100vw] bg-white">
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
              </Route>

              <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
              <Route path="/registro" element={<AuthLayout><RegisterPage /></AuthLayout>} />

              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminShell />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="productos" element={<AdminProductsPage />} />
                <Route path="categorias" element={<AdminCategoriesPage />} />
                <Route path="ofertas" element={<AdminOffersPage />} />
              </Route>
            </Routes>
          </CatalogProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
