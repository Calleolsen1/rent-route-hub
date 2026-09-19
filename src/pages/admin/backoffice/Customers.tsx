import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";

export type Customer = {
  id: string;
  customer_number: string | null;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  org_number: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  billing_email: string | null;
  billing_address: string | null;
  notes: string | null;
};

const empty: Partial<Customer> = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  org_number: "",
  address_line1: "",
  postal_code: "",
  city: "",
  country: "Sverige",
  billing_email: "",
  billing_address: "",
  notes: "",
};

export default function BackofficeCustomers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Customer>>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Customer[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.company_name, r.contact_name, r.email, r.phone, r.city, r.customer_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const save = async () => {
    if (!draft.contact_name?.trim() || !draft.email?.trim()) {
      toast.error("Kontaktperson och e-post krävs");
      return;
    }
    setSaving(true);
    const payload = {
      company_name: draft.company_name || null,
      contact_name: draft.contact_name,
      email: draft.email,
      phone: draft.phone || null,
      org_number: draft.org_number || null,
      address_line1: draft.address_line1 || null,
      postal_code: draft.postal_code || null,
      city: draft.city || null,
      country: draft.country || null,
      billing_email: draft.billing_email || null,
      billing_address: draft.billing_address || null,
      notes: draft.notes || null,
    };
    const { error } = draft.id
      ? await supabase.from("customers").update(payload).eq("id", draft.id)
      : await supabase.from("customers").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Kunden sparad");
    setOpen(false);
    setDraft(empty);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort kunden?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Kunden borttagen");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Kunder</h1>
          <p className="text-sm text-muted-foreground">
            Lag, företag och privatkunder med kontakt- och faktureringsuppgifter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök kund…"
              className="w-56 pl-9"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setDraft(empty);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ny kund
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Inga kunder ännu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Kundnr</th>
                <th className="px-4 py-3">Kund</th>
                <th className="px-4 py-3">Kontakt</th>
                <th className="px-4 py-3">E-post</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Ort</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{r.customer_number}</td>
                  <td className="px-4 py-3 font-medium">{r.company_name || "-"}</td>
                  <td className="px-4 py-3">{r.contact_name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.phone || "-"}</td>
                  <td className="px-4 py-3">{r.city || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDraft(r);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Redigera kund" : "Ny kund"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Företag / lag"
              value={draft.company_name ?? ""}
              onChange={(e) => setDraft({ ...draft, company_name: e.target.value })}
            />
            <Input
              placeholder="Kontaktperson *"
              value={draft.contact_name ?? ""}
              onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
            />
            <Input
              placeholder="E-post *"
              value={draft.email ?? ""}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <Input
              placeholder="Telefon"
              value={draft.phone ?? ""}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <Input
              placeholder="Organisationsnummer"
              value={draft.org_number ?? ""}
              onChange={(e) => setDraft({ ...draft, org_number: e.target.value })}
            />
            <Input
              placeholder="Adress"
              value={draft.address_line1 ?? ""}
              onChange={(e) => setDraft({ ...draft, address_line1: e.target.value })}
            />
            <Input
              placeholder="Postnummer"
              value={draft.postal_code ?? ""}
              onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })}
            />
            <Input
              placeholder="Ort"
              value={draft.city ?? ""}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            />
            <Input
              placeholder="Land"
              value={draft.country ?? ""}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            />
            <Input
              placeholder="Faktura-e-post"
              value={draft.billing_email ?? ""}
              onChange={(e) => setDraft({ ...draft, billing_email: e.target.value })}
            />
            <Textarea
              className="sm:col-span-2"
              rows={2}
              placeholder="Fakturaadress"
              value={draft.billing_address ?? ""}
              onChange={(e) => setDraft({ ...draft, billing_address: e.target.value })}
            />
            <Textarea
              className="sm:col-span-2"
              rows={3}
              placeholder="Anteckningar"
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
