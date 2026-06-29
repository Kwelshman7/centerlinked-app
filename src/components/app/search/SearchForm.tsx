import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";
import { LEVELS_OF_CARE } from "@/components/app/facility/facility-types";
import { US_STATES } from "@/lib/us-states";

export function SearchForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [payerId, setPayerId] = useState<string | null>(params.get("payerId"));
  const [payerName, setPayerName] = useState(params.get("payerName") ?? "");
  const [state, setState] = useState(params.get("state") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [loc, setLoc] = useState(params.get("loc") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (payerId) q.set("payerId", payerId);
    if (payerName) q.set("payerName", payerName);
    if (state) q.set("state", state);
    if (city) q.set("city", city);
    if (loc) q.set("loc", loc);
    navigate(`/app/search/results?${q.toString()}`);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Insurance</Label>
        <PayerCombobox
          payerId={payerId}
          payerName={payerName}
          onSelect={(p) => { setPayerId(p.id); setPayerName(p.name); }}
          placeholder="Any insurance"
          triggerClassName="w-full"
          approvedOnly
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>State</Label>
          <Select value={state || "_any"} onValueChange={(v) => setState(v === "_any" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Any state" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="_any">Any state</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any city" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Level of care</Label>
        <Select value={loc || "_any"} onValueChange={(v) => setLoc(v === "_any" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Any level of care" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_any">Any level of care</SelectItem>
            {LEVELS_OF_CARE.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="lg" className="w-full">
        <SearchIcon className="h-4 w-4" /> Search facilities
      </Button>
    </form>
  );
}
