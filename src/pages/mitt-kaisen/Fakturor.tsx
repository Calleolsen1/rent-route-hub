import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  total_paid_sek: number | null;
  total_sek: number;
  paid_at: string | null;
  created_at: string;
};

export default function MittKaisenFakturor() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, invoice_number, total_paid_sek, total_sek, paid_at, created_at")
        .eq("user_id", user.id)
        .in("status", ["paid", "fulfilled"])
        .order("paid_at", { ascending: false });
      setRows((data as unknown as InvoiceRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const handleDownload = async (orderId: string) => {
    setBusyId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Inte inloggad");
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectRef}.supabase.co/functions/v1/get-invoice?orderId=${orderId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const html = await res.text();
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte hämta fakturan");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
      >
        Fakturor
      </h1>
      <p className="text-sm mb-10" style={{ color: "hsl(210 20% 70%)" }}>
        Kvitton och betalningshistorik.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(210 20% 70%)" }}>Laddar...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: "hsl(222 40% 18%)" }}>
          <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: "hsl(201 100% 55%)" }} />
          <p className="text-lg font-light" style={{ color: "hsl(210 30% 92%)" }}>
            Inga fakturor ännu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-20px_rgba(3,15,35,0.7)]"
              style={{
                backgroundColor: "hsl(222 40% 18%)",
                border: "1px solid hsl(222 40% 25%)",
              }}
            >
              <div>
                <p className="text-sm" style={{ color: "hsl(210 30% 92%)" }}>
                  {o.invoice_number ?? `#${o.id.slice(0, 8).toUpperCase()}`}
                </p>
                <p className="text-xs mt-1" style={{ color: "hsl(210 20% 60%)" }}>
                  {new Date(o.paid_at ?? o.created_at).toLocaleDateString("sv-SE")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ color: "hsl(210 30% 92%)" }}>
                  {formatSek(o.total_paid_sek ?? o.total_sek)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === o.id || !o.invoice_number}
                  onClick={() => handleDownload(o.id)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {o.invoice_number ? "Visa faktura" : "Bearbetas"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
