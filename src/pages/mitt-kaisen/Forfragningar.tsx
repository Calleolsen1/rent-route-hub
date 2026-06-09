import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Inbox, ArrowRight, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type InquiryRow = {
  id: string;
  type: "group" | "conference" | "training_camp" | "vip" | "contact";
  status: "new" | "in_progress" | "quoted" | "won" | "lost";
  destination: string | null;
  preferred_dates_start: string | null;
  preferred_dates_end: string | null;
  group_size: number | null;
  message: string;
  created_at: string;
};

const TYPE_LABEL: Record<InquiryRow["type"], string> = {
  group: "Gruppresa",
  conference: "Konferens",
  training_camp: "Träningsläger",
  vip: "VIP-service",
  contact: "Allmän förfrågan",
};

const STATUS: Record<InquiryRow["status"], { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  new: { label: "Mottagen", icon: Inbox, color: "hsl(210 20% 70%)" },
  in_progress: { label: "Pågående", icon: Clock, color: "hsl(40 90% 55%)" },
  quoted: { label: "Offert skickad", icon: FileText, color: "hsl(201 100% 55%)" },
  won: { label: "Bokad", icon: CheckCircle2, color: "hsl(140 60% 50%)" },
  lost: { label: "Avslutad", icon: XCircle, color: "hsl(210 20% 50%)" },
};

const C = {
  text: "hsl(210 30% 92%)",
  textMuted: "hsl(210 20% 70%)",
  textDim: "hsl(210 20% 60%)",
  bgCard: "hsl(222 40% 18%)",
  bgCardBorder: "hsl(222 40% 25%)",
  accent: "hsl(201 100% 35%)",
};

export default function MittKaisenForfragningar() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("inquiries")
        .select("id, type, status, destination, preferred_dates_start, preferred_dates_end, group_size, message, created_at")
        .order("created_at", { ascending: false });
      setRows((data as InquiryRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: C.text, fontFamily: "'Cormorant Garamond', serif" }}
      >
        Mina förfrågningar
      </h1>
      <p className="text-sm mb-10" style={{ color: C.textMuted }}>
        Här ser du dina skickade förfrågningar och deras status.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: C.textMuted }}>Laddar...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: C.bgCard }}>
          <Inbox className="h-12 w-12 mx-auto mb-4" style={{ color: "hsl(201 100% 55%)" }} />
          <p className="text-lg font-light" style={{ color: C.text }}>
            Inga förfrågningar än
          </p>
          <p className="text-sm mt-2 mb-6" style={{ color: C.textMuted }}>
            När du skickar en förfrågan via vårt kontaktformulär hittar du den här.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full"
            style={{ backgroundColor: "hsl(201 100% 45%)", color: "white" }}
          >
            Skicka förfrågan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const StatusIcon = STATUS[r.status].icon;
            return (
              <div
                key={r.id}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-20px_rgba(3,15,35,0.7)] relative overflow-hidden"
                style={{
                  backgroundColor: C.bgCard,
                  border: `1px solid ${C.bgCardBorder}`,
                }}
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider" style={{ color: C.textMuted }}>
                      {TYPE_LABEL[r.type]}
                    </p>
                    <p className="text-xs mt-1" style={{ color: C.textDim }}>
                      {new Date(r.created_at).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0"
                    style={{ backgroundColor: STATUS[r.status].color, color: "white" }}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {STATUS[r.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm" style={{ color: C.text }}>
                  {r.destination && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Destination</p>
                      <p>{r.destination}</p>
                    </div>
                  )}
                  {r.group_size != null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Antal personer</p>
                      <p>{r.group_size}</p>
                    </div>
                  )}
                  {r.preferred_dates_start && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Önskat datum</p>
                      <p>
                        {r.preferred_dates_start}
                        {r.preferred_dates_end ? ` → ${r.preferred_dates_end}` : ""}
                      </p>
                    </div>
                  )}
                </div>
                <div
                  className="border-t pt-3 text-sm"
                  style={{ color: C.text, borderColor: C.bgCardBorder }}
                >
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textDim }}>
                    Ditt meddelande
                  </p>
                  <p className="whitespace-pre-wrap">{r.message}</p>
                </div>
                {r.status === "quoted" && (
                  <p className="mt-3 text-xs" style={{ color: STATUS.quoted.color }}>
                    En offert har skickats till din e-post — kolla din inkorg.
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-xs text-center mt-6" style={{ color: C.textDim }}>
            Behöver du skicka en till? <Link to="/contact" className="underline">Nytt formulär</Link>
          </p>
        </div>
      )}
    </div>
  );
}
