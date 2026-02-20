import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FormInput from "@/components/listing/FormInput";
import FormPhoneInput from "@/components/listing/FormPhoneInput";

interface TravelProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  passport_expiry: string;
}

const TravelProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<TravelProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
    date_of_birth: "",
    nationality: "",
    passport_number: "",
    passport_expiry: "",
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url, date_of_birth, nationality, passport_number, passport_expiry")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          date_of_birth: (data as any).date_of_birth || "",
          nationality: (data as any).nationality || "",
          passport_number: (data as any).passport_number || "",
          passport_expiry: (data as any).passport_expiry || "",
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      setProfile(p => ({ ...p, avatar_url: publicUrl }));
      toast({ title: "Bild uppladdad" });
    } catch {
      toast({ title: "Fel", description: "Kunde inte ladda upp bild", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth || null,
          nationality: profile.nationality || null,
          passport_number: profile.passport_number || null,
          passport_expiry: profile.passport_expiry || null,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Profil sparad" });
    } catch {
      toast({ title: "Fel", description: "Kunde inte spara profil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Personuppgifter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personuppgifter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Byt profilbild
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG – max 5 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Förnamn" value={profile.first_name} onChange={v => setProfile(p => ({ ...p, first_name: v }))} />
            <FormInput label="Efternamn" value={profile.last_name} onChange={v => setProfile(p => ({ ...p, last_name: v }))} />
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">E-post</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>

          <FormPhoneInput label="Telefon" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} />
        </CardContent>
      </Card>

      {/* Resedetaljer / Pass */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resedetaljer & Passuppgifter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Nationalitet</Label>
              <Input
                value={profile.nationality}
                onChange={e => setProfile(p => ({ ...p, nationality: e.target.value }))}
                placeholder="t.ex. Svensk"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Födelsedatum</Label>
              <Input
                type="date"
                value={profile.date_of_birth}
                onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Passnummer</Label>
              <Input
                value={profile.passport_number}
                onChange={e => setProfile(p => ({ ...p, passport_number: e.target.value }))}
                placeholder="t.ex. SE1234567"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Passutgångsdatum</Label>
              <Input
                type="date"
                value={profile.passport_expiry}
                onChange={e => setProfile(p => ({ ...p, passport_expiry: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Dina uppgifter lagras säkert och används enbart för resebokning.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sparar...</> : "Spara profil"}
      </Button>
    </div>
  );
};

export default TravelProfile;
