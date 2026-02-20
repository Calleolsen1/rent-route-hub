import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  full_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User | null;
}

const NATIONALITIES = [
  "Afghanistan","Albanien","Algeriet","Andorra","Angola","Antigua och Barbuda",
  "Argentina","Armenien","Australien","Österrike","Azerbajdzjan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Vitryssland","Belgien","Belize","Benin","Bhutan",
  "Bolivia","Bosnien och Hercegovina","Botswana","Brasilien","Brunei","Bulgarien",
  "Burkina Faso","Burundi","Kambodja","Kamerun","Kanada","Kap Verde",
  "Centralafrikanska republiken","Tchad","Chile","Kina","Colombia","Komorerna",
  "Kongo","Costa Rica","Kroatien","Kuba","Cypern","Tjeckien","Danmark",
  "Djibouti","Dominica","Dominikanska republiken","Ecuador","Egypten",
  "El Salvador","Eritrea","Estland","Etiopien","Fiji","Finland","Frankrike",
  "Gabon","Gambia","Georgien","Tyskland","Ghana","Grekland","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Ungern",
  "Island","Indien","Indonesien","Iran","Irak","Irland","Israel","Italien",
  "Jamaica","Japan","Jordanien","Kazakstan","Kenya","Kiribati","Kosovo",
  "Kuwait","Kirgizistan","Laos","Lettland","Libanon","Lesotho","Liberia",
  "Libyen","Liechtenstein","Litauen","Luxemburg","Madagaskar","Malawi",
  "Malaysia","Maldiverna","Mali","Malta","Marshallöarna","Mauretanien",
  "Mauritius","Mexiko","Mikronesien","Moldavien","Monaco","Mongoliet",
  "Montenegro","Marocko","Moçambique","Myanmar","Namibia","Nauru","Nepal",
  "Nederländerna","Nya Zeeland","Nicaragua","Niger","Nigeria","Nordkorea",
  "Nordmakedonien","Norge","Oman","Pakistan","Palau","Panama","Papua Nya Guinea",
  "Paraguay","Peru","Filippinerna","Polen","Portugal","Qatar","Rumänien",
  "Ryssland","Rwanda","Saint Kitts och Nevis","Saint Lucia",
  "Saint Vincent och Grenadinerna","Samoa","San Marino","São Tomé och Príncipe",
  "Saudiarabien","Senegal","Serbien","Seychellerna","Sierra Leone","Singapore",
  "Slovakien","Slovenien","Salomonöarna","Somalia","Sydafrika","Sydkorea",
  "Sydsudan","Spanien","Sri Lanka","Sudan","Surinam","Swaziland","Sverige",
  "Schweiz","Syrien","Taiwan","Tadzjikistan","Tanzania","Thailand","Östtimor",
  "Togo","Tonga","Trinidad och Tobago","Tunisien","Turkiet","Turkmenistan",
  "Tuvalu","Uganda","Ukraina","Förenade Arabemiraten","Storbritannien",
  "USA","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam",
  "Jemen","Zambia","Zimbabwe"
];

export function AdminEditUserDialog({ open, onOpenChange, user }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    nationality: "",
    date_of_birth: "",
  });

  // Load full profile when dialog opens
  useEffect(() => {
    if (open && user) {
      supabase
        .from("profiles")
        .select("first_name, last_name, phone, nationality, date_of_birth")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setForm({
              first_name: data.first_name || "",
              last_name: data.last_name || "",
              phone: data.phone || "",
              nationality: data.nationality || "",
              date_of_birth: data.date_of_birth || "",
            });
          }
        });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.first_name.trim() || null,
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim() || null,
          nationality: form.nationality || null,
          date_of_birth: form.date_of_birth || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Sparat!", description: `Personuppgifter för ${user.full_name} har uppdaterats.` });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Fel", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Redigera personuppgifter
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Förnamn</Label>
              <Input value={form.first_name} onChange={set("first_name")} placeholder="Förnamn" />
            </div>
            <div className="space-y-1.5">
              <Label>Efternamn</Label>
              <Input value={form.last_name} onChange={set("last_name")} placeholder="Efternamn" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={form.phone} onChange={set("phone")} placeholder="+46 70 000 00 00" />
          </div>

          <div className="space-y-1.5">
            <Label>Nationalitet</Label>
            <Select value={form.nationality} onValueChange={(v) => setForm((f) => ({ ...f, nationality: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Välj nationalitet..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {NATIONALITIES.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Födelsedatum</Label>
            <Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sparar...</> : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
