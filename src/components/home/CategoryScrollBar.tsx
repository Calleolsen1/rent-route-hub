import { Link } from "react-router-dom";
import { Trophy, Users, Globe, Sun, Crown, Building, Briefcase } from "lucide-react";

const categories = [
  { label: "Sportresor", icon: Trophy, href: "/services/sportresor" },
  { label: "Gruppresor", icon: Users, href: "/group-travel" },
  { label: "Incoming", icon: Globe, href: "/contact" },
  { label: "Weekendresor", icon: Sun, href: "/services/weekend-getaway" },
  { label: "VIP-service", icon: Crown, href: "/services/vip-service" },
  { label: "Konferens", icon: Building, href: "/services/konferens" },
  { label: "Affärsresor", icon: Briefcase, href: "/services/affarsresor" },
];

const CategoryScrollBar = () => {
  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scroll-smooth py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to={cat.href}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-sans font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryScrollBar;
