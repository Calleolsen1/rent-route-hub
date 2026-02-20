import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GuestSidebar } from "@/components/guest/GuestSidebar";
import { GuestPageHeader } from "@/components/guest/GuestPageHeader";
import { Loader2 } from "lucide-react";

// Routes where the page itself handles the header (title + tabs inline)
const SELF_HEADER_ROUTES = ["/guest/dashboard", "/guest/trips"];

// Map routes to page titles
const getPageTitle = (pathname: string): string => {
  if (pathname === "/guest/bookings") return "Bokningar";
  if (pathname === "/guest/payments") return "Betalningar";
  if (pathname === "/guest/inbox") return "Meddelanden";
  if (pathname === "/guest/profile") return "Min profil";
  if (pathname === "/guest/settings") return "Inställningar";
  return "";
};

const GuestLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isSelfHeader = SELF_HEADER_ROUTES.includes(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background w-full">
      <GuestSidebar />
      <div className="flex-1">
        {!isSelfHeader && (
          <div className="container mx-auto px-4 pt-8 pb-0 lg:px-8">
            <GuestPageHeader title={pageTitle} />
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default GuestLayout;
