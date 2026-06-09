import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { DemoProvider } from "./contexts/DemoContext";
import { SuspendedUserListener } from "./components/SuspendedUserListener";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import MittKaisenLogin from "./pages/MittKaisenLogin";
import MittKaisenResetPassword from "./pages/MittKaisenResetPassword";
import MittKaisenLayout from "./layouts/MittKaisenLayout";
import MittKaisenDashboard from "./pages/mitt-kaisen/Dashboard";
import MittKaisenBiljetter from "./pages/mitt-kaisen/Biljetter";
import MittKaisenForfragningar from "./pages/mitt-kaisen/Forfragningar";
import MittKaisenFakturor from "./pages/mitt-kaisen/Fakturor";
import MittKaisenProfil from "./pages/mitt-kaisen/Profil";
import FAQ from "./pages/FAQ";
import HelpCenter from "./pages/HelpCenter";
import Support from "./pages/Support";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminInquiries from "./pages/admin/Inquiries";
import AdminOrders from "./pages/admin/Orders";
import UsersManagement from "./pages/admin/UsersManagement";
import AdminSupport from "./pages/admin/Support";
import ContentManagementPage from "./pages/admin/ContentManagement";
import AdminTickets from "./pages/admin/Tickets";
import AdminBanners from "./pages/admin/Banners";
import AdminMarkupDefaults from "./pages/admin/MarkupDefaults";
import AdminNavigation from "./pages/admin/Navigation";
import AdminDiagnostics from "./pages/admin/Diagnostics";
import AdminMediaLibrary from "./pages/admin/MediaLibrary";
import Integritetspolicy from "./pages/Integritetspolicy";
import Anvandarvillkor from "./pages/Anvandarvillkor";
import CookieConsent from "./components/CookieConsent";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import GroupTravel from "./pages/GroupTravel";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Sportresor from "./pages/services/Sportresor";
import Affarsresor from "./pages/services/Affarsresor";
import WeekendGetaway from "./pages/services/WeekendGetaway";
import Konferens from "./pages/services/Konferens";
import VIPService from "./pages/services/VIPService";
import Traningslager from "./pages/services/Traningslager";
import TeamPage from "./pages/services/TeamPage";
import F1RacePage from "./pages/services/F1RacePage";
import EventDetail from "./pages/EventDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import QuotePage from "./pages/Quote";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoProvider>
            <SuspendedUserListener />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/sportresor" element={<Sportresor />} />
              <Route path="/services/sportresor/fotboll/:team" element={<TeamPage />} />
              <Route path="/services/sportresor/f1/:race" element={<F1RacePage />} />
              <Route path="/services/traningslager" element={<Traningslager />} />
              <Route path="/services/affarsresor" element={<Affarsresor />} />
              <Route path="/services/weekend-getaway" element={<WeekendGetaway />} />
              <Route path="/services/konferens" element={<Konferens />} />
              <Route path="/services/vip-service" element={<VIPService />} />
              <Route path="/group-travel" element={<GroupTravel />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/support" element={<Support />} />
              <Route path="/integritetspolicy" element={<Integritetspolicy />} />
              <Route path="/anvandarvillkor" element={<Anvandarvillkor />} />
              <Route path="/forgot-password" element={<><Navbar /><ForgotPassword /></>} />

              {/* Ticket flow */}
              <Route path="/sport/event/:id" element={<EventDetail />} />
              <Route path="/checkout/:orderId" element={<Checkout />} />
              <Route path="/order/:orderId" element={<OrderConfirmation />} />

              {/* Custom-trip quote flow */}
              <Route path="/quote/:token" element={<QuotePage />} />


              {/* Admin portal */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminOverview />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="markup-defaults" element={<AdminMarkupDefaults />} />
                <Route path="diagnostics" element={<AdminDiagnostics />} />
                <Route path="media" element={<AdminMediaLibrary />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="content" element={<ContentManagementPage />} />
                <Route path="navigation" element={<AdminNavigation />} />
              </Route>

              {/* Mitt Kaisen — public routes */}
              <Route path="/mitt-kaisen" element={<MittKaisenLogin />} />
              <Route path="/mitt-kaisen/aterstall-losenord" element={<MittKaisenResetPassword />} />
              {/* Mitt Kaisen — protected routes */}
              <Route path="/mitt-kaisen" element={<MittKaisenLayout />}>
                <Route path="dashboard" element={<MittKaisenDashboard />} />
                <Route path="biljetter" element={<MittKaisenBiljetter />} />
                <Route path="forfragningar" element={<MittKaisenForfragningar />} />
                <Route path="fakturor" element={<MittKaisenFakturor />} />
                <Route path="profil" element={<MittKaisenProfil />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<><Navbar /><NotFound /></>} />
            </Routes>
            <CookieConsent />
          </DemoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
