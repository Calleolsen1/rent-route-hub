import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: (toUserId: string, body: string) => Promise<string | null>;
}

export function AdminComposeDialog({ open, onOpenChange, onStart }: Props) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<UserOption | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) { setSearch(""); setSelected(null); setBody(""); setUsers([]); }
  }, [open]);

  useEffect(() => {
    if (!search.trim()) { setUsers([]); return; }
    const q = search.toLowerCase();
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10)
      .then(async ({ data }) => {
        if (!data) return;
        const ids = data.map(p => p.id);
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
        const roleMap: Record<string, string> = {};
        (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });
        setUsers(data.map(p => ({
          id: p.id,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email,
          email: p.email,
          avatar_url: p.avatar_url,
          role: roleMap[p.id] || "guest",
        })));
      });
  }, [search]);

  const handleSend = async () => {
    if (!selected || !body.trim()) return;
    setSending(true);
    const threadId = await onStart(selected.id, body);
    setSending(false);
    if (threadId) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Nytt meddelande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {!selected ? (
            <>
              <div className="space-y-1.5">
                <Label>Sök mottagare</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Namn eller e-post..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              {users.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden divide-y divide-border">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{u.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs shrink-0">{u.role}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {search && users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Inga användare hittades</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-muted/50 rounded-md px-3 py-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selected.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{selected.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">Ändra</button>
              </div>

              <div className="space-y-1.5">
                <Label>Meddelande</Label>
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Skriv ditt meddelande..."
                  rows={5}
                  autoFocus
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          {selected && (
            <Button onClick={handleSend} disabled={sending || !body.trim()}>
              {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Skickar...</> : "Skicka"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
