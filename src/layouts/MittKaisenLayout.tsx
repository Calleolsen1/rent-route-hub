import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Ticket,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/mitt-kaisen/dashboard", label: "Översikt", icon: LayoutDashboard },
  { to: "/mitt-kaisen/biljetter", label: "Mina biljetter", icon: Ticket },
  { to: "/mitt-kaisen/forfragningar", label: "Förfrågningar", icon: Inbox },
  { to: "/mitt-kaisen/fakturor", label: "Fakturor", icon: FileText },
  { to: "/mitt-kaisen/profil", label: "Min Profil", icon: User },
];

export default function MittKaisenLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/mitt-kaisen");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/mitt-kaisen");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(222 50% 12%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(201 100% 35%)" }} />
      </div>
    );
  }

  if (!user) return null;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile && "pt-8")}>
      {/* Logo */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "hsl(201 100% 35%)" }}>
          <span className="text-white font-bold">K</span>
        </div>
        <span className="text-lg font-light tracking-widest" style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}>
          MITT KAISEN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-light transition-all",
                active
                  ? "text-white"
                  : "hover:opacity-80"
              )}
              style={
                active
                  ? { backgroundColor: "hsl(201 100% 35%)", color: "white" }
                  : { color: "hsl(215 15% 65%)" }
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="px-3 pb-2">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-light transition-all hover:opacity-80"
          style={{ color: "hsl(215 15% 50%)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till siten
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 pb-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-light transition-all hover:opacity-80"
          style={{ color: "hsl(215 15% 50%)" }}
        >
          <LogOut className="h-4 w-4" />
          Logga ut
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 80% -10%, hsl(201 100% 18% / 0.35), transparent 60%), radial-gradient(900px 500px at -10% 100%, hsl(222 60% 16% / 0.6), transparent 55%), hsl(222 50% 9%)",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30"
        style={{ backgroundColor: "hsl(222 50% 10%)" }}
      >
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-16"
        style={{ backgroundColor: "hsl(222 50% 10%)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(201 100% 35%)" }}>
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-base font-light tracking-widest" style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}>
            MITT KAISEN
          </span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: "hsl(210 30% 92%)" }}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div
            className="w-64 flex-shrink-0"
            style={{ backgroundColor: "hsl(222 50% 10%)" }}
          >
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
