import { supabase } from "@/integrations/supabase/client";
import {
  inNetworkFromStatus,
  isNonCanonicalInsuranceLabel,
  parseContractStatus,
  parseVerificationMethod,
  resolvePayerStrict,
  sanitizeCoveredStates,
  sanitizeLevelsOfCareCovered,
  type ContractStatus,
  type VerificationMethod,
} from "@/lib/insurance-contract-status";
import { sanitizePlanTypes } from "@/lib/plan-types";
import type { PayerMatchInput } from "@/lib/match-payer";
import { recordVerificationEvent } from "@/lib/record-verification-event";

export interface AdminContractWrite {
  facilityId: string;
  payerId: string | null;
  payerName: string;
  contractStatus: ContractStatus;
  planTypes?: string[];
  networkName?: string | null;
  levelsOfCareCovered?: string[];
  coveredStates?: string[];
  effectiveDate?: string | null;
  terminationDate?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  verificationMethod?: VerificationMethod | null;
  internalNotes?: string | null;
  publicNotes?: string | null;
  originalImportedValue?: string | null;
}

function trimOrNull(value: string | null | undefined, max: number): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function contractWritePayload(input: AdminContractWrite) {
  const payerName = input.payerName.trim();
  const status = parseContractStatus(input.contractStatus);
  if (!payerName) return { ok: false as const, error: "Payer name is required" };
  if (!status) return { ok: false as const, error: "Contract status is required" };

  return {
    ok: true as const,
    row: {
      facility_id: input.facilityId,
      payer_id: input.payerId,
      payer_name: payerName.slice(0, 200),
      contract_status: status,
      in_network: inNetworkFromStatus(status),
      plan_types: sanitizePlanTypes(input.planTypes),
      network_name: trimOrNull(input.networkName, 160),
      levels_of_care_covered: sanitizeLevelsOfCareCovered(input.levelsOfCareCovered),
      covered_states: sanitizeCoveredStates(input.coveredStates),
      effective_date: trimOrNull(input.effectiveDate, 10),
      termination_date: trimOrNull(input.terminationDate, 10),
      verified_at: status === "active" ? trimOrNull(input.verifiedAt, 40) : null,
      verified_by: status === "active" ? input.verifiedBy ?? null : null,
      verification_method:
        status === "active" ? parseVerificationMethod(input.verificationMethod) : null,
      internal_notes: trimOrNull(input.internalNotes, 4000),
      notes: trimOrNull(input.publicNotes, 2000),
      original_imported_value: trimOrNull(input.originalImportedValue, 500) ?? payerName.slice(0, 200),
    },
  };
}

export async function upsertAdminInsuranceContract(
  input: AdminContractWrite & { id?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = contractWritePayload(input);
  if (!payload.ok) return payload;

  if (input.id) {
    const { error } = await supabase
      .from("insurance_contracts")
      .update(payload.row)
      .eq("id", input.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase.from("insurance_contracts").insert(payload.row);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setFacilitySelfPayOnly(
  facilityId: string,
  selfPayOnly: boolean,
  actorId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("facilities")
    .update({ self_pay_only: selfPayOnly })
    .eq("id", facilityId);
  if (error) return { ok: false, error: error.message };
  await recordVerificationEvent({
    facilityId,
    entityType: "facility",
    action: selfPayOnly ? "marked_self_pay" : "updated",
    actorId,
    notes: selfPayOnly ? "Marked self-pay only" : "Cleared self-pay only",
  });
  return { ok: true };
}

export async function recordContractVerification(args: {
  contractId: string;
  facilityId: string;
  userId: string;
  method: VerificationMethod;
  publicNotes?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const method = parseVerificationMethod(args.method);
  if (!method) return { ok: false, error: "Verification method is required" };

  const { error } = await supabase
    .from("insurance_contracts")
    .update({
      contract_status: "active",
      in_network: true,
      verified_at: new Date().toISOString(),
      verified_by: args.userId,
      verification_method: method,
      notes: trimOrNull(args.publicNotes, 2000),
    })
    .eq("id", args.contractId);
  if (error) return { ok: false, error: error.message };
  await recordVerificationEvent({
    facilityId: args.facilityId,
    entityType: "insurance_contract",
    entityId: args.contractId,
    action: "confirmed",
    method,
    actorId: args.userId,
    notes: args.publicNotes,
  });
  return { ok: true };
}

export interface BulkLinkResult {
  linked: number;
  skipped: number;
  review: { contractId: string; payerName: string; reason: string }[];
}

export async function bulkLinkCanonicalPayers(
  contracts: { id: string; payer_id: string | null; payer_name: string }[],
  payers: PayerMatchInput[],
): Promise<BulkLinkResult | { ok: false; error: string }> {
  const review: BulkLinkResult["review"] = [];
  let linked = 0;
  let skipped = 0;

  for (const contract of contracts) {
    if (contract.payer_id) {
      skipped += 1;
      continue;
    }
    if (isNonCanonicalInsuranceLabel(contract.payer_name)) {
      review.push({
        contractId: contract.id,
        payerName: contract.payer_name,
        reason: "Non-payer label — review manually",
      });
      continue;
    }
    const resolved = resolvePayerStrict(contract.payer_name, payers);
    if (!resolved) {
      review.push({
        contractId: contract.id,
        payerName: contract.payer_name,
        reason: "No exact canonical match",
      });
      continue;
    }

    const { error } = await supabase
      .from("insurance_contracts")
      .update({
        payer_id: resolved.id,
        payer_name: resolved.name,
        original_imported_value: contract.payer_name,
      })
      .eq("id", contract.id)
      .is("payer_id", null);
    if (error) return { ok: false, error: error.message };
    linked += 1;
  }

  return { linked, skipped, review };
}
