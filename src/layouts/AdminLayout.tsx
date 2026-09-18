import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Inbox, ShoppingBag, Users, MessageSquare, FileText, LogOut, Ticket, Image, Percent, Stethoscope, Images, Menu, UserSquare2, Eye, EyeOff, Building2, Plane, Receipt, BarChart3, Contact2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AdminPreviewPane from "@/components/admin/AdminPreviewPane";

const navItems = [
  { to: "/admin/dashboard", label: "Översikt", icon: LayoutDashboard },
  { to: "/admin/inquiries", label: "Förfrågningar", icon: Inbox },
  { to: "/admin/orders", label: "Beställningar", icon: ShoppingBag },
  { to: "/admin/tickets", label: "Biljetter & Stripe", icon: Ticket },
  { to: "/admin/banners", label: "Hero-banners", icon: Image },
  { to: "/admin/team", label: "Team", icon: UserSquare2 },
  { to: "/admin/media", label: "Bildbibliotek", icon: Images },
  { to: "/admin/markup-defaults", label: "Påslag", icon: Percent },
  { to: "/admin/diagnostics", label: "Diagnostik", icon: Stethoscope },
  { to: "/admin/users", label: "Användare", icon: Users },
  { to: "/admin/support", label: "Support", icon: MessageSquare },
  { to: "/admin/content", label: "Innehåll", icon: FileText },
  { to: "/admin/navigation", label: "Navigation", icon: Menu },
];

/** Back office — kunder, hotell, bokningar, fakturor och rapporter. */
const backofficeItems = [
  { to: "/admin/backoffice/bokningar", label: "Bokningar", icon: Plane },
  { to: "/admin/backoffice/kunder", label: "Kunder", icon: Contact2 },
  { to: "/admin/backoffice/hotell", label: "Hotell", icon: Building2 },
  { to: "/admin/backoffice/fakturor", label: "Fakturor", icon: Receipt },
  { to: "/admin/backoffice/rapporter", label: "Rapporter", icon: BarChart3 },
];

/**
 * Which public page the live preview should open on for a given admin page.
 * Falls back to the start page.
 */
const PREVIEW_FOR_ROUTE: Record<string, string> = {
  "/admin/banners": "/",
  "/admin/content": "/",
  "/admin/navigation": "/",
  "/admin/team": "/about",
  "/admin/tickets": "/services/sportresor",
  "/admin/media": "/",
};

/** Admin pages where a live preview actually adds value — preview auto-opens there. */
const PREVIEW_ENABLED = Object.keys(PREVIEW_FOR_ROUTE);

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewRelevant = PREVIEW_ENABLED.some((p) => pathname.startsWith(p));
  const previewRoute = PREVIEW_FOR_ROUTE[pathname] ?? "/";

  // Auto-open the preview on content pages, close it elsewhere.
  useEffect(() => {
    setPreviewOpen(previewRelevant);
  }, [previewRelevant]);

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
    <div className="h-screen flex bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <Link to="/" className="block">
            <span className="text-xl font-light tracking-widest text-primary font-display">
              KAISEN
            </span>
            <p className="text-xs text-muted-foreground mt-1">Admin</p>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto p-3 space-y-1">
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

      <div className="flex flex-1 min-w-0">
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="flex items-center justify-end gap-2 border-b border-border bg-card/60 px-4 py-2">
            <Button
              variant={previewOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewOpen((v) => !v)}
            >
              {previewOpen ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {previewOpen ? "Dölj förhandsvisning" : "Live-förhandsvisning"}
            </Button>
          </div>
          <Outlet />
        </main>

        {previewOpen && (
          <div className="hidden xl:block w-[46%] max-w-[840px] shrink-0 border-l border-border">
            <AdminPreviewPane initialRoute={previewRoute} onClose={() => setPreviewOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
