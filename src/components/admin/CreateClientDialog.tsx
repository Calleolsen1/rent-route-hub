import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setDone(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
        }),
      }
    );

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({
        title: "Fel",
        description: result.error || "Något gick fel, försök igen.",
        variant: "destructive",
      });
      return;
    }

    setDone(true);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-14 w-14 mx-auto mb-5 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Konto skapat!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Ett välkomstmejl med inloggningsinstruktioner har skickats till{" "}
              <strong>{email}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              Kunden kan logga in via <strong>Mitt Kaisen</strong> och klicka "Glömt lösenord?" för att sätta sitt eget lösenord.
            </p>
            <Button className="mt-6" onClick={() => handleClose(false)}>
              Stäng
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="h-5 w-5 text-primary" />
                <DialogTitle>Skapa kundkonto</DialogTitle>
              </div>
              <DialogDescription>
                Skapar ett Mitt Kaisen-konto och skickar ett välkomstmejl automatiskt.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Förnamn</Label>
                  <Input
                    id="first-name"
                    placeholder="Anna"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Efternamn</Label>
                  <Input
                    id="last-name"
                    placeholder="Lindqvist"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anna@foretag.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="rounded-lg p-3 bg-muted text-xs text-muted-foreground leading-relaxed">
                Kunden får ett välkomstmejl med en länk till Mitt Kaisen. De sätter sitt eget lösenord via "Glömt lösenord?".
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => handleClose(false)} className="flex-1">
                  Avbryt
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Skapar...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Skapa & skicka mejl
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
