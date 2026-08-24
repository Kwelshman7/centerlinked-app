import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/app/ImageUploader";
import { CheckCircle2, Trash2, Plus, Sparkles, X, EyeOff } from "lucide-react";
import {
  FacilityDraft,
  LEVELS_OF_CARE,
  ACCREDITATION_OPTIONS,
} from "./facility-types";
import { accreditationKey, uniqueAccreditations } from "@/lib/accreditations";
import {
  extraProgramTags,
  categorizeFacilityTags,
  hasProgramTag,
  persistProgramTags,
  PROGRAM_OPTIONS,
  PROGRAM_SECTIONS,
  toggleProgramTag,
  type ProgramTagKind,
} from "@/lib/facility-program-tags";
import { PayerCombobox } from "./PayerCombobox";
import { FacilityBdRepFields } from "./FacilityBdRepFields";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  value: FacilityDraft;
  onChange: (next: FacilityDraft) => void;
  onRemove?: () => void;
  index?: number;
  /** When set, BD assignment offers a team-member picker. */
  organizationId?: string | null;
  /** Hide insurance edits when the current contract list could not be loaded. */
  contractsDisabled?: boolean;
}

export function FacilityCardForm({ value, onChange, onRemove, index, organizationId, contractsDisabled }: Props) {
  const { isFacilityAdmin, isSuperAdmin } = useAuth();
  const canManageVisibility = isFacilityAdmin || isSuperAdmin;
  const set = <K extends keyof FacilityDraft>(k: K, v: FacilityDraft[K]) =>
    onChange({ ...value, [k]: v });

  const programTags = categorizeFacilityTags(value);

  const toggleArr = (
    key: "levels_of_care" | "accreditations",
    item: string,
  ) => {
    const cur = value[key];
    if (key === "accreditations") {
      const itemKey = accreditationKey(item);
      const isOn = cur.some((x) => accreditationKey(x) === itemKey);
      const next = isOn ? cur.filter((x) => accreditationKey(x) !== itemKey) : [...cur, item];
      set(key, uniqueAccreditations(next));
      return;
    }
    set(key, cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]);
  };

  const setProgramKind = (kind: ProgramTagKind, items: string[]) => {
    onChange({
      ...value,
      ...persistProgramTags({ ...programTags, [kind]: items }),
    });
  };

  const toggleProgramKind = (kind: ProgramTagKind, item: string) => {
    setProgramKind(kind, toggleProgramTag(programTags[kind], item));
  };

  const addCustomHighlight = () => {
    const v = value.custom_highlight.trim();
    if (!v) return;
    if (hasProgramTag(programTags.amenities, v)) {
      set("custom_highlight", "");
      return;
    }
    onChange({
      ...value,
      ...persistProgramTags({
        ...programTags,
        amenities: [...programTags.amenities, v],
      }),
      custom_highlight: "",
    });
  };

  const addContract = (payer: { id: string | null; name: string; pending?: boolean }) => {
    const payerName = payer.name.trim();
    if (!payerName) return;

    const exists = value.contracts.some((c) => {
      if (payer.id && c.payer_id === payer.id) return true;
      return c.payer_name.trim().toLowerCase() === payerName.toLowerCase();
    });

    if (!exists) {
      set("contracts", [
        ...value.contracts,
        { payer_id: payer.id, payer_name: payerName, in_network: true, pending: payer.pending },
      ]);
    }
  };
  const removeContract = (i: number) =>
    set("contracts", value.contracts.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden animate-fade-up">
      {/* Minimal header — only shown when removable (multi-facility context) */}
      {onRemove && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
              {typeof index === "number" ? index + 1 : <Sparkles className="h-3.5 w-3.5" />}
            </div>
            <p className="text-sm font-medium truncate text-muted-foreground">
              {value.name || "New facility"}
            </p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove} className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-5">
        {/* Basics */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Facility name</Label>
            <Input value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Facility name" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tagline</Label>
            <Input value={value.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Luxury oceanfront residential treatment" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={value.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input type="url" placeholder="https://" value={value.website} onChange={(e) => set("website", e.target.value)} />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2.5">
          <Input placeholder="Street address" value={value.address_line1} onChange={(e) => set("address_line1", e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Input className="col-span-2 sm:col-span-1" placeholder="City" value={value.city} onChange={(e) => set("city", e.target.value)} />
            <Input placeholder="State" value={value.state} onChange={(e) => set("state", e.target.value)} />
            <Input placeholder="ZIP" value={value.zip} onChange={(e) => set("zip", e.target.value)} />
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-1.5">
          <Label>Photos</Label>
          <ImageUploader bucket="facility-images" value={value.image_urls} onChange={(v) => set("image_urls", v)} max={8} />
        </div>

        {/* Visibility changes affect the shared public profile and require an org admin. */}
        {canManageVisibility && (
          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3.5 flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                <Label htmlFor="hidden-from-org-page" className="text-sm font-semibold cursor-pointer">
                  Hide from organization profile
                </Label>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep this facility in your account, but don’t show it on the shared org page.
              </p>
            </div>
            <Switch
              id="hidden-from-org-page"
              checked={value.hidden_from_org_page}
              onCheckedChange={(checked) => set("hidden_from_org_page", checked)}
              className="mt-0.5 shrink-0"
            />
          </div>
        )}

        {/* Levels of care */}
        <div className="space-y-2">
          <Label>Levels of care</Label>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS_OF_CARE.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleArr("levels_of_care", l)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  value.levels_of_care.includes(l)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAM_SECTIONS.map(({ kind, title }) => {
            const options = PROGRAM_OPTIONS[kind];
            const selected = programTags[kind];
            const extras = extraProgramTags(selected, options);
            return (
              <div
                key={kind}
                className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2.5"
              >
                <Label className="text-sm font-bold tracking-tight">{title}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((opt) => {
                    const on = hasProgramTag(selected, opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleProgramKind(kind, opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/40 hover:bg-accent"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                  {extras.map((extra) => (
                    <button
                      key={extra}
                      type="button"
                      onClick={() => toggleProgramKind(kind, extra)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border bg-primary text-primary-foreground border-primary"
                    >
                      {extra} ×
                    </button>
                  ))}
                </div>
                {kind === "amenities" && (
                  <div className="flex gap-2 pt-0.5">
                    <Input
                      placeholder="Add a custom amenity"
                      value={value.custom_highlight}
                      onChange={(e) => set("custom_highlight", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomHighlight();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomHighlight}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Accreditations */}
        <div className="space-y-2">
          <Label>Accreditations</Label>
          <p className="text-xs text-muted-foreground">Shown on the public facility page hero.</p>
          <div className="flex flex-wrap gap-1.5">
            {ACCREDITATION_OPTIONS.map((a) => {
              const selected = (value.accreditations ?? []).some(
                (x) => accreditationKey(x) === accreditationKey(a),
              );
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArr("accreditations", a)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  {a}
                </button>
              );
            })}
            {(value.accreditations ?? [])
              .filter(
                (stored) =>
                  !ACCREDITATION_OPTIONS.some((opt) => accreditationKey(opt) === accreditationKey(stored)),
              )
              .map((stored) => (
                <button
                  key={stored}
                  type="button"
                  onClick={() => toggleArr("accreditations", stored)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border bg-primary text-primary-foreground border-primary"
                  title="Click to remove"
                >
                  {stored} ×
                </button>
              ))}
          </div>
        </div>

        {/* Description + capacity */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>About</Label>
            <Textarea rows={4} value={value.description} onChange={(e) => set("description", e.target.value)} placeholder="What makes this facility special — programs, philosophy, who you help best." />
          </div>
          <div className="space-y-1.5">
            <Label>Bed capacity</Label>
            <Input type="number" min="0" value={value.capacity} onChange={(e) => set("capacity", e.target.value)} />
          </div>
        </div>

        {/* Two matching panels for visual symmetry */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Insurance contracts */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">In-network insurance</Label>
              {!contractsDisabled && value.contracts.length > 0 && (
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  {value.contracts.length} selected
                </span>
              )}
            </div>
            {contractsDisabled ? (
              <p className="text-xs text-muted-foreground py-1">
                Insurance is locked until the current contracts finish loading. A failed load leaves
                existing payers unchanged.
              </p>
            ) : (
              <PayerCombobox
                payerId={null}
                payerName=""
                onSelect={addContract}
                placeholder="Search and add payer"
                keepOpenOnSelect
                triggerClassName="w-full bg-background"
              />
            )}
            {contractsDisabled ? null : value.contracts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">No in-network payers selected yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {value.contracts.map((c, i) => (
                  <li
                    key={`${c.payer_id ?? c.payer_name}-${i}`}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.payer_name}</span>
                    {c.pending && <span className="text-warning">pending</span>}
                    <button
                      type="button"
                      onClick={() => removeContract(i)}
                      className="ml-0.5 rounded-full p-0.5 text-success/80 transition-colors hover:bg-success/15 hover:text-success"
                      aria-label={`Remove ${c.payer_name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FacilityBdRepFields
            organizationId={organizationId}
            value={{
              bd_contact_name: value.bd_contact_name,
              bd_contact_phone: value.bd_contact_phone,
              bd_contact_email: value.bd_contact_email,
            }}
            onChange={(next) =>
              onChange({
                ...value,
                bd_contact_name: next.bd_contact_name,
                bd_contact_phone: next.bd_contact_phone,
                bd_contact_email: next.bd_contact_email,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
