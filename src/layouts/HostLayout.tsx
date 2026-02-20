import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { HostSidebar } from "@/components/host/HostSidebar";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { Loader2 } from "lucide-react";

// Map routes to Swedish page titles
const getPageTitle = (pathname: string): string => {
  if (pathname === "/host/dashboard") return "Översikt";
  if (pathname === "/host/group") return "Min grupp";
  if (pathname === "/host/invoicing") return "Fakturering";
  if (pathname === "/host/inbox") return "Meddelanden";
  return "Översikt";
};

const HostLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: roleLoading } = useUserRole();

  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    if (!roleLoading) {
      if (!user) {
        navigate("/");
      }
    }
  }, [user, roleLoading, navigate]);

  if (roleLoading) {
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
      <HostSidebar logoText="Kaisen" />
      <div className="flex-1">
        <div className="container mx-auto px-4 pt-8 lg:px-8">
          <HostPageHeader title={pageTitle} />
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default HostLayout;
