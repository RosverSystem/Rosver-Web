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
  AdminProductFormPage,
  AdminProductsPage,
} from '@/features/admin-catalog'
import { AdminContentPage } from '@/features/admin-content'
import { AdminLeadsPage } from '@/features/admin-leads'
import { AdminOrdersPage } from '@/features/admin-orders'
import { AdminUsersPage } from '@/features/admin-users'
import { LoginPage, RegisterPage } from '@/features/auth'
import { CartPage, CartProvider } from '@/features/cart'
import { CatalogPage, HomePage, OffersPage, ProductPage } from '@/features/catalog'
import { ContactPage } from '@/features/contact'
import { AdminQuotesPage, ClientQuotesPage, QuoteRequestPage } from '@/features/quotes'
import { PageTransition } from '@/shared/ui/page-transition'
import { WhatsAppFloatingButton } from '@/shared/ui/whatsapp-floating-button'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh max-w-[100vw] overflow-x-hidden bg-white">
      <PublicNavbar />
      <PageTransition>{children}</PageTransition>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <DocumentTitle />
        <SmoothScroll />
        <IntroTransition />
        <Routes>
        {/* Catálogo / marketing (público) */}
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

        {/* Área cliente */}
        <Route path="/cuenta" element={<PublicLayout><AccountLayout /></PublicLayout>}>
          <Route index element={<AccountOverviewPage />} />
          <Route path="pedidos" element={<AccountOrdersPage />} />
          <Route path="pedidos/:id" element={<AccountOrderDetailPage />} />
          <Route path="cotizaciones" element={<ClientQuotesPage />} />
          <Route path="perfil" element={<AccountProfilePage />} />
        </Route>

        {/* Gestión (/admin) */}
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="productos" element={<AdminProductsPage />} />
          <Route path="productos/nuevo" element={<AdminProductFormPage />} />
          <Route path="productos/:id" element={<AdminProductFormPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
          <Route path="contenido" element={<AdminContentPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="cotizaciones" element={<AdminQuotesPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
        </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}
