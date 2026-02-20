import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User | null;
}

export function AdminSendMessageDialog({ open, onOpenChange, user }: Props) {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !adminUser || !subject.trim() || !body.trim()) return;
    setSending(true);

    try {
      // 1. Send or reuse inbox thread between admin and user
      let threadId: string | null = null;

      // Check for existing support thread between admin and this user
      const { data: existingThread } = await supabase
        .from("message_threads")
        .select("id")
        .or(`and(participant_1_id.eq.${adminUser.id},participant_2_id.eq.${user.id}),and(participant_1_id.eq.${user.id},participant_2_id.eq.${adminUser.id})`)
        .eq("thread_type", "user_to_support")
        .maybeSingle();

      if (existingThread) {
        threadId = existingThread.id;
      } else {
        // Create new support thread
        const { data: newThread, error: threadError } = await supabase
          .from("message_threads")
          .insert({
            participant_1_id: adminUser.id,
            participant_2_id: user.id,
            thread_type: "user_to_support",
          })
          .select("id")
          .single();

        if (threadError) throw threadError;
        threadId = newThread.id;
      }

      // 2. Insert the message in the inbox
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          thread_id: threadId,
          from_user_id: adminUser.id,
          to_user_id: user.id,
          body: `**${subject}**\n\n${body}`,
          read: false,
        });

      if (msgError) throw msgError;

      // 3. Send email via edge function
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            toEmail: user.email,
            toName: user.full_name,
            subject,
            body,
          }),
        }
      );

      // Email send is best-effort — don't fail if it errors
      if (!res.ok) {
        console.warn("Email send failed but inbox message was delivered");
      }

      toast({ title: "Meddelande skickat!", description: `Skickat till ${user.full_name} via inbox och e-post.` });
      setSubject("");
      setBody("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Fel", description: err.message || "Kunde inte skicka meddelandet.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Skicka meddelande till {user?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
            <Mail className="h-4 w-4 shrink-0" />
            Skickas till <strong className="text-foreground">{user?.email}</strong> via e-post och inbox
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">Ämne</Label>
            <Input
              id="msg-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ange ämne..."
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-body">Meddelande</Label>
            <Textarea
              id="msg-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Skriv ditt meddelande här..."
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}>
            {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Skickar...</> : "Skicka meddelande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
