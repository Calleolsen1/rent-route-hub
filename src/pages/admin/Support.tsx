import { useAuth } from "@/hooks/useAuth";
import { useAdminInbox, AdminThread } from "@/hooks/useAdminInbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageInput } from "@/components/inbox/MessageInput";
import { MessageList } from "@/components/inbox/MessageList";
import { AdminComposeDialog } from "@/components/admin/AdminComposeDialog";
import { ArrowLeft, MessageSquarePlus, Search, MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { svDateShort, svTime, svYmd } from "@/lib/formatSek";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getRoleBadge = (role: string) => {
  if (role === "admin") return { label: "Admin", variant: "default" as const };
  if (role === "host") return { label: "Arrangör", variant: "secondary" as const };
  return { label: "Kund", variant: "outline" as const };
};

const formatTime = (ts: string) =>
  svYmd(ts) === svYmd(new Date()) ? svTime(ts) : svDateShort(ts);

function ThreadItem({ thread, isActive, onClick }: { thread: AdminThread; isActive: boolean; onClick: () => void }) {
  const badge = getRoleBadge(thread.other_user_role);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-border last:border-0",
        isActive ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        <AvatarImage src={thread.other_user_avatar || undefined} />
        <AvatarFallback className="text-sm">{thread.other_user_name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-medium text-sm truncate">{thread.other_user_name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatTime(thread.last_message_at)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={badge.variant} className="text-[10px] py-0 h-4 px-1.5 shrink-0">{badge.label}</Badge>
          <p className="text-xs text-muted-foreground truncate flex-1">{thread.last_message || "Inga meddelanden"}</p>
          {thread.unread_count > 0 && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
}

export default function AdminSupport() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [composeOpen, setComposeOpen] = useState(false);

  const {
    threads,
    selectedThreadId,
    setSelectedThreadId,
    messages,
    loading,
    messagesLoading,
    sendMessage,
    deleteThread,
    uploadImage,
    startConversation,
    searchQuery,
    setSearchQuery,
  } = useAdminInbox(user?.id);

  useEffect(() => {
    const tp = searchParams.get("thread");
    if (tp) setSelectedThreadId(tp);
  }, [searchParams]);

  const selectedThread = threads.find(t => t.thread_id === selectedThreadId) || null;

  const handleStartConversation = async (toUserId: string, body: string): Promise<string | null> => {
    const threadId = await startConversation(toUserId, body);
    if (threadId) setSelectedThreadId(threadId);
    return threadId;
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex gap-0 h-[calc(100vh-200px)] min-h-[600px]">

        {/* Left - Thread list */}
        <div className={cn(
          "flex flex-col border-r border-border bg-[#F8FAFF] md:w-[340px] lg:w-[380px] shrink-0",
          selectedThreadId ? "hidden md:flex" : "flex w-full"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Meddelanden</h2>
              <Button size="sm" onClick={() => setComposeOpen(true)} className="gap-1.5 h-8">
                <MessageSquarePlus className="h-4 w-4" />
                Nytt
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Sök konversationer..."
                className="pl-9 h-9 bg-background"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-full bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-semibold text-sm">Inga konversationer</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? "Inga matchade konversationer" : "Klicka på Nytt för att skicka ett meddelande"}
                </p>
              </div>
            ) : (
              threads.map(t => (
                <ThreadItem
                  key={t.thread_id}
                  thread={t}
                  isActive={selectedThreadId === t.thread_id}
                  onClick={() => setSelectedThreadId(t.thread_id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right - Chat panel */}
        <div className={cn(
          "flex flex-col flex-1 bg-white overflow-hidden",
          !selectedThreadId ? "hidden md:flex" : "flex w-full"
        )}>
          {selectedThread ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
                <Button
                  variant="ghost" size="icon"
                  className="md:hidden h-8 w-8 shrink-0"
                  onClick={() => setSelectedThreadId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedThread.other_user_avatar || undefined} />
                  <AvatarFallback className="text-sm">{selectedThread.other_user_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{selectedThread.other_user_name}</p>
                    <Badge variant={getRoleBadge(selectedThread.other_user_role).variant} className="text-[10px] h-4 px-1.5">
                      {getRoleBadge(selectedThread.other_user_role).label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{selectedThread.other_user_email}</p>
                </div>

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Radera konversation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Alla meddelanden med {selectedThread.other_user_name} kommer att raderas permanent. Detta kan inte ångras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteThread(selectedThread.thread_id)}
                      >
                        Radera
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Messages */}
              <MessageList
                messages={messages}
                currentUserId={user?.id || ""}
                loading={messagesLoading}
              />

              {/* Input */}
              <MessageInput
                onSendMessage={async (body) => {
                  await sendMessage(selectedThread.thread_id, selectedThread.other_user_id, body);
                }}
                onUploadImage={uploadImage}
                isLocked={selectedThread.is_locked}
                lockedReason={selectedThread.locked_reason || undefined}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Välj en konversation</h3>
              <p className="text-sm text-muted-foreground mb-4">Välj en konversation i listan för att se meddelanden</p>
              <Button onClick={() => setComposeOpen(true)} variant="outline" className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Starta ny konversation
              </Button>
            </div>
          )}
        </div>
      </div>

      <AdminComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onStart={handleStartConversation}
      />
    </div>
  );
}
