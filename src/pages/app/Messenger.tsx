import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Search, ArrowLeft, MessageSquarePlus, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/relative-time";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  email: string | null;
  organization_id: string | null;
}
interface ConversationRow {
  id: string;
  last_message_at: string;
}
interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
interface ConvSummary {
  id: string;
  last_message_at: string;
  other: Profile | null;
  preview: string;
  unread: boolean;
}

export default function Messenger() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialConv = params.get("c");
  const newRecipient = params.get("to");

  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConv);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);

  // ---------- Load conversation list ----------
  const loadConversations = async () => {
    if (!user) return;
    setLoadingList(true);
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at, conversations(id, last_message_at)")
      .eq("user_id", user.id);

    const convRows = ((parts as Array<{ conversation_id: string; last_read_at: string; conversations: ConversationRow | null }>) ?? [])
      .map((p) => ({ id: p.conversation_id, last_read_at: p.last_read_at, last_message_at: p.conversations?.last_message_at ?? "" }))
      .filter((c) => c.last_message_at)
      .sort((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1));

    if (convRows.length === 0) {
      setConversations([]);
      setLoadingList(false);
      return;
    }

    const convIds = convRows.map((c) => c.id);
    const [{ data: otherParts }, { data: lastMsgs }] = await Promise.all([
      supabase.from("conversation_participants").select("conversation_id, user_id").in("conversation_id", convIds).neq("user_id", user.id),
      supabase.from("messages").select("conversation_id, content, created_at, sender_id").in("conversation_id", convIds).order("created_at", { ascending: false }),
    ]);

    const otherByConv: Record<string, string> = {};
    (otherParts ?? []).forEach((p) => { otherByConv[p.conversation_id as string] = p.user_id as string; });
    const previewByConv: Record<string, MessageRow> = {};
    (lastMsgs ?? []).forEach((m) => {
      const cId = (m as MessageRow).conversation_id;
      if (!previewByConv[cId]) previewByConv[cId] = m as MessageRow;
    });

    const otherIds = [...new Set(Object.values(otherByConv))];
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, job_title, email, organization_id")
      .in("user_id", otherIds);
    const profMap: Record<string, Profile> = {};
    (profs ?? []).forEach((p) => { profMap[(p as Profile).user_id] = p as Profile; });
    setProfiles((prev) => ({ ...prev, ...profMap }));

    const summaries: ConvSummary[] = convRows.map((c) => {
      const otherId = otherByConv[c.id];
      const last = previewByConv[c.id];
      return {
        id: c.id,
        last_message_at: c.last_message_at,
        other: profMap[otherId] ?? null,
        preview: last?.content ?? "",
        unread: !!last && last.created_at > c.last_read_at && last.sender_id !== user.id,
      };
    });
    setConversations(summaries);
    setLoadingList(false);
  };

  useEffect(() => { loadConversations(); }, [user?.id]);

  // ---------- Realtime: refresh on new messages ----------
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messenger-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as MessageRow;
        if (msg.conversation_id === activeId) {
          setMessages((prev) => [...prev, msg]);
        }
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeId]);

  // ---------- Auto-create conversation for ?to=<userId> ----------
  useEffect(() => {
    if (!newRecipient || !user) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { _other_user_id: newRecipient });
      if (error) { toast.error(error.message); return; }
      setActiveId(data as string);
      const next = new URLSearchParams(params);
      next.delete("to");
      next.set("c", data as string);
      setParams(next, { replace: true });
      loadConversations();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRecipient, user?.id]);

  // ---------- Load active thread ----------
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    setLoadingThread(true);
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      setMessages((data as MessageRow[]) ?? []);
      setLoadingThread(false);
      // Mark as read
      if (user) {
        await supabase
          .from("conversation_participants")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", activeId)
          .eq("user_id", user.id);
      }
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
      });
    })();
  }, [activeId, user?.id]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || !activeId || !user) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      setDraft(content);
    }
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-5 lg:-my-10">
      <div
        className={cn(
          "flex bg-background",
          // Thread view on mobile = full screen (tab bar hidden by AppLayout). List view = leave room for tab bar.
          activeId
            ? "h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-2.5rem)]"
            : "h-[calc(100dvh-3rem-4rem-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-2.5rem)]"
        )}
      >
        {/* Conversation list */}
        <aside className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex-col bg-card min-w-0",
          activeId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between gap-2">
            <h1 className="font-heading text-xl font-bold">Messages</h1>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              <MessageSquarePlus className="h-4 w-4" /> New
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {loadingList ? (
              <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No conversations yet. Start one with a BD rep.
              </div>
            ) : (
              <ul>
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border/50",
                        activeId === c.id && "bg-accent"
                      )}
                    >
                      <Avatar profile={c.other} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{c.other?.full_name || c.other?.email || "Unknown"}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{c.last_message_at && formatDistanceToNow(new Date(c.last_message_at))}</span>
                        </div>
                        <p className={cn("text-xs truncate", c.unread ? "text-foreground font-medium" : "text-muted-foreground")}>{c.preview || "—"}</p>
                      </div>
                      {c.unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </aside>

        {/* Thread */}
        <section className={cn("flex-1 flex-col bg-muted/20", activeId ? "flex" : "hidden md:flex")}>
          {activeConv ? (
            <>
              <header className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
                <button className="md:hidden p-1 -ml-1 rounded hover:bg-accent" onClick={() => setActiveId(null)} aria-label="Back">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar profile={activeConv.other} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{activeConv.other?.full_name || activeConv.other?.email}</p>
                  {activeConv.other?.job_title && <p className="text-xs text-muted-foreground truncate">{activeConv.other.job_title}</p>}
                </div>
              </header>

              <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {loadingThread ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Say hello 👋</p>
                ) : (
                  messages.map((m, i) => {
                    const mine = m.sender_id === user?.id;
                    const prev = messages[i - 1];
                    const showTime = !prev || new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
                    return (
                      <div key={m.id}>
                        {showTime && (
                          <p className="text-center text-[10px] text-muted-foreground my-2">{formatDistanceToNow(new Date(m.created_at))}</p>
                        )}
                        <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm",
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border rounded-bl-sm"
                          )}>
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className="p-3 border-t border-border bg-card sticky bottom-0"
                style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
              >
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    className="min-h-[44px] max-h-32 resize-none bg-background"
                  />
                  <Button onClick={handleSend} disabled={sending || !draft.trim()} size="icon" className="h-11 w-11 shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-center px-6">
              <div>
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center mb-3">
                  <MessageSquarePlus className="h-7 w-7" />
                </div>
                <h2 className="font-heading font-bold text-lg">Your messages</h2>
                <p className="text-sm text-muted-foreground mt-1">Pick a conversation or start a new one.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {showNew && (
        <NewConversationDialog
          onClose={() => setShowNew(false)}
          onPicked={async (uid) => {
            setShowNew(false);
            const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { _other_user_id: uid });
            if (error) { toast.error(error.message); return; }
            setActiveId(data as string);
            await loadConversations();
          }}
        />
      )}
    </div>
  );
}

function Avatar({ profile }: { profile: Profile | null }) {
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary overflow-hidden grid place-items-center shrink-0">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </div>
  );
}

function NewConversationDialog({ onClose, onPicked }: { onClose: () => void; onPicked: (userId: string) => void }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, job_title, email, organization_id")
        .neq("user_id", user?.id ?? "")
        .limit(25);
      if (q.trim()) {
        query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
      }
      const { data } = await query;
      if (!cancelled) {
        setResults((data as Profile[]) ?? []);
        setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, user?.id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold mb-3">New message</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search BD reps…" className="pl-9" autoFocus />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No people found.</p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.user_id}>
                  <button onClick={() => onPicked(p.user_id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left border-b border-border/50">
                    <Avatar profile={p} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.full_name || p.email}</p>
                      {p.job_title && <p className="text-xs text-muted-foreground truncate">{p.job_title}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
