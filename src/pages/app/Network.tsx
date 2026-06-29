import { ReferralNetworkPanel } from "@/components/app/network/ReferralNetworkPanel";
import { Users } from "lucide-react";

export default function Network() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="space-y-1 pt-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Your Referral Network
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Preferred partners show up first when you search. Add organizations you trust to refer patients to.
        </p>
      </div>
      <ReferralNetworkPanel />
    </div>
  );
}
