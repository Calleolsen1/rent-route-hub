import { useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Inbox, ShoppingBag, Users, MessageSquare, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/dashboard", label: "Översikt", icon: LayoutDashboard },
  { to: "/admin/inquiries", label: "Förfrågningar", icon: Inbox },
  { to: "/admin/orders", label: "Beställningar", icon: ShoppingBag },
  { to: "/admin/users", label: "Användare", icon: Users },
  { to: "/admin/support", label: "Support", icon: MessageSquare },
  { to: "/admin/content", label: "Innehåll", icon: FileText },
];

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/mitt-kaisen");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !roleLoading && user && !isAdmin) navigate("/");
  }, [user, isAdmin, loading, roleLoading, navigate]);

  if (loading || roleLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Laddar…</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <Link to="/" className="block">
            <span className="text-xl font-light tracking-widest text-primary font-display">
              KAISEN
            </span>
            <p className="text-xs text-muted-foreground mt-1">Admin</p>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 m-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Logga ut
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
