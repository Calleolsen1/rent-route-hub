import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthDialog } from "@/components/AuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isHost } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Tjänster", to: "/services" },
    { label: "Gruppresor", to: "/group-travel" },
    { label: "Om oss", to: "/about" },
    { label: "Kontakt", to: "/contact" },
  ];

  return (
    <>
      <nav className="border-b border-border/40 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl md:text-2xl font-semibold tracking-wide text-foreground">
                  KAISEN
                </span>
                <span className="text-[9px] md:text-[10px] tracking-[0.25em] text-primary font-sans font-medium uppercase">
                  Travel Group
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Konto</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mitt konto</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/guest/dashboard">Mina resor</Link>
                    </DropdownMenuItem>
                    {isHost && (
                      <DropdownMenuItem asChild>
                        <Link to="/host/dashboard">Host-panel</Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard">Admin-panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logga ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none px-6 tracking-wider text-xs"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Logga in
                </Button>
              )}

              <Link to="/contact">
                <Button
                  size="sm"
                  className="hidden md:flex rounded-none px-6 tracking-wider text-xs bg-primary hover:bg-primary/90"
                >
                  Planera din resa
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="block text-sm font-medium tracking-wide py-2 text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t">
              {user ? (
                <>
                  <Link to="/guest/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-none">Mina resor</Button>
                  </Link>
                  <Button variant="ghost" className="w-full rounded-none" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Logga ut
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full rounded-none border-primary text-primary" onClick={() => { setAuthDialogOpen(true); setMobileOpen(false); }}>
                  Logga in
                </Button>
              )}
              <Link to="/contact" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-none bg-primary">Planera din resa</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Navbar;
