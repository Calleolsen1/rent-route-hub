import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, FileText, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function MittKaisenDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["mk-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const firstName = profile?.first_name || "";

  const cards = [
    {
      to: "/mitt-kaisen/biljetter",
      icon: Ticket,
      title: "Mina biljetter",
      description: "Se dina kommande matcher och GP",
    },
    {
      to: "/mitt-kaisen/fakturor",
      icon: FileText,
      title: "Fakturor",
      description: "Kvitton och betalningshistorik",
    },
    {
      to: "/mitt-kaisen/profil",
      icon: UserIcon,
      title: "Min profil",
      description: "Kontaktuppgifter och pass",
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
      >
        Välkommen{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-sm mb-10" style={{ color: "hsl(210 20% 70%)" }}>
        Här hittar du allt om dina resor och biljetter.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(3,15,35,0.9)] relative overflow-hidden"
            style={{
              backgroundColor: "hsl(222 40% 18%)",
              border: "1px solid hsl(222 40% 25%)",
            }}
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(to right, transparent, hsl(201 100% 55% / 0.6), transparent)" }}
            />
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: "linear-gradient(135deg, hsl(201 100% 40%), hsl(201 100% 28%))",
                boxShadow: "0 8px 24px -8px hsl(201 100% 35% / 0.6)",
              }}
            >
              <c.icon className="h-5 w-5 text-white" />
            </div>
            <h2
              className="text-2xl font-light mb-1"
              style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
            >
              {c.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(210 20% 70%)" }}>
              {c.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
