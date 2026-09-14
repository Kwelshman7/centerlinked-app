import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfessionalNetwork } from "@/hooks/useProfessionalNetwork";
import { ProfessionalRow } from "@/components/app/network/ProfessionalRow";
import { ConnectButton } from "@/components/app/network/ConnectButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  asProfessionalCards,
  compareNameSearch,
  connectShareUrl,
  groupByLetter,
  groupByOrganization,
  personMatchesQuery,
  personState,
  uniqueStates,
  type ProfessionalCard,
} from "@/lib/professional-network";

type Tab = "contacts" | "requests" | "discover";
type Grouping = "people" | "orgs";

export default function Network() {
  const { user } = useAuth();
  const { connections, requests, loading, requestConnection, respondToRequest } =
    useProfessionalNetwork();
  const [tab, setTab] = useState<Tab>("contacts");
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [grouping, setGrouping] = useState<Grouping>("people");
  const [directory, setDirectory] = useState<ProfessionalCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const searchingNames = q.trim().length >= 1;

  const visibleContacts = useMemo(() => {
    const matched = connections.filter((person) => {
      if (!personMatchesQuery(person, q)) return false;
      if (!stateFilter) return true;
      return (personState(person) || "").toUpperCase() === stateFilter;
    });
    if (searchingNames) return [...matched].sort((a, b) => compareNameSearch(q, a, b));
    return matched;
  }, [connections, q, stateFilter, searchingNames]);

  const connectedIds = useMemo(() => new Set(connections.map((person) => person.user_id)), [connections]);

  const inviteMatches = useMemo(() => {
    return directory
      .filter((person) => !connectedIds.has(person.user_id) && person.connection_status !== "accepted")
      .sort((a, b) => compareNameSearch(q, a, b));
  }, [directory, connectedIds, q]);

  const states = useMemo(() => uniqueStates(connections), [connections]);
  const letterGroups = useMemo(() => groupByLetter(visibleContacts), [visibleContacts]);
  const orgGroups = useMemo(() => groupByOrganization(visibleContacts), [visibleContacts]);
  const letters = letterGroups.map((group) => group.letter);

  useEffect(() => {
    if (tab === "requests" && requests.length === 0) setTab("contacts");
  }, [tab, requests.length]);

  useEffect(() => {
    const shouldLoad = tab === "discover" || searchingNames;
    if (!shouldLoad) {
      if (!searchingNames) setDirectory([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setSearching(true);
      const { data, error } = await supabase.rpc("search_professionals", {
        _query: q.trim(),
      });
      if (cancelled) return;
      setSearching(false);
      if (error) {
        setDirectory([]);
        return;
      }
      setDirectory(asProfessionalCards(data));
    }, searchingNames ? 160 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [tab, q, searchingNames]);

  const copyMyLink = async () => {
    if (!user) return;
    const url = connectShareUrl(window.location.origin, user.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Connect with me on CenterLinked", url, text: "Add me on CenterLinked" });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Connect link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const connect = async (userId: string) => {
    setBusyId(userId);
    const { error } = await requestConnection(userId);
    setBusyId(null);
    if (error) toast.error(error);
    else {
      toast.success("Invite sent");
      setDirectory((current) =>
        current.map((person) =>
          person.user_id === userId ? { ...person, connection_status: "pending_out" } : person,
        ),
      );
    }
  };

  const accept = async (connectionId: string) => {
    setBusyId(connectionId);
    const { error } = await respondToRequest(connectionId, true);
    setBusyId(null);
    if (error) toast.error(error);
    else toast.success("Connected");
  };

  const decline = async (connectionId: string) => {
    setBusyId(connectionId);
    const { error } = await respondToRequest(connectionId, false);
    setBusyId(null);
    if (error) toast.error(error);
  };

  const jumpToLetter = (letter: string) => {
    document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderInviteRow = (person: ProfessionalCard) => (
    <ProfessionalRow
      key={person.user_id}
      person={person}
      trailing={
        <ConnectButton
          status={person.connection_status}
          busy={busyId === person.user_id}
          onConnect={() => void connect(person.user_id)}
        />
      }
    />
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-accent/40 px-4 py-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-xl sm:text-3xl font-bold leading-tight">Network</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate sm:whitespace-normal">
              {connections.length} {connections.length === 1 ? "contact" : "contacts"}
              {requests.length ? ` · ${requests.length} ${requests.length === 1 ? "request" : "requests"}` : ""}
            </p>
          </div>
          <Button onClick={copyMyLink} size="sm" className="shrink-0 h-9">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share link</span>
            <span className="sm:hidden">Share</span>
          </Button>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className={cn("grid w-full h-10 sm:h-11 rounded-xl", requests.length > 0 ? "grid-cols-3" : "grid-cols-2")}>
          <TabsTrigger value="contacts" className="rounded-lg text-xs sm:text-sm">
            Contacts
          </TabsTrigger>
          {requests.length > 0 ? (
            <TabsTrigger value="requests" className="rounded-lg text-xs sm:text-sm">
              Requests ({requests.length})
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="discover" className="rounded-lg text-xs sm:text-sm">
            Discover
          </TabsTrigger>
        </TabsList>

        <div className="relative mt-3 sm:mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            inputMode="search"
            autoCapitalize="words"
            autoComplete="off"
            placeholder="Search"
            className="pl-9 h-11 rounded-xl text-base sm:text-sm"
          />
        </div>

        <TabsContent value="contacts" className="mt-3 sm:mt-4 space-y-3">
          {!searchingNames && (states.length > 1 || connections.length > 0) ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGrouping("people")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors",
                  grouping === "people"
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-background text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                A–Z
              </button>
              <button
                type="button"
                onClick={() => setGrouping("orgs")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors",
                  grouping === "orgs"
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-background text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                By organization
              </button>
              {states.length > 1 ? (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                  <button
                    type="button"
                    onClick={() => setStateFilter(null)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors shrink-0",
                      !stateFilter
                        ? "bg-secondary text-foreground ring-border"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground",
                    )}
                  >
                    All states
                  </button>
                  {states.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setStateFilter(state)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors shrink-0",
                        stateFilter === state
                          ? "bg-secondary text-foreground ring-border"
                          : "bg-background text-muted-foreground ring-border hover:text-foreground",
                      )}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {!searchingNames && grouping === "people" && letters.length > 3 ? (
            <div className="flex sm:hidden overflow-x-auto gap-1 pb-0.5 -mx-1 px-1">
              {letters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => jumpToLetter(letter)}
                  className="h-7 min-w-7 px-1.5 rounded-md text-[11px] font-bold text-primary bg-primary/8 shrink-0"
                >
                  {letter}
                </button>
              ))}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-16 grid place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : visibleContacts.length === 0 && !(searchingNames && (searching || inviteMatches.length > 0)) ? (
              <div className="px-5 py-12 text-center space-y-4">
                <p className="font-heading font-semibold">{searchingNames ? "No results" : "No contacts"}</p>
                {!searchingNames ? (
                  <Button onClick={copyMyLink} size="sm">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                ) : null}
              </div>
            ) : searchingNames ? (
              <div className="divide-y divide-border/50">
                {visibleContacts.map((person) => (
                  <ProfessionalRow key={person.user_id} person={person} showActions />
                ))}
              </div>
            ) : (
              <div className="flex">
                <div className="min-w-0 flex-1">
                  {grouping === "people"
                    ? letterGroups.map((group) => (
                        <section key={group.letter} id={`letter-${group.letter}`}>
                          <div className="sticky top-12 lg:top-0 z-10 bg-muted/95 backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-border/50">
                            {group.letter}
                          </div>
                          <div className="divide-y divide-border/50">
                            {group.people.map((person) => (
                              <ProfessionalRow key={person.user_id} person={person} showActions />
                            ))}
                          </div>
                        </section>
                      ))
                    : orgGroups.map((group) => (
                        <section key={group.key}>
                          <div className="sticky top-12 lg:top-0 z-10 bg-muted/95 backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-wider text-muted-foreground border-b border-border/50 flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" />
                            {group.label}
                          </div>
                          <div className="divide-y divide-border/50">
                            {group.people.map((person) => (
                              <ProfessionalRow key={person.user_id} person={person} showActions />
                            ))}
                          </div>
                        </section>
                      ))}
                </div>
                {grouping === "people" && letters.length > 3 ? (
                  <div className="hidden lg:flex flex-col items-center py-2 px-1 gap-0.5 shrink-0 border-l border-border/50 bg-muted/20">
                    {letters.map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => jumpToLetter(letter)}
                        className="h-4 w-4 text-[9px] font-bold text-primary/80 hover:text-primary leading-none"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {searchingNames && (searching || inviteMatches.length > 0) ? (
            <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-border/60">
                <p className="text-xs font-semibold text-muted-foreground">Invite</p>
              </div>
              {searching && inviteMatches.length === 0 ? (
                <div className="py-8 grid place-items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="divide-y divide-border/50">{inviteMatches.map(renderInviteRow)}</div>
              )}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="requests" className="mt-3 sm:mt-4">
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm divide-y divide-border/50">
            {requests.map((person) => (
              <ProfessionalRow
                key={person.connection_id || person.user_id}
                person={person}
                trailing={
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      disabled={busyId === person.connection_id}
                      onClick={() => person.connection_id && void decline(person.connection_id)}
                    >
                      Decline
                    </Button>
                    <ConnectButton
                      status="pending_in"
                      busy={busyId === person.connection_id}
                      onAccept={() => person.connection_id && void accept(person.connection_id)}
                    />
                  </div>
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-3 sm:mt-4">
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
            {searching ? (
              <div className="py-12 grid place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : inviteMatches.length === 0 ? (
              <p className="px-4 py-10 text-sm text-muted-foreground text-center">No people</p>
            ) : (
              <div className="divide-y divide-border/50">{inviteMatches.map(renderInviteRow)}</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
