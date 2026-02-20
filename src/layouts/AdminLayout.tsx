import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { HostSidebar, NavigationItem } from "@/components/host/HostSidebar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  LayoutDashboard,
  Users,
  Plane,
  FileText,
  MessageSquare,
  Loader2,
  UsersRound,
} from "lucide-react";

const adminNavigationItems: NavigationItem[] = [
  { name: "Översikt", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Gruppresor", href: "/admin/trips", icon: UsersRound },
  { name: "Resenärer", href: "/admin/users", icon: Users },
  { name: "Fakturering", href: "/admin/invoices", icon: FileText },
  { name: "Meddelanden", href: "/admin/support", icon: MessageSquare },
];

const getPageTitle = (pathname: string): string => {
  if (pathname === "/admin/dashboard") return "Översikt";
  if (pathname === "/admin/trips") return "Gruppresor";
  if (pathname === "/admin/users") return "Resenärer";
  if (pathname === "/admin/invoices") return "Fakturering";
  if (pathname === "/admin/support") return "Meddelanden";
  return "Admin";
};

export default function AdminLayout() {
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background w-full">
      <HostSidebar
        navigationItems={adminNavigationItems}
        logoText="KAISEN"
      />
      <div className="flex-1">
        <div className="container mx-auto pt-8 px-4 lg:px-8">
          <AdminPageHeader
            title={pageTitle}
            navigationItems={adminNavigationItems}
          />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
