import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";

export default function MittKaisenLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast({
        title: "Inloggning misslyckades",
        description: "Kontrollera din e-post och ditt lösenord.",
        variant: "destructive",
      });
      return;
    }

    navigate("/mitt-kaisen/dashboard");
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/mitt-kaisen/aterstall-losenord`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Fel",
        description: "Kunde inte skicka återställningsmejl. Försök igen.",
        variant: "destructive",
      });
      return;
    }

    setResetSent(true);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "hsl(222 50% 12%)" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ backgroundColor: "hsl(222 50% 9%)" }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(38 65% 38%)" }}>
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-2xl font-light tracking-widest" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
              MITT KAISEN
            </span>
          </div>

          <div className="mt-8">
            <h1 className="text-5xl font-light leading-tight mb-6" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
              Din personliga<br />reseportal
            </h1>
            <p className="text-lg font-light leading-relaxed" style={{ color: "hsl(215 15% 65%)" }}>
              Följ dina resor, se fakturor och håll koll på alla detaljer — allt på ett ställe.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm" style={{ color: "hsl(215 15% 45%)" }}>
            © 2025 Kaisen Travel Group
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(38 65% 38%)" }}>
              <span className="text-white font-bold">K</span>
            </div>
            <span className="text-xl font-light tracking-widest" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
              MITT KAISEN
            </span>
          </div>

          {!resetMode ? (
            <>
              <h2 className="text-3xl font-light mb-2" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
                Välkommen tillbaka
              </h2>
              <p className="text-sm mb-10" style={{ color: "hsl(215 15% 55%)" }}>
                Logga in med dina uppgifter för att fortsätta
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" style={{ color: "hsl(215 15% 65%)" }}>
                    E-postadress
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(215 15% 45%)" }} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.se"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 border-0 focus-visible:ring-1"
                      style={{
                        backgroundColor: "hsl(222 40% 18%)",
                        color: "hsl(38 80% 85%)",
                        borderColor: "hsl(222 35% 22%)",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" style={{ color: "hsl(215 15% 65%)" }}>
                    Lösenord
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(215 15% 45%)" }} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 border-0 focus-visible:ring-1"
                      style={{
                        backgroundColor: "hsl(222 40% 18%)",
                        color: "hsl(38 80% 85%)",
                        borderColor: "hsl(222 35% 22%)",
                      }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-medium tracking-wide"
                  style={{ backgroundColor: "hsl(38 65% 38%)", color: "white" }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Loggar in..." : "Logga in"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setResetMode(true)}
                  className="text-sm hover:underline transition-all"
                  style={{ color: "hsl(38 65% 58%)" }}
                >
                  Glömt lösenord?
                </button>
              </div>

              <p className="text-xs text-center mt-8" style={{ color: "hsl(215 15% 40%)" }}>
                Fått inbjudan? Klicka "Glömt lösenord?" för att sätta ditt lösenord.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-light mb-2" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
                {resetSent ? "Mejl skickat!" : "Återställ lösenord"}
              </h2>

              {resetSent ? (
                <div className="mt-6">
                  <p className="text-sm leading-relaxed mb-8" style={{ color: "hsl(215 15% 65%)" }}>
                    Vi har skickat ett återställningsmail till <strong style={{ color: "hsl(38 80% 85%)" }}>{email}</strong>.
                    Klicka på länken i mejlet för att sätta ett nytt lösenord.
                  </p>
                  <button
                    onClick={() => { setResetMode(false); setResetSent(false); }}
                    className="text-sm hover:underline"
                    style={{ color: "hsl(38 65% 58%)" }}
                  >
                    ← Tillbaka till inloggning
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-10" style={{ color: "hsl(215 15% 55%)" }}>
                    Ange din e-postadress så skickar vi en återställningslänk.
                  </p>
                  <form onSubmit={handleResetRequest} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" style={{ color: "hsl(215 15% 65%)" }}>
                        E-postadress
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(215 15% 45%)" }} />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="din@email.se"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 border-0 focus-visible:ring-1"
                          style={{
                            backgroundColor: "hsl(222 40% 18%)",
                            color: "hsl(38 80% 85%)",
                            borderColor: "hsl(222 35% 22%)",
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11"
                      style={{ backgroundColor: "hsl(38 65% 38%)", color: "white" }}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Skicka återställningslänk
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setResetMode(false)}
                      className="text-sm hover:underline"
                      style={{ color: "hsl(38 65% 58%)" }}
                    >
                      ← Tillbaka till inloggning
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
