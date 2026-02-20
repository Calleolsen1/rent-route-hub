import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "./useDebounce";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/inbox";

export interface AdminThread {
  thread_id: string;
  participant_1_id: string;
  participant_2_id: string;
  thread_type: string;
  last_message_at: string;
  is_locked: boolean;
  locked_reason: string | null;
  // Derived: the "other" user (not admin)
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar: string | null;
  other_user_role: string;
  last_message: string | null;
  unread_count: number;
}

export const useAdminInbox = (adminUserId: string | undefined) => {
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const { toast } = useToast();
  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchThreads = async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      // Get all threads where admin is a participant
      const { data: rawThreads, error } = await supabase
        .from("message_threads")
        .select("id, participant_1_id, participant_2_id, thread_type, last_message_at, is_locked, locked_reason")
        .or(`participant_1_id.eq.${adminUserId},participant_2_id.eq.${adminUserId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      if (!rawThreads?.length) { setThreads([]); setLoading(false); return; }

      // Collect all "other" user IDs
      const otherIds = rawThreads.map(t =>
        t.participant_1_id === adminUserId ? t.participant_2_id : t.participant_1_id
      );
      const uniqueIds = [...new Set(otherIds)];

      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .in("id", uniqueIds);

      // Fetch roles for those users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", uniqueIds);

      // Fetch last messages + unread counts per thread
      const threadIds = rawThreads.map(t => t.id);
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("thread_id, body, created_at, read, to_user_id")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false });

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      const roleMap: Record<string, string> = {};
      (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

      // Build last-message and unread per thread
      const lastMsgMap: Record<string, string | null> = {};
      const unreadMap: Record<string, number> = {};
      (lastMessages || []).forEach(msg => {
        if (!lastMsgMap[msg.thread_id]) lastMsgMap[msg.thread_id] = msg.body;
        if (msg.to_user_id === adminUserId && !msg.read) {
          unreadMap[msg.thread_id] = (unreadMap[msg.thread_id] || 0) + 1;
        }
      });

      let mapped: AdminThread[] = rawThreads.map(t => {
        const otherId = t.participant_1_id === adminUserId ? t.participant_2_id : t.participant_1_id;
        const p = profileMap[otherId];
        const name = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : otherId;
        const role = roleMap[otherId] || "guest";
        return {
          thread_id: t.id,
          participant_1_id: t.participant_1_id,
          participant_2_id: t.participant_2_id,
          thread_type: t.thread_type || "user_to_support",
          last_message_at: t.last_message_at,
          is_locked: t.is_locked,
          locked_reason: t.locked_reason,
          other_user_id: otherId,
          other_user_name: name,
          other_user_email: p?.email || "",
          other_user_avatar: p?.avatar_url || null,
          other_user_role: role,
          last_message: lastMsgMap[t.id] || null,
          unread_count: unreadMap[t.id] || 0,
        };
      });

      // Search filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        mapped = mapped.filter(t =>
          t.other_user_name.toLowerCase().includes(q) ||
          t.other_user_email.toLowerCase().includes(q) ||
          (t.last_message || "").toLowerCase().includes(q)
        );
      }

      setThreads(mapped);
    } catch (err) {
      console.error("Admin inbox fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages to admin as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("thread_id", threadId)
        .eq("to_user_id", adminUserId!)
        .eq("read", false);

      setThreads(prev => prev.map(t => t.thread_id === threadId ? { ...t, unread_count: 0 } : t));
    } catch (err) {
      console.error("Fetch messages error:", err);
      toast({ title: "Fel", description: "Kunde inte ladda meddelanden", variant: "destructive" });
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async (threadId: string, toUserId: string, body: string) => {
    if (!adminUserId) return;
    try {
      const { error } = await supabase.from("messages").insert({
        thread_id: threadId,
        from_user_id: adminUserId,
        to_user_id: toUserId,
        body,
        read: false,
      });
      if (error) throw error;

      // Update last_message_at on thread
      await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);

      // Send email notification to recipient
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", toUserId)
        .maybeSingle();

      if (recipientProfile?.email) {
        const { data: { session } } = await supabase.auth.getSession();
        const recipientName = [recipientProfile.first_name, recipientProfile.last_name].filter(Boolean).join(" ") || undefined;
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-send-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              toEmail: recipientProfile.email,
              toName: recipientName,
              subject: "Nytt meddelande från Kaisen",
              body,
            }),
          }
        ).catch(() => {}); // Best-effort — don't block on email
      }
    } catch (err: any) {
      toast({ title: "Fel", description: err.message || "Kunde inte skicka meddelande", variant: "destructive" });
    }
  };

  // Create a new thread with a user and optionally send first message
  const startConversation = async (toUserId: string, body: string): Promise<string | null> => {
    if (!adminUserId) return null;
    try {
      // Check for existing thread
      const { data: existing } = await supabase
        .from("message_threads")
        .select("id")
        .or(`and(participant_1_id.eq.${adminUserId},participant_2_id.eq.${toUserId}),and(participant_1_id.eq.${toUserId},participant_2_id.eq.${adminUserId})`)
        .eq("thread_type", "user_to_support")
        .maybeSingle();

      let threadId = existing?.id;
      if (!threadId) {
        const { data: newThread, error } = await supabase
          .from("message_threads")
          .insert({ participant_1_id: adminUserId, participant_2_id: toUserId, thread_type: "user_to_support" })
          .select("id")
          .single();
        if (error) throw error;
        threadId = newThread.id;
      }

      if (body.trim()) {
        await sendMessage(threadId, toUserId, body);
      }

      await fetchThreads();
      return threadId;
    } catch (err: any) {
      toast({ title: "Fel", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `message-attachments/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("message-attachments").upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from("message-attachments").getPublicUrl(filePath);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  useEffect(() => { if (adminUserId) fetchThreads(); }, [adminUserId, debouncedSearch, sortBy]);

  useEffect(() => {
    if (selectedThreadId) fetchMessages(selectedThreadId);
    else setMessages([]);
  }, [selectedThreadId]);

  // Realtime
  useEffect(() => {
    if (!adminUserId) return;
    const ch = supabase.channel("admin-inbox-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.thread_id === selectedThreadId) {
          setMessages(prev => [...prev, msg]);
          if (msg.to_user_id === adminUserId) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        } else {
          fetchThreads();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [adminUserId, selectedThreadId]);

  return {
    threads,
    selectedThreadId,
    setSelectedThreadId,
    messages,
    loading,
    messagesLoading,
    sendMessage,
    uploadImage,
    startConversation,
    fetchThreads,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  };
};
