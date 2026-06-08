import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CheckCircle } from "lucide-react";

export default function MittKaisenResetPassword() {
 const [password, setPassword] = useState("");
 const [confirm, setConfirm] = useState("");
 const [loading, setLoading] = useState(false);
 const [done, setDone] = useState(false);
 const [sessionReady, setSessionReady] = useState(false);
 const { toast } = useToast();
 const navigate = useNavigate();

 useEffect(() => {
 // Handle both invite tokens and password recovery tokens from URL hash
 const hash = window.location.hash;
 const params = new URLSearchParams(hash.replace("#", "?"));
 const accessToken = params.get("access_token");
 const refreshToken = params.get("refresh_token");

 if (accessToken && refreshToken) {
 // Set session from URL tokens (works for both invite and recovery links)
 supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
 setSessionReady(true);
 });
 }

 const { data: listener } = supabase.auth.onAuthStateChange((event) => {
 if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "USER_UPDATED") {
 setSessionReady(true);
 }
 });
 return () => listener.subscription.unsubscribe();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (password !== confirm) {
 toast({ title: "Lösenorden matchar inte", variant: "destructive" });
 return;
 }
 if (password.length < 8) {
 toast({ title: "Lösenordet måste vara minst 8 tecken", variant: "destructive" });
 return;
 }

 setLoading(true);
 const { error } = await supabase.auth.updateUser({ password });
 setLoading(false);

 if (error) {
 toast({ title: "Fel", description: error.message, variant: "destructive" });
 return;
 }

 setDone(true);
 setTimeout(() => navigate("/mitt-kaisen/dashboard"), 2500);
 };

 return (
 <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "hsl(222 50% 12%)" }}>
 <div className="w-full max-w-md">
 <div className="flex items-center gap-3 mb-12">
 <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(38 65% 38%)" }}>
 <span className="text-white font-bold">K</span>
 </div>
 <span className="text-xl font-light tracking-widest" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
 MITT KAISEN
 </span>
 </div>

 {done ? (
 <div className="text-center">
 <CheckCircle className="h-16 w-16 mx-auto mb-6" style={{ color: "hsl(38 65% 38%)" }} />
 <h2 className="text-3xl font-light mb-3" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
 Lösenord uppdaterat!
 </h2>
 <p style={{ color: "hsl(215 15% 55%)" }}>Du skickas nu till din portal...</p>
 </div>
 ) : (
 <>
 <h2 className="text-3xl font-light mb-2" style={{ color: "hsl(38 80% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
 Sätt ditt lösenord
 </h2>
 <p className="text-sm mb-10" style={{ color: "hsl(215 15% 55%)" }}>
 Välj ett säkert lösenord för ditt Mitt Kaisen-konto.
 </p>

 {!sessionReady && (
 <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: "hsl(222 40% 18%)", color: "hsl(215 15% 65%)" }}>
 Verifierar din länk...
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="password" style={{ color: "hsl(215 15% 65%)" }}>
 Nytt lösenord
 </Label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(215 15% 45%)" }} />
 <Input
 id="password"
 type="password"
 placeholder="Minst 8 tecken"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 minLength={8}
 className="pl-10 border-0"
 style={{ backgroundColor: "hsl(222 40% 18%)", color: "hsl(38 80% 85%)" }}
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="confirm" style={{ color: "hsl(215 15% 65%)" }}>
 Bekräfta lösenord
 </Label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(215 15% 45%)" }} />
 <Input
 id="confirm"
 type="password"
 placeholder="Upprepa lösenordet"
 value={confirm}
 onChange={(e) => setConfirm(e.target.value)}
 required
 minLength={8}
 className="pl-10 border-0"
 style={{ backgroundColor: "hsl(222 40% 18%)", color: "hsl(38 80% 85%)" }}
 />
 </div>
 </div>

 <Button
 type="submit"
 disabled={loading || !sessionReady}
 className="w-full h-11 font-medium"
 style={{ backgroundColor: "hsl(38 65% 38%)", color: "white" }}
 >
 {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
 {loading ? "Sparar..." : "Spara lösenord"}
 </Button>
 </form>
 </>
 )}
 </div>
 </div>
 );
}
