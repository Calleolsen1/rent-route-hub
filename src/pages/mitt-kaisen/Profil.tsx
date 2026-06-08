import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function MittKaisenProfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["mk-profile-full", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sparat" });
      refetch();
    }
  };

  const inputStyle = {
    backgroundColor: "hsl(222 40% 18%)",
    color: "hsl(210 30% 92%)",
    border: "1px solid hsl(222 30% 30%)",
  } as const;

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
      >
        Min profil
      </h1>
      <p className="text-sm mb-10" style={{ color: "hsl(210 20% 70%)" }}>
        Uppdatera dina kontaktuppgifter.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: "hsl(210 20% 70%)" }}>
            E-post
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg px-4 py-3 text-sm opacity-60"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "hsl(210 20% 70%)" }}>
            Förnamn
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "hsl(210 20% 70%)" }}>
            Efternamn
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "hsl(210 20% 70%)" }}>
            Telefon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm"
            style={inputStyle}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-lg text-sm font-medium transition"
          style={{ backgroundColor: "hsl(201 100% 35%)", color: "white" }}
        >
          {saving ? "Sparar…" : "Spara ändringar"}
        </button>
      </div>
    </div>
  );
}
