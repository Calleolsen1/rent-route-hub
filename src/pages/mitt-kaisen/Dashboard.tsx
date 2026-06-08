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
      description: "Se dina kommande matcher och Grand Prix",
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
            className="rounded-xl p-6 transition hover:opacity-90"
            style={{ backgroundColor: "hsl(222 40% 18%)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "hsl(201 100% 35%)" }}
            >
              <c.icon className="h-5 w-5 text-white" />
            </div>
            <h2
              className="text-xl font-light mb-1"
              style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
            >
              {c.title}
            </h2>
            <p className="text-sm" style={{ color: "hsl(210 20% 70%)" }}>
              {c.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
