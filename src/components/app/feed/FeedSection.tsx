import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/app/ImageUploader";
import { Building2, Image as ImageIcon, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/relative-time";

interface PostRow {
  id: string;
  organization_id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  created_at: string;
}

interface OrgInfo {
  id: string;
  name: string;
  logo_url: string | null;
}
interface AuthorInfo {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

const PAGE = 20;

export function FeedSection({ embedded = false }: { embedded?: boolean } = {}) {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [orgs, setOrgs] = useState<Record<string, OrgInfo>>({});
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({});
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showImages, setShowImages] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const enrichRefs = async (list: PostRow[]) => {
    if (list.length === 0) return;
    const orgIds = [...new Set(list.map((p) => p.organization_id))].filter((id) => !orgs[id]);
    const authorIds = [...new Set(list.map((p) => p.author_id))].filter((id) => !authors[id]);
    const [oRes, aRes] = await Promise.all([
      orgIds.length > 0 ? supabase.from("organizations").select("id,name,logo_url").in("id", orgIds) : Promise.resolve({ data: [] as OrgInfo[] }),
      authorIds.length > 0 ? supabase.from("profiles").select("user_id,full_name,avatar_url,job_title").in("user_id", authorIds) : Promise.resolve({ data: [] as AuthorInfo[] }),
    ]);
    if (oRes.data?.length) {
      setOrgs((prev) => { const next = { ...prev }; (oRes.data as OrgInfo[]).forEach((o) => { next[o.id] = o; }); return next; });
    }
    if (aRes.data?.length) {
      setAuthors((prev) => { const next = { ...prev }; (aRes.data as AuthorInfo[]).forEach((a) => { next[a.user_id] = a; }); return next; });
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const list = (data as PostRow[]) ?? [];
    setPosts(list);
    setHasMore(list.length === PAGE);
    await enrichRefs(list);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    const oldest = posts[posts.length - 1].created_at;
    const { data } = await supabase
      .from("posts")
      .select("*")
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const more = (data as PostRow[]) ?? [];
    setPosts((prev) => [...prev, ...more]);
    setHasMore(more.length === PAGE);
    await enrichRefs(more);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadInitial();
    const channel = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        const p = payload.new as PostRow;
        setPosts((prev) => (prev.find((x) => x.id === p.id) ? prev : [p, ...prev]));
        await enrichRefs([p]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "300px" });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, hasMore, loadingMore]);

  const handlePost = async () => {
    if (!content.trim() || !profile?.organization_id || !user) {
      toast.error("Add some text first");
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("posts").insert({
      organization_id: profile.organization_id,
      author_id: user.id,
      content: content.trim(),
      image_urls: images,
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setContent("");
    setImages([]);
    setShowImages(false);
    toast.success("Posted");
  };

  return (
    <div className={embedded ? "" : "pb-44 lg:pb-32"}>
      {!embedded && (
        <div className="px-1 pt-1 pb-4">
          <h1 className="font-heading text-2xl font-bold">Network Feed</h1>
          <p className="text-sm text-muted-foreground">Updates from organizations across the network.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-muted-foreground">No updates yet. Share the first one below.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const org = orgs[p.organization_id];
            const author = authors[p.author_id];
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                    {org?.logo_url ? <img src={org.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{org?.name || "Organization"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {author?.full_name || "Member"} · {formatDistanceToNow(new Date(p.created_at))}
                    </p>
                  </div>
                </div>
                <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{p.content}</p>
                {p.image_urls?.length > 0 && (
                  <div className={`mt-3 grid gap-2 ${p.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {p.image_urls.map((u, i) => (
                      <img key={i} src={u} alt="" className="rounded-lg w-full max-h-80 object-cover border border-border" />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <div ref={sentinelRef} className="py-6 flex justify-center">
          {loadingMore ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <span className="text-xs text-muted-foreground">Scroll for more</span>}
        </div>
      )}

      {/* Sticky composer at bottom */}
      {!embedded && profile?.organization_id && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-card/95 backdrop-blur-md border-t border-border">
          <div className="max-w-2xl mx-auto p-3 space-y-2">
            {showImages && (
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">Attachments</p>
                  <button onClick={() => { setShowImages(false); setImages([]); }} className="p-1 rounded hover:bg-accent" aria-label="Close attachments">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ImageUploader bucket="post-images" value={images} onChange={setImages} max={4} />
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
                rows={1}
                placeholder="Share an update with the network…"
                className="min-h-[44px] max-h-32 resize-none bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => setShowImages((s) => !s)}
                aria-label="Add images"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button onClick={handlePost} disabled={posting || !content.trim()} size="icon" className="h-11 w-11 shrink-0">
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
