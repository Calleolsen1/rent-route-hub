import { Plane, CreditCard, MessageSquare, User, Settings, LogOut, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const defaultNavigation: NavigationItem[] = [
  { name: "Mina resor", href: "/guest/dashboard", icon: Plane },
  { name: "Betalningar", href: "/guest/payments", icon: CreditCard },
  { name: "Meddelanden", href: "/guest/inbox", icon: MessageSquare },
  { name: "Min profil", href: "/guest/profile", icon: User },
  { name: "Inställningar", href: "/guest/settings", icon: Settings },
];

interface SidebarContentProps {
  onNavigate?: () => void;
  navigationItems?: NavigationItem[];
}

const KaisenLogo = () => (
  <Link to="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
    <div className="flex flex-col leading-none">
      <span className="font-display text-xl font-semibold tracking-wide text-foreground">
        KAISEN
      </span>
      <span className="text-[9px] tracking-[0.25em] text-primary font-sans font-medium uppercase">
        Travel Group
      </span>
    </div>
  </Link>
);

const SidebarContent = ({
  onNavigate,
  navigationItems = defaultNavigation,
}: SidebarContentProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <KaisenLogo />

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent/50"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Log Out */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full justify-center gap-3 mt-auto rounded-full border-border bg-transparent text-foreground hover:bg-accent/30"
      >
        <LogOut className="h-5 w-5" />
        <span>Logga ut</span>
      </Button>
    </div>
  );
};

interface SidebarProps {
  navigationItems?: NavigationItem[];
}

export const GuestSidebar = ({ navigationItems }: SidebarProps) => {
  return (
    <aside className="hidden lg:flex lg:flex-col w-[260px] flex-shrink-0 h-screen border-r border-border bg-card p-7 sticky top-0">
      <SidebarContent navigationItems={navigationItems} />
    </aside>
  );
};

export const MobileGuestSidebar = ({ navigationItems }: SidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-7 bg-card">
        <SidebarContent
          onNavigate={() => setOpen(false)}
          navigationItems={navigationItems}
        />
      </SheetContent>
    </Sheet>
  );
};
