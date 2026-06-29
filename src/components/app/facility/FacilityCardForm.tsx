import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/app/ImageUploader";
import { CheckCircle2, Trash2, Plus, Sparkles, X } from "lucide-react";
import {
  FacilityDraft,
  HIGHLIGHT_OPTIONS,
  LEVELS_OF_CARE,
  POPULATION_OPTIONS,
  SPECIALIZATION_OPTIONS,
  ACCREDITATION_OPTIONS,
} from "./facility-types";
import { PayerCombobox } from "./PayerCombobox";

interface Props {
  value: FacilityDraft;
  onChange: (next: FacilityDraft) => void;
  onRemove?: () => void;
  index?: number;
}

export function FacilityCardForm({ value, onChange, onRemove, index }: Props) {
  const set = <K extends keyof FacilityDraft>(k: K, v: FacilityDraft[K]) =>
    onChange({ ...value, [k]: v });

  const toggleArr = (
    key: "levels_of_care" | "highlights" | "population_served" | "specializations" | "accreditations",
    item: string,
  ) => {
    const cur = value[key];
    set(key, cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]);
  };

  const addCustomHighlight = () => {
    const v = value.custom_highlight.trim();
    if (!v) return;
    if (!value.highlights.includes(v)) {
      onChange({ ...value, highlights: [...value.highlights, v], custom_highlight: "" });
    } else {
      set("custom_highlight", "");
    }
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
            <Input value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Flyland Recovery — Boca" />
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

        {/* Population Served */}
        <div className="space-y-2">
          <Label>Population served</Label>
          <div className="flex flex-wrap gap-1.5">
            {POPULATION_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggleArr("population_served", p)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  value.population_served.includes(p)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Type of Therapy */}
        <div className="space-y-2">
          <Label>Type of therapy</Label>
          <div className="flex flex-wrap gap-1.5">
            {SPECIALIZATION_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleArr("specializations", s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  value.specializations.includes(s)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <Label>Amenities</Label>
          <div className="flex flex-wrap gap-1.5">
            {HIGHLIGHT_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => toggleArr("highlights", h)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  value.highlights.includes(h)
                    ? "bg-accent text-accent-foreground border-primary/40"
                    : "bg-background border-border hover:border-primary/40"
                }`}
              >
                {h}
              </button>
            ))}
            {value.highlights
              .filter((h) => !HIGHLIGHT_OPTIONS.includes(h as typeof HIGHLIGHT_OPTIONS[number]))
              .map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleArr("highlights", h)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border bg-accent text-accent-foreground border-primary/40"
                >
                  {h} ×
                </button>
              ))}
          </div>
          <div className="flex gap-2 pt-1">
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
        </div>

        {/* Accreditations */}
        <div className="space-y-2">
          <Label>Accreditations</Label>
          <div className="flex flex-wrap gap-1.5">
            {ACCREDITATION_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleArr("accreditations", a)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  (value.accreditations ?? []).includes(a)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {a}
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
              {value.contracts.length > 0 && (
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  {value.contracts.length} selected
                </span>
              )}
            </div>
            <PayerCombobox
              payerId={null}
              payerName=""
              onSelect={addContract}
              placeholder="Search and add payer"
              keepOpenOnSelect
              triggerClassName="w-full bg-background"
            />
            {value.contracts.length === 0 ? (
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

          {/* BD rep */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <Label className="text-sm">Assigned BD rep</Label>
            <div className="space-y-2.5">
              <Input placeholder="Full name" value={value.bd_contact_name} onChange={(e) => set("bd_contact_name", e.target.value)} />
              <Input placeholder="Phone" value={value.bd_contact_phone} onChange={(e) => set("bd_contact_phone", e.target.value)} />
              <Input placeholder="Email" type="email" value={value.bd_contact_email} onChange={(e) => set("bd_contact_email", e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
