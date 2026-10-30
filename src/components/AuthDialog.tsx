import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { demoStorage } from "@/lib/demoStorage";
import { Separator } from "@/components/ui/separator";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [loadingStates, setLoadingStates] = useState({
    regular: false,
    guestDemo: false,
    hostDemo: false,
    adminDemo: false,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Registration is disabled - show toast notification
    toast({
      title: "Registration is disabled",
      description: "Registration is disabled, use demo mode",
      variant: "destructive",
    });

    /* REGISTRATION DISABLED - Original code commented out
    setLoadingStates(prev => ({ ...prev, regular: true }));

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your account has been created.",
      });
      onOpenChange(false);
      
      // Check for pending booking and redirect to checkout
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        const params = JSON.parse(pendingBooking);
        sessionStorage.removeItem('pendingBooking');
        navigate(`/checkout?listingId=${params.listingId}&checkIn=${params.checkIn}&checkOut=${params.checkOut}&guests=${params.guests}`);
      } else {
        navigate("/");
      }
    }
    setLoadingStates(prev => ({ ...prev, regular: false }));
    */
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStates(prev => ({ ...prev, regular: true }));

    const demoEmails = ["demo.admin@example.com", "demo.host@example.com", "demo.guest@example.com"];
    const isDemoEmail = demoEmails.includes(email.toLowerCase());

    let { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If login fails with demo credentials, auto-create the account
    if (error && isDemoEmail && password === "demo123") {
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: email.includes("admin") ? "Demo" : email.includes("host") ? "Demo" : "Demo",
            last_name: email.includes("admin") ? "Admin" : email.includes("host") ? "Host" : "Guest",
          },
        },
      });

      if (signUpError) {
        toast({
          title: "Login failed",
          description: signUpError.message,
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, regular: false }));
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (signUpData.user) {
        const roleTableName = "user_roles";
        const roleValue = email.includes("admin") ? "admin" : email.includes("host") ? "host" : "guest";
        
        const { error: roleError } = await supabase
          .from(roleTableName)
          .insert([{ user_id: signUpData.user.id, role: roleValue }]);

        if (roleError) {
          console.error("Failed to assign role:", roleError);
        }

        data = signUpData;
      }
    }

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      onOpenChange(false);
      
      // Check for pending booking and redirect to checkout
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        const params = JSON.parse(pendingBooking);
        sessionStorage.removeItem('pendingBooking');
        navigate(`/checkout?listingId=${params.listingId}&checkIn=${params.checkIn}&checkOut=${params.checkOut}&guests=${params.guests}`);
      } else {
        navigate("/");
      }
    }

    setLoadingStates(prev => ({ ...prev, regular: false }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Välkommen</DialogTitle>
          <DialogDescription>Logga in på ditt konto eller skapa ett nytt</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Logga in</TabsTrigger>
            <TabsTrigger value="signup">Skapa konto</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-post</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="din@epost.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Lösenord</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full rounded-none" disabled={loadingStates.regular}>
                {loadingStates.regular ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loggar in...
                  </>
                ) : (
                  "Logga in"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Förnamn</Label>
                  <Input
                    id="first-name"
                    type="text"
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
                    type="text"
                    placeholder="Svensson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-post</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="din@epost.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Lösenord</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Lösenordet måste vara minst 6 tecken
                </p>
              </div>
              <Button type="submit" className="w-full rounded-none" disabled={loadingStates.regular}>
                {loadingStates.regular ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Skapar konto...
                  </>
                ) : (
                  "Skapa konto"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

