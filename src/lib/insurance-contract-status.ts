import {
  CONTRACT_TO_PAYER,
  findPayerByName,
  isNonPayerLabel,
  normalizePayerName,
  type PayerMatchInput,
} from "./match-payer.ts";
import { sanitizePlanTypes } from "./plan-types.ts";

/** Stored on `insurance_contracts.contract_status`. Missing row ≠ out of network. */
export const CONTRACT_STATUSES = [
  "active",
  "inactive",
  "pending_verification",
  "unknown",
  "out_of_network",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** Public search/display status for a structured insurance match. */
export const INSURANCE_MATCH_STATUSES = [
  "verified",
  "reported",
  "pending",
  "out_of_network",
  "unknown",
  "self_pay",
] as const;

export type InsuranceMatchStatus = (typeof INSURANCE_MATCH_STATUSES)[number];

export const VERIFICATION_METHODS = [
  "bd_confirmation",
  "payer_portal",
  "contract_document",
  "phone",
  "email",
  "other",
] as const;

export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

const STATUS_SET = new Set<string>(CONTRACT_STATUSES);
const METHOD_SET = new Set<string>(VERIFICATION_METHODS);

export function isContractStatus(value: string | null | undefined): value is ContractStatus {
  return !!value && STATUS_SET.has(value);
}

export function parseContractStatus(raw: string | null | undefined): ContractStatus | null {
  const value = (raw ?? "").trim().toLowerCase();
  return isContractStatus(value) ? value : null;
}

export function isVerificationMethod(value: string | null | undefined): value is VerificationMethod {
  return !!value && METHOD_SET.has(value);
}

export function parseVerificationMethod(raw: string | null | undefined): VerificationMethod | null {
  const value = (raw ?? "").trim().toLowerCase();
  return isVerificationMethod(value) ? value : null;
}

/** in_network stays true only for claimed in-network statuses. */
export function inNetworkFromStatus(status: ContractStatus): boolean {
  return status === "active" || status === "pending_verification";
}

export function statusFromInNetwork(inNetwork: boolean | null | undefined): ContractStatus {
  if (inNetwork === true) return "active";
  if (inNetwork === false) return "out_of_network";
  return "unknown";
}

export function sanitizeCoveredStates(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const state = item.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state) || seen.has(state)) continue;
    seen.add(state);
    out.push(state);
  }
  return out;
}

export function sanitizeLevelsOfCareCovered(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (!value || value.length > 80 || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    out.push(value);
  }
  return out.slice(0, 40);
}

export interface InsuranceContractRecord {
  payer_id?: string | null;
  payer_name?: string | null;
  in_network?: boolean | null;
  contract_status?: string | null;
  plan_types?: string[] | null;
  verified_at?: string | null;
  verification_method?: string | null;
}

export interface InsuranceMatch {
  status: InsuranceMatchStatus;
  label: string;
  payerName: string | null;
  planTypes: string[];
  verifiedAt: string | null;
}

const MATCH_LABELS: Record<InsuranceMatchStatus, string> = {
  verified: "Verified in network",
  reported: "Reported in network",
  pending: "Pending verification",
  out_of_network: "Out of network",
  unknown: "Insurance unknown",
  self_pay: "Self-pay only",
};

/**
 * Public match status for a structured contract.
 * A facility-level stamp is not enough to call a specific payer verified.
 */
export function insuranceMatchFromContract(
  contract: InsuranceContractRecord | null | undefined,
  options?: { selfPayOnly?: boolean | null },
): InsuranceMatch {
  if (options?.selfPayOnly && !contract) {
    return {
      status: "self_pay",
      label: MATCH_LABELS.self_pay,
      payerName: null,
      planTypes: [],
      verifiedAt: null,
    };
  }

  if (!contract) {
    return {
      status: "unknown",
      label: MATCH_LABELS.unknown,
      payerName: null,
      planTypes: [],
      verifiedAt: null,
    };
  }

  const status =
    parseContractStatus(contract.contract_status) ?? statusFromInNetwork(contract.in_network);
  const payerName = contract.payer_name?.trim() || null;
  const planTypes = sanitizePlanTypes(contract.plan_types);
  const verifiedAt = contract.verified_at?.trim() || null;

  if (status === "out_of_network") {
    return {
      status: "out_of_network",
      label: MATCH_LABELS.out_of_network,
      payerName,
      planTypes,
      verifiedAt: null,
    };
  }
  if (status === "pending_verification") {
    return {
      status: "pending",
      label: MATCH_LABELS.pending,
      payerName,
      planTypes,
      verifiedAt: null,
    };
  }
  if (status === "unknown" || status === "inactive") {
    return {
      status: "unknown",
      label: status === "inactive" ? "Contract inactive" : MATCH_LABELS.unknown,
      payerName,
      planTypes,
      verifiedAt: null,
    };
  }

  if (verifiedAt) {
    return {
      status: "verified",
      label: MATCH_LABELS.verified,
      payerName,
      planTypes,
      verifiedAt,
    };
  }

  return {
    status: "reported",
    label: MATCH_LABELS.reported,
    payerName,
    planTypes,
    verifiedAt: null,
  };
}

export function insuranceMatchLabel(status: InsuranceMatchStatus): string {
  return MATCH_LABELS[status];
}

export const OUT_OF_NETWORK_ONLY_LABEL = "Out of Network Only";

/** True when the facility has no in-network contract. A missing load is not this list. */
export function isOutOfNetworkOnlyFacility(
  contracts: Array<{ in_network?: boolean | null }>,
  options?: { selfPayOnly?: boolean | null },
): boolean {
  if (options?.selfPayOnly) return false;
  return !contracts.some((contract) => contract.in_network);
}

/**
 * Bulk-link helper. Exact name, alias, or known map only.
 * Does not use contains/fuzzy matching — uncertain labels stay unlinked.
 */
export function resolvePayerStrict(
  payerName: string,
  payers: PayerMatchInput[],
): PayerMatchInput | null {
  const trimmed = payerName.trim();
  if (!trimmed || isNonPayerLabel(trimmed)) return null;

  const norm = normalizePayerName(trimmed);
  if (norm.length < 4) return null;

  const mapped = CONTRACT_TO_PAYER[norm];
  if (mapped) {
    const byMap = findPayerByName(mapped, payers);
    if (byMap) return byMap;
  }

  const exactName = findPayerByName(trimmed, payers);
  if (exactName) return exactName;

  return (
    payers.find((payer) =>
      (payer.aliases ?? []).some((alias) => normalizePayerName(alias) === norm),
    ) ?? null
  );
}

export function isNonCanonicalInsuranceLabel(name: string): boolean {
  return isNonPayerLabel(name);
}
