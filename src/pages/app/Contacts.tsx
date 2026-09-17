import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Plus, Search, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfessionalNetwork } from "@/hooks/useProfessionalNetwork";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConnectButton } from "@/components/app/network/ConnectButton";
import { ProfessionalRow } from "@/components/app/network/ProfessionalRow";
import {
  applyOrgPayers,
  CONTACT_TYPE_LABELS,
  CONTACT_TYPES,
  contactWorkspaceStats,
  filterWorkspaceContacts,
  mergeWorkspaceContacts,
  uniqueContactStates,
  type ContactType,
  type FacilityBdInput,
  type RepresentativeInput,
  type WorkspaceContact,
  type WorkspaceContactOrg,
} from "@/lib/contact-workspace";
import {
  asProfessionalCards,
  connectShareUrl,
  compareNameSearch,
  initialsFromName,
  professionalPath,
  type ProfessionalCard,
} from "@/lib/professional-network";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { isPartnerVisibleFacility } from "@/lib/facility-visibility";

const PAGE_SIZE = 20;
const FETCH_PAGE = 1000;
const ANY = "all";

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

export default function Contacts() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const hasOrg = Boolean(profile?.organization_id);
  const { connections, requests, loading: networkLoading, requestConnection, respondToRequest, reload } =
    useProfessionalNetwork();
  const { partners, partnerOrgIds, loading: partnersLoading } = useReferralNetwork();
  const partnerKey = useMemo(() => [...partnerOrgIds].sort().join(","), [partnerOrgIds]);
  const [reps, setReps] = useState<RepresentativeInput[]>([]);
  const [facilities, setFacilities] = useState<FacilityBdInput[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ContactType | typeof ANY>(ANY);
  const [state, setState] = useState(ANY);
  const [insurance, setInsurance] = useState(ANY);
  const [page, setPage] = useState(1);
  const [payerByOrg, setPayerByOrg] = useState<Record<string, string[]>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [findQ, setFindQ] = useState("");
  const [directory, setDirectory] = useState<ProfessionalCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const merged = useMemo(
    () =>
      mergeWorkspaceContacts({
        connections,
        representatives: [...reps, ...partnerReps],
        facilities,
        viewerOrgId: profile?.organization_id ?? null,
      }),
    [connections, reps, partnerReps, facilities, profile?.organization_id],
  );

  const contacts = useMemo(() => {
    const withPayers = applyOrgPayers(merged, payerByOrg);
    if (!partners.length) return withPayers;
    const byOrg = new Map(partners.map((partner) => [partner.id, partner]));
    return withPayers.map((contact) => {
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
    });
  }, [merged, payerByOrg, partners]);

  const filtered = useMemo(
    () =>
      filterWorkspaceContacts(contacts, {
        query,
        type,
        state,
        insurance: insurance === ANY ? "" : insurance,
      }),
    [contacts, query, type, state, insurance],
  );

  const stats = useMemo(() => contactWorkspaceStats(contacts), [contacts]);
  const states = useMemo(() => uniqueContactStates(contacts), [contacts]);
  const payerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const contact of contacts) {
      for (const payer of contact.payers) set.add(payer);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const missingOrgKey = pageRows
    .filter((row) => row.organization?.id && row.payers.length === 0 && !payerByOrg[row.organization.id])
    .map((row) => row.organization!.id)
    .sort()
    .join(",");

  useEffect(() => {
    setPage(1);
  }, [query, type, state, insurance]);

  useEffect(() => {
    if (!missingOrgKey) return;
    const missing = missingOrgKey.split(",");
    let cancelled = false;
    (async () => {
      const { data: facs, error: facError } = await supabase
        .from("facilities")
        .select("id,organization_id")
        .in("organization_id", missing)
        .eq("verification_status", "approved")
        .eq("verification_frozen", false);
      if (cancelled || facError) return;
      const facilityIds = (facs ?? []).map((row) => row.id);
      const orgByFacility = new Map((facs ?? []).map((row) => [row.id, row.organization_id as string]));
      if (!facilityIds.length) {
        setPayerByOrg((current) => {
          const next = { ...current };
          for (const id of missing) next[id] = next[id] ?? [];
          return next;
        });
        return;
      }
      const { data: contracts, error: contractError } = await supabase
        .from("insurance_contracts")
        .select("facility_id,payer_name,in_network")
        .in("facility_id", facilityIds)
        .eq("in_network", true);
      if (cancelled || contractError) return;
      const grouped: Record<string, string[]> = {};
      for (const id of missing) grouped[id] = [];
      for (const row of contracts ?? []) {
        const orgId = orgByFacility.get(row.facility_id);
        const name = row.payer_name?.trim();
        if (!orgId || !name) continue;
        if (!grouped[orgId]) grouped[orgId] = [];
        if (!grouped[orgId].some((item) => item.toLowerCase() === name.toLowerCase())) grouped[orgId].push(name);
      }
      setPayerByOrg((current) => ({ ...current, ...grouped }));
    })();
    return () => {
      cancelled = true;
    };
  }, [missingOrgKey]);

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

  const copyMyLink = async () => {
    if (!user) return;
    const url = connectShareUrl(window.location.origin, user.id);
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

  const loading = networkLoading || catalogLoading || partnersLoading;
  const connectedIds = useMemo(() => new Set(connections.map((person) => person.user_id)), [connections]);
  const findMatches = directory.filter((person) => person.user_id !== user?.id);

  const clearFilters = () => {
    setQuery("");
    setType(ANY);
    setState(ANY);
    setInsurance(ANY);
  };

  const openContact = async (contact: WorkspaceContact) => {
    let userId = contact.userId;
    if (!userId) {
      const needle = contact.email || contact.fullName;
      if (needle) {
        const { data } = await supabase.rpc("search_professionals", { _query: needle });
        const match = asProfessionalCards(data).find((person) => {
          const email = person.email?.trim().toLowerCase();
          if (contact.email && email && email === contact.email.trim().toLowerCase()) return true;
          return (person.full_name || "").trim().toLowerCase() === contact.fullName.trim().toLowerCase();
        });
        userId = match?.user_id ?? null;
      }
    }
    if (userId) {
      navigate(professionalPath(userId));
      return;
    }
    navigate(`/app/contacts/${encodeURIComponent(contact.id)}`);
  };

  return (
    <div className="min-w-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold">Contacts</h1>
            <p className="text-xs text-muted-foreground">
              {stats.total.toLocaleString("en-US")}{" "}
              {stats.total === 1 ? "person" : "people"} you work with
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="h-4 w-4" /> Add Contact
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                onClick={() => setAddOpen(true)}
              >
                <Search className="h-4 w-4" /> Find a professional
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                onClick={() => void copyMyLink()}
              >
                <Share2 className="h-4 w-4" /> Share my connect link
              </button>
            </PopoverContent>
          </Popover>
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

        <div className="flex flex-col gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, organization, phone, or email"
                className="h-8 pl-9"
              />
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Select value={type} onValueChange={(value) => setType(value as ContactType | typeof ANY)}>
              <SelectTrigger className="h-8 w-full min-w-0 sm:w-[9.5rem]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All types</SelectItem>
                {CONTACT_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CONTACT_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="h-8 w-full min-w-0 sm:w-[7.5rem]">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All states</SelectItem>
                {states.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={insurance} onValueChange={setInsurance}>
              <SelectTrigger className="h-8 w-full min-w-0 sm:w-[10rem]">
                <SelectValue placeholder="All insurance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All insurance</SelectItem>
                {payerOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 shrink-0 justify-self-start px-2">
              Clear
            </Button>
            </div>
        </div>

        <Card className="min-w-0 overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pageRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground space-y-3">
              {contacts.length === 0 ? (
                <>
                  <p>
                    {hasOrg
                      ? "Your list is empty. Find a professional, or add a partner organization so their BD contacts show up here."
                      : "Your list is empty. Find a professional to connect — you can search who accepts what insurance anytime."}
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
                <p>No contacts match these filters.</p>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/60 lg:hidden">
                {pageRows.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left active:bg-accent/60"
                    onClick={() => openContact(contact)}
                  >
                    <ContactAvatar contact={contact} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-snug">{contact.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.organization?.name || "—"}
                      </p>
                      {contact.phone || contact.email ? (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {[formatPhoneDisplay(contact.phone) || contact.phone, contact.email].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
              <div className="hidden min-w-0 overflow-x-auto lg:block">
              <Table className="min-w-[44rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[14rem]">Name</TableHead>
                    <TableHead className="min-w-[12rem]">Organization</TableHead>
                    <TableHead className="min-w-[9rem]">Phone</TableHead>
                    <TableHead className="min-w-[12rem]">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((contact) => (
                    <TableRow
                      key={contact.id}
                      tabIndex={0}
                      className="group cursor-pointer"
                      onClick={() => openContact(contact)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openContact(contact);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ContactAvatar contact={contact} />
                          <div className="min-w-0">
                            <p className="font-medium leading-snug whitespace-normal break-words group-hover:text-primary">
                              {contact.fullName}
                            </p>
                            {contact.title ? (
                              <p className="text-xs text-muted-foreground whitespace-normal break-words">
                                {contact.title}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words">
                        {contact.organization?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <ContactPhone contact={contact} />
                      </TableCell>
                      <TableCell>
                        <ContactEmail contact={contact} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} contacts
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
            </>
          )}
        </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Find a professional</DialogTitle>
            <DialogDescription>
              Connect with people already on CenterLinked. This is not a private rolodex — invite them, or share your
              connect link.
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
              <p className="py-6 text-sm text-muted-foreground">No professionals match that search.</p>
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

function ContactAvatar({ contact }: { contact: WorkspaceContact }) {
  const src = contact.avatarUrl || contact.organization?.logo_url;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initialsFromName(contact.fullName)}
    </div>
  );
}

function ContactPhone({ contact }: { contact: WorkspaceContact }) {
  const tel = sanitizePhone(contact.phone);
  const display = formatPhoneDisplay(contact.phone) || contact.phone;
  if (!tel) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={`tel:${tel}`}
      className="whitespace-nowrap text-primary hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {display}
    </a>
  );
}

function ContactEmail({ contact }: { contact: WorkspaceContact }) {
  const email = contact.email?.trim();
  if (!email) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={`mailto:${email}`}
      className="break-all text-primary hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {email}
    </a>
  );
}
