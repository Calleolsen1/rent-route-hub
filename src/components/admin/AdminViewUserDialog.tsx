import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


interface UserBasic {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  primary_role: string;
  first_name?: string;
  last_name?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserBasic | null;
}

interface FullProfile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  about: string | null;
  verified: boolean | null;
  created_at: string;
}

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || <span className="text-muted-foreground italic">-</span>}</p>
  </div>
);

export function AdminViewUserDialog({ open, onOpenChange, user }: Props) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      supabase
        .from("profiles")
        .select("first_name, last_name, phone, nationality, date_of_birth, passport_number, passport_expiry, about, verified, created_at")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personuppgifter
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="mt-1 capitalize text-xs">{user?.primary_role}</Badge>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Personal info */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Förnamn" value={profile?.first_name} />
              <Field label="Efternamn" value={profile?.last_name} />
              <Field label="Telefon" value={profile?.phone} />
              <Field label="Nationalitet" value={profile?.nationality} />
              <Field
                label="Födelsedatum"
                value={profile?.date_of_birth ?? null}
              />
              <Field
                label="Registrerad"
                value={profile?.created_at ? svDateFull(profile.created_at) : null}
              />
            </div>

            <div className="h-px bg-border" />

            {/* Passport */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Passuppgifter</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Passnummer" value={profile?.passport_number} />
                <Field
                  label="Passutgångsdatum"
                  value={profile?.passport_expiry ? svDateFull(profile.passport_expiry) : null}
                />
              </div>
            </div>

            {profile?.about && (
              <>
                <div className="h-px bg-border" />
                <Field label="Om mig" value={profile.about} />
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
