import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Loader2, Mail, MessageSquare, MoreHorizontal, Phone, Search, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfessionalNetwork } from "@/hooks/useProfessionalNetwork";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectButton } from "@/components/app/network/ConnectButton";
import { InviteColleagueCard } from "@/components/app/InviteColleagueCard";
import { ProfessionalRow } from "@/components/app/network/ProfessionalRow";
import {
  filterWorkspaceContacts,
  mergeWorkspaceContacts,
  workspaceContactFromConnection,
  type FacilityBdInput,
  type RepresentativeInput,
  type WorkspaceContact,
  type WorkspaceContactOrg,
} from "@/lib/contact-workspace";
import {
  asProfessionalCards,
  asProfessionalProfile,
  compareNameSearch,
  professionalPath,
  type ProfessionalCard,
} from "@/lib/professional-network";
import { useSavedProfessionals } from "@/hooks/useSavedProfessionals";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { resolveStateCode } from "@/lib/us-states";
import { isPartnerVisibleFacility } from "@/lib/facility-visibility";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 40;
const FETCH_PAGE = 1000;

async function fetchAllRows<T>(
  run: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    count: number | null;
    error: { message?: string } | null;
  }>,
): Promise<{ rows: T[]; error: string | null }> {
  const { data, count, error } = await run(0, FETCH_PAGE - 1);
  if (error) return { rows: [], error: error.message || "Could not load contacts." };
  const first = data ?? [];
  const total = count ?? first.length;
  if (first.length >= total) return { rows: first, error: null };
  const pageSize = Math.max(first.length, 1);
  const out = [...first];
  for (let from = first.length; from < total; from += pageSize) {
    const next = await run(from, from + pageSize - 1);
    if (next.error) return { rows: out, error: next.error.message || "Could not load contacts." };
    out.push(...(next.data ?? []));
  }
  return { rows: out, error: null };
}

function asOrg(value: unknown): WorkspaceContactOrg | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const rec = row as Record<string, unknown>;
  if (typeof rec.id !== "string" || typeof rec.name !== "string") return null;
  return {
    id: rec.id,
    name: rec.name,
    slug: typeof rec.slug === "string" ? rec.slug : null,
    logo_url: typeof rec.logo_url === "string" ? rec.logo_url : null,
  };
}

function hiddenContactsStorageKey(userId: string) {
  return `cl.hidden-contacts.${userId}`;
}

function readHiddenContactKeys(userId: string): string[] {
  try {
    const raw = localStorage.getItem(hiddenContactsStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeHiddenContactKeys(userId: string, keys: string[]) {
  localStorage.setItem(hiddenContactsStorageKey(userId), JSON.stringify(keys));
}

function contactHideKeys(contact: WorkspaceContact): string[] {
  const keys = [contact.id];
  if (contact.userId) keys.push(`user:${contact.userId}`);
  if (contact.email) keys.push(`email:${contact.email.trim().toLowerCase()}`);
  return keys;
}

function isHiddenContact(contact: WorkspaceContact, hidden: Set<string>) {
  return contactHideKeys(contact).some((key) => hidden.has(key));
}

export default function Contacts() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const hasOrg = Boolean(profile?.organization_id);
  const {
    connections,
    requests,
    loading: networkLoading,
    requestConnection,
    respondToRequest,
    removeConnection,
    reload,
  } = useProfessionalNetwork();
  const { partners, partnerOrgIds, loading: partnersLoading } = useReferralNetwork();
  const { ids: savedIds } = useSavedProfessionals();
  const partnerKey = useMemo(() => [...partnerOrgIds].sort().join(","), [partnerOrgIds]);
  const [reps, setReps] = useState<RepresentativeInput[]>([]);
  const [facilities, setFacilities] = useState<FacilityBdInput[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [extraSaved, setExtraSaved] = useState<WorkspaceContact[]>([]);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [findQ, setFindQ] = useState("");
  const [directory, setDirectory] = useState<ProfessionalCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceContact | null>(null);
  const [removing, setRemoving] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setHiddenKeys([]);
      return;
    }
    setHiddenKeys(readHiddenContactKeys(user.id));
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      const ids = partnerKey ? partnerKey.split(",") : [];
      if (!ids.length) {
        if (!cancelled) {
          setReps([]);
          setFacilities([]);
          setCatalogError(null);
          setCatalogLoading(false);
        }
        return;
      }
      const [repRes, facRes] = await Promise.all([
        fetchAllRows<RepresentativeInput>((from, to) =>
          supabase
            .from("bd_representatives")
            .select(
              "id,user_id,full_name,title,email,phone,avatar_url,organization_id,organization_name,payer_expertise,states_covered,internal_notes,active",
              { count: "exact" },
            )
            .eq("active", true)
            .in("organization_id", ids)
            .order("full_name")
            .range(from, to),
        ),
        fetchAllRows<Record<string, unknown>>((from, to) =>
          supabase
            .from("facilities")
            .select(
              "id,name,organization_id,city,state,bd_contact_name,bd_contact_phone,bd_contact_email,bd_contact_title,verification_status,verification_frozen,organizations(id,name,slug,logo_url)",
              { count: "exact" },
            )
            .in("organization_id", ids)
            .eq("verification_status", "approved")
            .eq("verification_frozen", false)
            .not("bd_contact_name", "is", null)
            .order("name")
            .range(from, to),
        ),
      ]);
      if (cancelled) return;
      const errors = [repRes.error, facRes.error].filter(Boolean);
      setCatalogError(errors.length ? errors.join(" ") : null);
      setReps(repRes.rows);
      setFacilities(
        facRes.rows
          .filter((row) => isPartnerVisibleFacility(row as { verification_status?: string; verification_frozen?: boolean }))
          .map((row) => ({
            id: String(row.id),
            name: String(row.name ?? ""),
            organization_id: typeof row.organization_id === "string" ? row.organization_id : null,
            city: typeof row.city === "string" ? row.city : null,
            state: typeof row.state === "string" ? row.state : null,
            bd_contact_name: typeof row.bd_contact_name === "string" ? row.bd_contact_name : null,
            bd_contact_phone: typeof row.bd_contact_phone === "string" ? row.bd_contact_phone : null,
            bd_contact_email: typeof row.bd_contact_email === "string" ? row.bd_contact_email : null,
            bd_contact_title: typeof row.bd_contact_title === "string" ? row.bd_contact_title : null,
            organization: asOrg(row.organizations),
          })),
      );
      setCatalogLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [partnerKey]);

  const partnerReps = useMemo<RepresentativeInput[]>(
    () =>
      partners
        .filter((partner) => partner.bd_contact_name)
        .map((partner) => ({
          id: partner.rowId,
          full_name: partner.bd_contact_name as string,
          email: partner.bd_contact_email,
          phone: partner.bd_contact_phone,
          organization_id: partner.id,
          organization_name: partner.name,
          active: true,
        })),
    [partners],
  );

  const hiddenSet = useMemo(() => new Set(hiddenKeys), [hiddenKeys]);

  const contacts = useMemo(() => {
    const merged = mergeWorkspaceContacts({
      connections,
      representatives: [...reps, ...partnerReps],
      facilities,
      viewerOrgId: profile?.organization_id ?? null,
    });
    const byOrg = new Map(partners.map((partner) => [partner.id, partner]));
    return merged
      .map((contact) => {
        const partner = contact.organization?.id ? byOrg.get(contact.organization.id) : undefined;
        if (!partner || !contact.organization) return contact;
        return {
          ...contact,
          organization: {
            ...contact.organization,
            slug: contact.organization.slug || partner.slug,
            logo_url: contact.organization.logo_url || partner.logo_url,
          },
        };
      })
      .filter((contact) => !isHiddenContact(contact, hiddenSet))
      .filter((contact) => {
        if (user?.id && contact.userId === user.id) return false;
        if (profile?.user_id && contact.userId === profile.user_id) return false;
        const myEmail = user?.email?.trim().toLowerCase();
        if (myEmail && contact.email?.trim().toLowerCase() === myEmail) return false;
        const myName = profile?.full_name?.trim().toLowerCase();
        if (
          myName &&
          profile?.organization_id &&
          contact.fullName.trim().toLowerCase() === myName &&
          contact.organization?.id === profile.organization_id
        ) {
          return false;
        }
        return true;
      });
  }, [connections, reps, partnerReps, facilities, profile, partners, hiddenSet, user?.id, user?.email]);

  const savedContacts = useMemo(() => {
    const fromList = contacts.filter((contact) => contact.userId && savedIds.has(contact.userId));
    const have = new Set(fromList.map((contact) => contact.userId));
    const extras = extraSaved.filter((contact) => contact.userId && savedIds.has(contact.userId) && !have.has(contact.userId));
    return [...fromList, ...extras];
  }, [contacts, extraSaved, savedIds]);

  const list = savedOnly ? savedContacts : contacts;
  const filtered = useMemo(() => filterWorkspaceContacts(list, { query }), [list, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, savedOnly]);

  useEffect(() => {
    const missing = Array.from(savedIds).filter((id) => !contacts.some((contact) => contact.userId === id));
    if (!missing.length) {
      setExtraSaved([]);
      return;
    }
    let cancelled = false;
    void Promise.all(missing.map((id) => supabase.rpc("get_professional_profile", { _user_id: id }))).then((results) => {
      if (cancelled) return;
      setExtraSaved(
        results
          .map((result) => {
            const person = asProfessionalProfile(result.data);
            return person ? workspaceContactFromConnection(person) : null;
          })
          .filter((row): row is WorkspaceContact => Boolean(row)),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [savedIds, contacts]);

  useEffect(() => {
    const needle = findQ.trim();
    if (!addOpen || needle.length < 1) {
      setDirectory([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_professionals", { _query: needle });
      if (cancelled) return;
      setSearching(false);
      if (error) {
        setDirectory([]);
        return;
      }
      setDirectory(asProfessionalCards(data).sort((a, b) => compareNameSearch(needle, a, b)));
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [addOpen, findQ]);

  const resolveContactUserId = async (contact: WorkspaceContact): Promise<string | null> => {
    if (contact.userId) return contact.userId;
    const needle = contact.email || contact.fullName;
    if (!needle) return null;
    const { data } = await supabase.rpc("search_professionals", { _query: needle });
    const match = asProfessionalCards(data).find((person) => {
      const email = person.email?.trim().toLowerCase();
      if (contact.email && email && email === contact.email.trim().toLowerCase()) return true;
      return (person.full_name || "").trim().toLowerCase() === contact.fullName.trim().toLowerCase();
    });
    return match?.user_id ?? null;
  };

  const connect = async (userId: string) => {
    setBusyId(userId);
    const { error } = await requestConnection(userId);
    setBusyId(null);
    if (error) toast.error(error);
    else {
      toast.success("Invite sent");
      await reload();
    }
  };

  const accept = async (connectionId: string) => {
    setBusyId(connectionId);
    const { error } = await respondToRequest(connectionId, true);
    setBusyId(null);
    if (error) toast.error(error);
    else toast.success("Connected");
  };

  const openContact = async (contact: WorkspaceContact) => {
    const userId = await resolveContactUserId(contact);
    if (userId) {
      navigate(professionalPath(userId));
      return;
    }
    navigate(`/app/contacts/${encodeURIComponent(contact.id)}`);
  };

  const hideFromMyList = (contact: WorkspaceContact) => {
    if (!user?.id) return;
    const next = Array.from(new Set([...hiddenKeys, ...contactHideKeys(contact)]));
    setHiddenKeys(next);
    writeHiddenContactKeys(user.id, next);
  };

  const confirmRemove = async () => {
    const contact = removeTarget;
    if (!contact) return;
    setRemoving(true);
    const userId = await resolveContactUserId(contact);
    if (userId && userId !== user?.id) {
      const { error } = await removeConnection(userId);
      if (error) {
        setRemoving(false);
        toast.error(error);
        return;
      }
    }
    hideFromMyList(contact);
    setRemoving(false);
    setRemoveTarget(null);
    toast.success("Removed from your contacts");
  };

  const loading = networkLoading || catalogLoading || partnersLoading;
  const connectedIds = useMemo(() => new Set(connections.map((person) => person.user_id)), [connections]);
  const findMatches = directory.filter((person) => person.user_id !== user?.id);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold">Contacts</h1>
          <p className="text-xs text-muted-foreground">
            {contacts.length.toLocaleString("en-US")} {contacts.length === 1 ? "person" : "people"} in your list
          </p>
        </div>
        <InviteColleagueCard inline showEmail={false} />
      </div>

      {requests.length > 0 ? (
        <Card className="p-3">
          <p className="text-sm font-medium">
            {requests.length} connection {requests.length === 1 ? "request" : "requests"}
          </p>
          <div className="mt-2 space-y-2">
            {requests.slice(0, 4).map((person) => (
              <ProfessionalRow
                key={person.user_id}
                person={person}
                trailing={
                  <ConnectButton
                    status="pending_in"
                    busy={busyId === person.connection_id}
                    onAccept={() => person.connection_id && void accept(person.connection_id)}
                  />
                }
              />
            ))}
          </div>
        </Card>
      ) : null}

      {catalogError ? (
        <Card className="p-3 text-sm text-destructive">{catalogError} Showing whatever loaded.</Card>
      ) : null}

      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Button
          type="button"
          variant={savedOnly ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((value) => !value)}
        >
          <Bookmark className={cn("h-3.5 w-3.5", savedOnly && "fill-current")} />
          Saved
        </Button>
      </div>

      <Card className="min-w-0 overflow-hidden">
        {loading ? (
          <div>
            <div className="divide-y divide-border/60 md:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 px-3 py-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
            <Table className="hidden table-fixed md:table">
              <ContactTableHeader />
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="px-3 py-2.5">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell className="px-2 py-2.5" />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : pageRows.length === 0 ? (
          <div className="space-y-3 p-8 text-center text-sm text-muted-foreground">
            {savedOnly && savedContacts.length === 0 ? (
              <p>No saved professionals yet. Open a profile and tap Save.</p>
            ) : contacts.length === 0 ? (
              <>
                <p>
                  {hasOrg
                    ? "Your list is empty. Find a professional, invite a colleague to join, or add a partner organization so their BD contacts show up here."
                    : "Your list is empty. Find a professional to connect, or invite a BD rep who is not on CenterLinked yet."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                    Find a professional
                  </Button>
                  {hasOrg ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/app/organizations?view=network">Partner organizations</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/app/search">Search insurance</Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p>No contacts match this search.</p>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border/60 md:hidden">
              {pageRows.map((contact) => (
                <li key={contact.id}>
                  <ContactMobileRow
                    contact={contact}
                    menuOpen={menuOpenId === contact.id}
                    onMenuOpenChange={(open) => setMenuOpenId(open ? contact.id : null)}
                    onOpen={() => void openContact(contact)}
                    onDelete={() => {
                      setMenuOpenId(null);
                      setRemoveTarget(contact);
                    }}
                  />
                </li>
              ))}
            </ul>
            <Table className="hidden table-fixed md:table">
              <ContactTableHeader />
              <TableBody>
                {pageRows.map((contact) => (
                  <ContactListRow
                    key={contact.id}
                    contact={contact}
                    menuOpen={menuOpenId === contact.id}
                    onMenuOpenChange={(open) => setMenuOpenId(open ? contact.id : null)}
                    onOpen={() => void openContact(contact)}
                    onDelete={() => {
                      setMenuOpenId(null);
                      setRemoveTarget(contact);
                    }}
                  />
                ))}
              </TableBody>
            </Table>
            {pageCount > 1 ? (
              <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span>
                    {currentPage} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && !removing && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this contact?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `${removeTarget.fullName} will be removed from your contact list only. Their CenterLinked profile and organization listing stay in the app.`
                : "This person will be removed from your contact list only."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmRemove();
              }}
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Find a professional</DialogTitle>
            <DialogDescription>
              Search people already on CenterLinked. If they are not here yet, share the join link so they can sign up
              and add their organization.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={findQ}
              onChange={(e) => setFindQ(e.target.value)}
              placeholder="Search by name, title, or organization"
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {searching ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : findQ.trim().length < 1 ? (
              <p className="py-6 text-sm text-muted-foreground">Type a name to find someone on CenterLinked.</p>
            ) : findMatches.length === 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  No professionals match that search. If they are not on CenterLinked yet, invite them to join.
                </p>
                <InviteColleagueCard
                  compact
                  showEmail={false}
                  title="Invite them to CenterLinked"
                  description="They sign up free with a work email, then can add their organization and insurance contracts."
                />
              </div>
            ) : (
              findMatches.map((person) => (
                <ProfessionalRow
                  key={person.user_id}
                  person={person}
                  trailing={
                    connectedIds.has(person.user_id) ? (
                      <ConnectButton status="accepted" />
                    ) : (
                      <ConnectButton
                        status={person.connection_status}
                        busy={busyId === person.user_id}
                        onConnect={() => void connect(person.user_id)}
                      />
                    )
                  }
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactTableHeader() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="h-9 w-[26%] px-3 text-xs font-semibold uppercase tracking-[0.06em]">Name</TableHead>
        <TableHead className="h-9 w-40 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Contact #</TableHead>
        <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Organization</TableHead>
        <TableHead className="h-9 w-16 px-3 text-xs font-semibold uppercase tracking-[0.06em]">State</TableHead>
        <TableHead className="h-9 w-10 px-2" />
      </TableRow>
    </TableHeader>
  );
}

type ContactRowProps = {
  contact: WorkspaceContact;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
};

function ContactActions({ contact, menuOpen, onMenuOpenChange, onOpen, onDelete }: ContactRowProps) {
  const tel = sanitizePhone(contact.phone);
  const email = contact.email?.trim() || "";

  return (
    <Popover open={menuOpen} onOpenChange={onMenuOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          aria-label={`Actions for ${contact.fullName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-col">
          {tel ? (
            <a href={`tel:${tel}`} className={menuItemClass}>
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          ) : (
            <span className={cn(menuItemClass, "pointer-events-none opacity-40")}>
              <Phone className="h-3.5 w-3.5" />
              Call
            </span>
          )}
          {tel ? (
            <a href={`sms:${tel}`} className={menuItemClass}>
              <MessageSquare className="h-3.5 w-3.5" />
              Text
            </a>
          ) : (
            <span className={cn(menuItemClass, "pointer-events-none opacity-40")}>
              <MessageSquare className="h-3.5 w-3.5" />
              Text
            </span>
          )}
          {email ? (
            <a href={`mailto:${email}`} className={menuItemClass}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          ) : (
            <span className={cn(menuItemClass, "pointer-events-none opacity-40")}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </span>
          )}
          <button type="button" className={menuItemClass} onClick={onOpen}>
            <User className="h-3.5 w-3.5" />
            View profile
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className={cn(menuItemClass, "text-destructive hover:bg-destructive/10")}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ContactMobileRow({
  contact,
  menuOpen,
  onMenuOpenChange,
  onOpen,
  onDelete,
}: ContactRowProps) {
  const tel = sanitizePhone(contact.phone);
  const displayPhone = formatPhoneDisplay(contact.phone);
  const orgName = contact.organization?.name || null;
  const stateCode = resolveStateCode(contact.state);

  return (
    <div className="flex items-start gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <button type="button" className="min-w-0 truncate text-left font-medium leading-snug text-foreground" onClick={onOpen}>
            {contact.fullName}
          </button>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">{stateCode || "—"}</span>
        </div>
        <p className="mt-0.5 flex min-w-0 items-baseline gap-1.5 text-sm text-muted-foreground">
          {displayPhone && tel ? (
            <a href={`tel:${tel}`} className="shrink-0 tabular-nums text-foreground hover:text-primary">
              {displayPhone}
            </a>
          ) : (
            <span className="shrink-0">—</span>
          )}
          <span aria-hidden>·</span>
          <span className="min-w-0 truncate">{orgName || "No organization"}</span>
        </p>
      </div>
      <ContactActions
        contact={contact}
        menuOpen={menuOpen}
        onMenuOpenChange={onMenuOpenChange}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    </div>
  );
}

function ContactListRow(props: ContactRowProps) {
  const { contact, onOpen } = props;
  const tel = sanitizePhone(contact.phone);
  const displayPhone = formatPhoneDisplay(contact.phone);
  const orgName = contact.organization?.name || null;
  const stateCode = resolveStateCode(contact.state);

  return (
    <TableRow>
      <TableCell className="px-3 py-2.5">
        <button type="button" className="block w-full truncate text-left font-medium leading-snug text-foreground" onClick={onOpen}>
          {contact.fullName}
        </button>
      </TableCell>
      <TableCell className="px-3 py-2.5">
        {displayPhone && tel ? (
          <a href={`tel:${tel}`} className="block truncate tabular-nums text-foreground hover:text-primary">
            {displayPhone}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="truncate px-3 py-2.5 text-foreground">
        {orgName || <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="px-3 py-2.5 font-medium text-foreground">
        {stateCode || <span className="font-normal text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="px-2 py-2.5">
        <ContactActions {...props} />
      </TableCell>
    </TableRow>
  );
}

const menuItemClass =
  "inline-flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent";
