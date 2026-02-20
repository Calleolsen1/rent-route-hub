import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Send,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

type Trip = {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
};

type TripMember = {
  id: string;
  group_id: string;
  user_id: string;
  trip_id: string | null;
  status: string;
  invoice_sent_at: string | null;
  invoice_amount: number | null;
  invoice_currency: string;
  invoice_notes: string | null;
  created_at: string;
  profiles?: Profile | null;
  trips?: Trip | null;
};

type TripGroup = {
  id: string;
  name: string;
  description: string | null;
  organizer_user_id: string | null;
  created_by_admin_id: string | null;
  created_at: string;
  trip_members?: TripMember[];
  organizer?: Profile | null;
};

const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  invited: "Inbjuden",
  confirmed: "Bekräftad",
  cancelled: "Avbokad",
};

// ── Invoice Dialog ─────────────────────────────────────────
const InvoiceDialog = ({
  open,
  onOpenChange,
  group,
  selectedMemberIds,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: TripGroup;
  selectedMemberIds: string[];
  onSent: () => void;
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SEK");
  const [notes, setNotes] = useState("");

  const targetCount =
    selectedMemberIds.length > 0
      ? selectedMemberIds.length
      : group.trip_members?.length ?? 0;

  const handleSend = async () => {
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/send-group-invoice`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: group.id,
          member_ids: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
          invoice_amount: amount ? parseFloat(amount) : undefined,
          invoice_currency: currency,
          invoice_notes: notes || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Okänt fel");

      toast({
        title: `Faktura skickad till ${result.updated_count} deltagare`,
      });
      onSent();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Skicka faktura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Faktura skickas till{" "}
            <strong>
              {targetCount} deltagare
            </strong>{" "}
            i gruppen <strong>{group.name}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Belopp</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="t.ex. 5000"
              />
            </div>
            <div className="space-y-1">
              <Label>Valuta</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="SEK"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Meddelande / anteckning</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="t.ex. Vänligen betala senast 15 mars..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Skicka faktura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Create/Edit Group Dialog ───────────────────────────────
const GroupFormDialog = ({
  open,
  onOpenChange,
  group,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: TripGroup | null;
  onSaved: () => void;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [organizerUserId, setOrganizerUserId] = useState(
    group?.organizer_user_id ?? ""
  );

  // Member management
  const [memberSearch, setMemberSearch] = useState("");
  const [members, setMembers] = useState<
    { user_id: string; trip_id: string; name: string; email: string }[]
  >(
    group?.trip_members?.map((m) => ({
      user_id: m.user_id,
      trip_id: m.trip_id ?? "",
      name: m.profiles
        ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
        : m.user_id,
      email: m.profiles?.email ?? "",
    })) ?? []
  );

  // Search profiles
  const { data: profileResults } = useQuery({
    queryKey: ["profile-search", memberSearch],
    queryFn: async () => {
      if (memberSearch.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .or(
          `first_name.ilike.%${memberSearch}%,last_name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%`
        )
        .limit(8);
      return (data ?? []) as Profile[];
    },
    enabled: memberSearch.length >= 2,
  });

  const { data: tripResults } = useQuery({
    queryKey: ["trips-for-member"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("id, title, destination, start_date, guest_user_id")
        .order("start_date", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const addMember = (profile: Profile) => {
    if (members.find((m) => m.user_id === profile.id)) return;
    setMembers((prev) => [
      ...prev,
      {
        user_id: profile.id,
        trip_id: "",
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
        email: profile.email,
      },
    ]);
    setMemberSearch("");
  };

  const removeMember = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    if (organizerUserId === userId) setOrganizerUserId("");
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Fyll i ett gruppnamn", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let groupId = group?.id;
      if (group) {
        const { error } = await supabase
          .from("trip_groups")
          .update({
            name,
            description: description || null,
            organizer_user_id: organizerUserId || null,
          })
          .eq("id", group.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("trip_groups")
          .insert({
            name,
            description: description || null,
            organizer_user_id: organizerUserId || null,
            created_by_admin_id: user?.id,
          })
          .select()
          .single();
        if (error) throw error;
        groupId = data.id;
      }

      // Sync members: delete old, insert new
      if (groupId) {
        await supabase.from("trip_members").delete().eq("group_id", groupId);
        if (members.length > 0) {
          const { error: memberError } = await supabase
            .from("trip_members")
            .insert(
              members.map((m) => ({
                group_id: groupId,
                user_id: m.user_id,
                trip_id: m.trip_id || null,
                status: "invited",
              }))
            );
          if (memberError) throw memberError;
        }
      }

      toast({ title: group ? "Grupp uppdaterad" : "Grupp skapad" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {group ? "Redigera gruppresa" : "Ny gruppresa"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-1">
            <Label>Gruppnamn *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Barcelona FC 2025"
            />
          </div>
          <div className="space-y-1">
            <Label>Beskrivning</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Member search & list */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Deltagare</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Sök kund (namn eller e-post)..."
                className="pl-9"
              />
            </div>
            {profileResults && profileResults.length > 0 && (
              <div className="border rounded-md divide-y">
                {profileResults.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between text-sm"
                    onClick={() => addMember(p)}
                  >
                    <span>
                      {p.first_name} {p.last_name}
                    </span>
                    <span className="text-muted-foreground">{p.email}</span>
                  </button>
                ))}
              </div>
            )}
            {members.length > 0 && (
              <div className="space-y-2">
                {members.map((m) => {
                  const userTrips = tripResults?.filter(
                    (t) => t.guest_user_id === m.user_id
                  );
                  return (
                    <div
                      key={m.user_id}
                      className="border rounded-md p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{m.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {m.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setOrganizerUserId(
                                organizerUserId === m.user_id ? "" : m.user_id
                              )
                            }
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              organizerUserId === m.user_id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                            }`}
                          >
                            {organizerUserId === m.user_id
                              ? "Arrangör ✓"
                              : "Utse arrangör"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMember(m.user_id)}
                            className="text-destructive hover:text-destructive/80 text-xs"
                          >
                            Ta bort
                          </button>
                        </div>
                      </div>
                      {/* Link trip */}
                      <div>
                        <Label className="text-xs">Koppla resa</Label>
                        <select
                          value={m.trip_id}
                          onChange={(e) =>
                            setMembers((prev) =>
                              prev.map((mem) =>
                                mem.user_id === m.user_id
                                  ? { ...mem, trip_id: e.target.value }
                                  : mem
                              )
                            )
                          }
                          className="w-full mt-1 text-xs border rounded px-2 py-1 bg-background"
                        >
                          <option value="">– Ingen resa vald –</option>
                          {userTrips?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                              {t.start_date
                                ? ` · ${format(new Date(t.start_date), "d MMM yyyy", { locale: sv })}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {group ? "Spara ändringar" : "Skapa grupp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Group Card ─────────────────────────────────────────────
const GroupCard = ({
  group,
  onEdit,
  onDelete,
  onInvoice,
}: {
  group: TripGroup;
  onEdit: (g: TripGroup) => void;
  onDelete: (id: string) => void;
  onInvoice: (g: TripGroup, memberIds: string[]) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Card className="border border-border/60">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{group.name}</span>
                <Badge variant="secondary">
                  {group.trip_members?.length ?? 0} deltagare
                </Badge>
                {group.organizer && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Arrangör:{" "}
                    {group.organizer.first_name ?? ""}{" "}
                    {group.organizer.last_name ?? ""}
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onInvoice(group, selectedIds)
              }
            >
              <Send className="h-3.5 w-3.5" />
              {selectedIds.length > 0
                ? `Faktura (${selectedIds.length})`
                : "Faktura alla"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(group)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(group.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Members list */}
        {expanded && (
          <div className="border-t divide-y">
            {group.trip_members && group.trip_members.length > 0 ? (
              group.trip_members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3 flex-wrap gap-2"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {m.profiles
                            ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                            : m.user_id}
                        </span>
                        {group.organizer_user_id === m.user_id && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Arrangör
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            statusColors[m.status] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {statusLabels[m.status] ?? m.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.profiles?.email}
                        {m.trips?.title && ` · ${m.trips.title}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.invoice_sent_at ? (
                      <span className="text-xs flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Faktura skickad{" "}
                        {format(
                          new Date(m.invoice_sent_at),
                          "d MMM",
                          { locale: sv }
                        )}
                        {m.invoice_amount &&
                          ` · ${m.invoice_amount} ${m.invoice_currency}`}
                      </span>
                    ) : (
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Faktura ej skickad
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-4 text-sm text-muted-foreground">
                Inga deltagare tillagda
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main Component ─────────────────────────────────────────
const TripGroupsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TripGroup | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState<{
    group: TripGroup;
    memberIds: string[];
  } | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-trip-groups", search],
    queryFn: async () => {
      let q = supabase
        .from("trip_groups")
        .select("*")
        .order("created_at", { ascending: false });
      if (search) q = q.ilike("name", `%${search}%`);
      const { data: groupsData, error } = await q;
      if (error) throw error;

      if (!groupsData || groupsData.length === 0) return [] as TripGroup[];

      // Fetch members
      const groupIds = groupsData.map((g) => g.id);
      const { data: membersData } = await supabase
        .from("trip_members")
        .select("*")
        .in("group_id", groupIds);

      // Fetch profiles for members + organizers
      const userIds = [
        ...new Set([
          ...((membersData ?? []).map((m) => m.user_id) as string[]),
          ...(groupsData
            .map((g) => g.organizer_user_id)
            .filter(Boolean) as string[]),
        ]),
      ];
      const tripIds = (membersData ?? [])
        .map((m) => m.trip_id)
        .filter(Boolean) as string[];

      const [{ data: profiles }, { data: trips }] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .in("id", userIds)
          : { data: [] },
        tripIds.length > 0
          ? supabase
              .from("trips")
              .select("id, title, destination, start_date")
              .in("id", tripIds)
          : { data: [] },
      ]);

      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p])
      );
      const tripMap = Object.fromEntries((trips ?? []).map((t) => [t.id, t]));

      return groupsData.map((g) => ({
        ...g,
        organizer: g.organizer_user_id
          ? (profileMap[g.organizer_user_id] as Profile)
          : null,
        trip_members: (membersData ?? [])
          .filter((m) => m.group_id === g.id)
          .map((m) => ({
            ...m,
            profiles: profileMap[m.user_id] as Profile | undefined,
            trips: m.trip_id ? (tripMap[m.trip_id] as Trip) : null,
          })),
      })) as TripGroup[];
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Vill du ta bort denna grupp?")) return;
    const { error } = await supabase
      .from("trip_groups")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupp borttagen" });
      queryClient.invalidateQueries({ queryKey: ["admin-trip-groups"] });
    }
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-trip-groups"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök gruppresa..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Ny gruppresa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onEdit={(gr) => {
                setEditing(gr);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
              onInvoice={(gr, memberIds) =>
                setInvoiceDialog({ group: gr, memberIds })
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Inga gruppresor hittades
        </div>
      )}

      <GroupFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editing}
        onSaved={refresh}
      />

      {invoiceDialog && (
        <InvoiceDialog
          open={true}
          onOpenChange={(v) => !v && setInvoiceDialog(null)}
          group={invoiceDialog.group}
          selectedMemberIds={invoiceDialog.memberIds}
          onSent={refresh}
        />
      )}
    </div>
  );
};

export default TripGroupsManagement;
