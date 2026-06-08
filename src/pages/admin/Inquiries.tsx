import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type InquiryRow = {
  id: string;
  type: "group" | "conference" | "training_camp" | "vip" | "contact";
  status: "new" | "in_progress" | "quoted" | "won" | "lost";
  name: string;
  email: string;
  phone: string;
  company: string | null;
  group_size: number | null;
  preferred_dates_start: string | null;
  preferred_dates_end: string | null;
  destination: string | null;
  budget_sek: number | null;
  sport_or_topic: string | null;
  message: string;
  source_page: string | null;
  admin_notes: string | null;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

const TYPE_LABEL: Record<InquiryRow["type"], string> = {
  group: "Gruppresa",
  conference: "Konferens",
  training_camp: "Träningsläger",
  vip: "VIP-service",
  contact: "Kontakt",
};

const STATUS_LABEL: Record<InquiryRow["status"], string> = {
  new: "Ny",
  in_progress: "Pågående",
  quoted: "Offert skickad",
  won: "Vunnen",
  lost: "Förlorad",
};

const STATUS_COLOR: Record<InquiryRow["status"], string> = {
  new: "bg-primary text-primary-foreground",
  in_progress: "bg-amber-100 text-amber-900",
  quoted: "bg-sky-100 text-sky-900",
  won: "bg-emerald-100 text-emerald-900",
  lost: "bg-slate-200 text-slate-700",
};

export default function AdminInquiries() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<InquiryRow | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Kunde inte hämta förfrågningar");
    setRows((data as InquiryRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (typeFilter === "all" || r.type === typeFilter) &&
          (statusFilter === "all" || r.status === statusFilter)
      ),
    [rows, typeFilter, statusFilter]
  );

  async function updateRow(id: string, patch: Partial<InquiryRow>) {
    const { error } = await supabase
      .from("inquiries")
      .update(patch)
      .eq("id", id);
    if (error) {
      toast.error("Kunde inte spara");
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (selected?.id === id) setSelected({ ...selected, ...patch });
    toast.success("Sparat");
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display mb-2">Förfrågningar</h1>
          <p className="text-muted-foreground text-sm">
            Grupp, konferens, träningsläger, VIP och allmänna förfrågningar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla typer</SelectItem>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground self-center">
          {filtered.length} av {rows.length} förfrågningar
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Inkommen</th>
              <th className="text-left px-4 py-3 font-medium">Typ</th>
              <th className="text-left px-4 py-3 font-medium">Namn</th>
              <th className="text-left px-4 py-3 font-medium">Kontakt</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                  Laddar...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  Inga förfrågningar än.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("sv-SE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">{TYPE_LABEL[r.type]}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex flex-col leading-tight">
                      <span>{r.email}</span>
                      <span className="text-xs">{r.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_COLOR[r.status]} font-normal`}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost">
                      Öppna
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">
                  {selected.name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLOR[selected.status]}>
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                  <Badge variant="outline">{TYPE_LABEL[selected.type]}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(selected.created_at).toLocaleString("sv-SE")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${selected.email}`}>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3.5 w-3.5 mr-2" /> Mejla
                    </Button>
                  </a>
                  <a href={`tel:${selected.phone.replace(/\s+/g, "")}`}>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3.5 w-3.5 mr-2" /> Ring
                    </Button>
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="E-post" value={selected.email} />
                  <Info label="Telefon" value={selected.phone} />
                  <Info label="Företag" value={selected.company} />
                  <Info
                    label="Gruppstorlek"
                    value={selected.group_size?.toString()}
                  />
                  <Info label="Destination" value={selected.destination} />
                  <Info
                    label="Budget (SEK)"
                    value={selected.budget_sek?.toLocaleString("sv-SE")}
                  />
                  <Info
                    label="Datum (från)"
                    value={selected.preferred_dates_start}
                  />
                  <Info
                    label="Datum (till)"
                    value={selected.preferred_dates_end}
                  />
                  <Info label="Sport / ämne" value={selected.sport_or_topic} />
                  <Info label="Källa" value={selected.source_page} />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Meddelande
                  </Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded">
                    {selected.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) =>
                      updateRow(selected.id, {
                        status: v as InquiryRow["status"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Interna anteckningar
                  </Label>
                  <Textarea
                    rows={4}
                    defaultValue={selected.admin_notes ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (selected.admin_notes ?? "")) {
                        updateRow(selected.id, { admin_notes: e.target.value });
                      }
                    }}
                    placeholder="Anteckningar synliga endast för admin..."
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
