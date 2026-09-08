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
import { CatalogPage, HomePage, OffersPage, ProductPage } from '@/features/catalog'
import { ContactPage } from '@/features/contact'
import { ClientQuotesPage, QuoteRequestPage } from '@/features/quotes'
import { PageTransition } from '@/shared/ui/page-transition'
import { WhatsAppFloatingButton } from '@/shared/ui/whatsapp-floating-button'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh max-w-[100vw] bg-white">
      {/* overflow fuera del header: si el wrapper clippea, el menú de sesión se corta */}
      <PublicNavbar />
      <div className="max-w-[100vw] overflow-x-hidden">
        <PageTransition>{children}</PageTransition>
        <Footer />
      </div>
      <WhatsAppFloatingButton />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <DocumentTitle />
          <SmoothScroll />
          <IntroTransition />
          <Routes>
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/catalogo" element={<PublicLayout><CatalogPage /></PublicLayout>} />
            <Route path="/catalogo/:categorySlug" element={<PublicLayout><CatalogPage /></PublicLayout>} />
            <Route path="/ofertas" element={<PublicLayout><OffersPage /></PublicLayout>} />
            <Route path="/producto/:slug" element={<PublicLayout><ProductPage /></PublicLayout>} />
            <Route path="/carrito" element={<PublicLayout><CartPage /></PublicLayout>} />
            <Route path="/contacto" element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/cotizar" element={<PublicLayout><QuoteRequestPage /></PublicLayout>} />
            <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/registro" element={<AuthLayout><RegisterPage /></AuthLayout>} />

            <Route
              path="/cuenta"
              element={
                <RequireAuth>
                  <PublicLayout>
                    <AccountLayout />
                  </PublicLayout>
                </RequireAuth>
              }
            >
              <Route index element={<AccountOverviewPage />} />
              <Route path="pedidos" element={<AccountOrdersPage />} />
              <Route path="pedidos/:id" element={<AccountOrderDetailPage />} />
              <Route path="cotizaciones" element={<ClientQuotesPage />} />
              <Route path="perfil" element={<AccountProfilePage />} />
            </Route>

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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
